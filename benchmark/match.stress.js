import chalk from 'chalk';
import Extreme from '../dist/index.js';
import { param, wildcard } from '../dist/index.js';
import crypto from 'crypto'; // For generating random-ish strings
import minimist from 'minimist';

// --- Argument Parsing ---
const args = minimist(process.argv.slice(2));
const routeCountArg = args.routes; // Get the --routes argument

console.log(chalk.cyan('Setting up Extreme Router stress test...'));

// --- Configuration ---
const stressDurationSeconds = 20; // How long to run the stress test (e.g., 10 seconds)
const concurrencyLevel = 50; // Number of concurrent operations to simulate
// Use the --routes argument if provided and valid, otherwise default to 25
const routeCount = typeof routeCountArg === 'number' && routeCountArg > 0 ? routeCountArg : 25;
console.log(chalk.cyan(`Using ${chalk.yellow(routeCount)} routes (Default: 25, use --routes <number> to override)`));
const staticRatio = 0.7;
const dynamicParamRatio = 0.25;

// --- Route Generation (Copied from benchmark for consistency) ---
const routes = [];
const staticCount = Math.floor(routeCount * staticRatio);
const dynamicParamCount = Math.floor(routeCount * dynamicParamRatio);
// Removed dynamicOptionalCount calculation
const dynamicWildcardCount = routeCount - staticCount - dynamicParamCount; // Adjusted calculation

// Static Routes
routes.push('/');
routes.push('/users');
routes.push('/repos');
routes.push('/zen');
routes.push('/gitignore/templates');
routes.push('/licenses');
for (let i = routes.length; i < staticCount; i++) routes.push(`/static/route${i}/${i % 10}/${i % 5}`);
// Dynamic Param Routes
routes.push('/users/:username');
routes.push('/repos/:owner/:repo');
routes.push('/repos/:owner/:repo/issues/:issue_number');
routes.push('/orgs/:org/members');
routes.push('/teams/:team_id/members/:username');
const paramLoopCount = Math.max(0, dynamicParamCount - 5);
for (let i = 0; i < paramLoopCount; i++) routes.push(`/param/route${i}/:p${(i % 3) + 2}`);
// Removed the entire 'Dynamic Optional Param Routes' section
// Dynamic Wildcard Routes
routes.push('/search/*');
routes.push('/legacy/search/:query/*');
const wildcardLoopCount = Math.max(0, dynamicWildcardCount - 2);
for (let i = 0; i < wildcardLoopCount; i++) routes.push(`/wild/route${i}/*`);
// Shuffle routes
routes.sort(() => Math.random() - 0.5);
// Ensure exact count
while (routes.length < routeCount && routes.length > 0) routes.push(`/extra/static${routes.length}`);
if (routes.length > routeCount) routes.splice(routeCount);

console.log(chalk.blue(`Using ${routes.length} routes for stress test.`));

// --- Router Setup ---
const router = new Extreme();
router.use(param);
router.use(wildcard);
// Removed router.use(optionalParam);

console.log(chalk.yellow('Registering routes...'));
try {
  routes.forEach((route) => router.register(route));
  console.log(chalk.green('Routes registered successfully.'));
} catch (error) {
  console.error(chalk.red('Error registering routes:'), error);
  process.exit(1);
}

// --- Generate Test Paths from Registered Routes ---
console.log(chalk.yellow('Generating realistic test paths...'));
const testPaths = [];
const generateRandomString = (length = 8) =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
const generateRandomNumber = (max = 1000) => Math.floor(Math.random() * max) + 1;

routes.forEach((routePattern) => {
  let path = routePattern;

  // Removed optional param handling block

  // Handle regular params
  path = path.replace(/:[^/?*]+/g, (match) => {
    // Basic check if it looks like a number param
    if (match.toLowerCase().includes('id') || match.toLowerCase().includes('number')) {
      return generateRandomNumber().toString();
    }
    return generateRandomString();
  });

  // Handle wildcards
  path = path.replace(/\*/g, () => `${generateRandomString(5)}/${generateRandomString(3)}`);

  testPaths.push(path);
});

// Add some paths that *won't* match to test negative cases
for (let i = 0; i < routeCount * 0.1; i++) {
  // e.g., 10% non-matching paths
  testPaths.push(`/non/existent/path/${generateRandomString()}`);
}

// Shuffle the final list of test paths
testPaths.sort(() => Math.random() - 0.5);
console.log(chalk.blue(`Generated ${testPaths.length} test paths.`));

// --- Stress Test Logic ---
let totalMatches = 0;
let totalErrors = 0;
const startTime = Date.now();

// Function for a single "worker" to run match operations
async function stressWorker(workerId) {
  while (Date.now() - startTime < stressDurationSeconds * 1000) {
    // Pick a random path from the generated list
    const randomPath = testPaths[Math.floor(Math.random() * testPaths.length)];
    try {
      router.match(randomPath); // Match the generated path and store result
      totalMatches++; // Increment successful attempts
    } catch (error) {
      // Log errors more prominently during stress testing
      console.error(chalk.red(`Worker ${workerId} - Error matching path "${randomPath}":`), error);
      totalErrors++;
    }
  }
}

// Main function to run the stress test
async function runStressTest() {
  console.log(
    chalk.cyan(
      `\nStarting stress test for ${stressDurationSeconds} seconds with ${concurrencyLevel} concurrent workers...\n`,
    ),
  );
  console.log(chalk.cyan(`Matching against ${testPaths.length} generated paths.`));

  const workerPromises = [];
  for (let i = 0; i < concurrencyLevel; i++) {
    workerPromises.push(stressWorker(i + 1));
  }

  await Promise.all(workerPromises);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(chalk.blue('\n--- Stress Test Complete ---'));
  console.log(chalk.blue(`Target Duration: ${stressDurationSeconds} seconds`));
  console.log(chalk.blue(`Actual Duration: ${duration.toFixed(2)} seconds`));
  console.log(chalk.blue(`Concurrency Level: ${concurrencyLevel}`));
  console.log(chalk.green(`Total Matches Attempted: ${totalMatches.toLocaleString()}`));
  console.log(chalk.red(`Total Errors Encountered: ${totalErrors}`));

  if (totalErrors === 0) {
    console.log(chalk.green.bold('\nStress test passed with no errors.'));
  } else {
    console.log(chalk.yellow.bold('\nStress test finished with errors.'));
  }
}

// Run the test
runStressTest().catch((err) => {
  console.error(chalk.red.bold('Stress test runner failed unexpectedly:'), err);
  process.exit(1);
});
