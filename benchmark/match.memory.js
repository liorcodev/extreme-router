import chalk from 'chalk';
import Extreme from '../dist/index.js';
import { param, wildcard } from '../dist/index.js';
import minimist from 'minimist';

// --- Argument Parsing ---
const args = minimist(process.argv.slice(2));
const routeCountArg = args.routes; // Get the --routes argument

console.log(chalk.cyan('Setting up Extreme Router memory leak test...'));

// --- Configuration ---
const testDurationSeconds = 30; // How long to run the test (increase for better leak detection)
const sampleIntervalSeconds = 1; // How often to sample memory usage
// Use the --routes argument if provided and valid, otherwise default to 25
const routeCount = typeof routeCountArg === 'number' && routeCountArg > 0 ? routeCountArg : 25;
console.log(chalk.cyan(`Using ${chalk.yellow(routeCount)} routes (Default: 25, use --routes <number> to override)`));
const staticRatio = 0.7;
const dynamicParamRatio = 0.25;

// --- Route Generation (Copied from benchmark/stress) ---
const routes = [];
const staticCount = Math.floor(routeCount * staticRatio);
const dynamicParamCount = Math.floor(routeCount * dynamicParamRatio);
const dynamicWildcardCount = routeCount - staticCount - dynamicParamCount;
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

console.log(chalk.blue(`Using ${routes.length} routes for memory test.`));

// --- Router Setup ---
const router = new Extreme();
router.use(param);
router.use(wildcard);

console.log(chalk.yellow('Registering routes...'));
try {
  routes.forEach((route) => router.register(route));
  console.log(chalk.green('Routes registered successfully.'));
} catch (error) {
  console.error(chalk.red('Error registering routes:'), error);
  process.exit(1);
}

// --- Memory Test Logic ---
let totalMatches = 0;
let totalErrors = 0;
const memorySamples = [];
let testRunning = true;
let sampleIntervalId = null;
let matchLoopTimeoutId = null;

// Function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to sample memory
function sampleMemory() {
  if (!testRunning) return;
  const usage = process.memoryUsage();
  const heapUsed = usage.heapUsed;
  memorySamples.push({ timestamp: Date.now(), heapUsed });
  console.log(chalk.gray(`  [Memory Sample] Heap Used: ${formatBytes(heapUsed)}`));
}

// Function to run match operations continuously
function runMatchLoop() {
  if (!testRunning) return;
  try {
    // Run a batch of matches before yielding
    for (let i = 0; i < 1000; i++) {
      // Adjust batch size if needed
      if (!testRunning) break;
      const randomRoute = routes[Math.floor(Math.random() * routes.length)];
      router.match(randomRoute);
      totalMatches++;
    }
  } catch (error) {
    console.error(chalk.red(`Error during match loop:`), error);
    totalErrors++;
    // Decide if errors should stop the test
    // testRunning = false;
  }
  // Schedule the next batch
  if (testRunning) {
    matchLoopTimeoutId = setImmediate(runMatchLoop); // Use setImmediate for better event loop handling
  }
}

// Main function to run the memory test
async function runMemoryTest() {
  console.log(chalk.cyan(`\nStarting memory test for ${testDurationSeconds} seconds...`));
  console.log(chalk.cyan(`Sampling memory every ${sampleIntervalSeconds} seconds.`));

  const startTime = Date.now();

  // Start sampling
  console.log(chalk.yellow('\nInitial memory usage:'));
  sampleMemory(); // Initial sample
  sampleIntervalId = setInterval(sampleMemory, sampleIntervalSeconds * 1000);

  // Start the matching loop
  console.log(chalk.yellow('\nRunning match operations...'));
  runMatchLoop();

  // Stop the test after the duration
  await new Promise((resolve) => setTimeout(resolve, testDurationSeconds * 1000));

  // --- Test Cleanup & Reporting ---
  testRunning = false; // Signal loops to stop
  clearTimeout(matchLoopTimeoutId); // Clear pending match loop
  clearInterval(sampleIntervalId); // Stop memory sampling

  console.log(chalk.yellow('\nFinal memory usage:'));
  sampleMemory(); // Final sample

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(chalk.blue('\n--- Memory Test Complete ---'));
  console.log(chalk.blue(`Actual Duration: ${duration.toFixed(2)} seconds`));
  console.log(chalk.green(`Total Matches Performed: ${totalMatches.toLocaleString()}`));
  console.log(chalk.red(`Total Errors Encountered: ${totalErrors}`));

  // Analyze memory samples
  if (memorySamples.length >= 1) {
    // Need at least one sample (initial)
    const startHeap = memorySamples[0].heapUsed;
    let stableEndHeap;
    let analysisNote = '';
    const peakHeap = Math.max(...memorySamples.map((s) => s.heapUsed));

    // Samples taken periodically *during* the test (excluding initial and final explicit samples)
    // memorySamples[0] is initial. memorySamples[memorySamples.length-1] is final.
    const periodicSamples = memorySamples.slice(1, memorySamples.length - 1);

    if (periodicSamples.length > 0) {
      const sumOfPeriodicHeaps = periodicSamples.reduce((sum, s) => sum + s.heapUsed, 0);
      stableEndHeap = sumOfPeriodicHeaps / periodicSamples.length;
      analysisNote = `(Avg of all ${periodicSamples.length} periodic samples taken during test)`;
    } else if (memorySamples.length > 1) {
      // Fallback: if no periodic samples but we have initial and final (e.g., testDuration < sampleInterval)
      stableEndHeap = memorySamples[memorySamples.length - 1].heapUsed;
      analysisNote = '(Using final sample - no periodic samples taken during test)';
    } else {
      // Only initial sample exists
      stableEndHeap = startHeap;
      analysisNote = '(Using initial sample - only one sample taken)';
    }

    const heapIncrease = stableEndHeap - startHeap;

    console.log(chalk.magenta('\nMemory Usage Analysis (Revised Logic):'));
    console.log(chalk.magenta(`  Start Heap (Initial):             ${formatBytes(startHeap)}`));
    console.log(chalk.magenta(`  Stable End Heap ${analysisNote}: ${formatBytes(stableEndHeap)}`));
    console.log(chalk.magenta(`  Peak Heap (Overall):              ${formatBytes(peakHeap)}`));
    const percentageIncrease = startHeap > 0 ? (heapIncrease / startHeap) * 100 : 0;
    console.log(
      chalk.magenta(
        `  Increase (Stable End - Start):    ${formatBytes(heapIncrease)} (${percentageIncrease.toFixed(2)}%)`,
      ),
    );

    const leakThresholdMB = 10;
    const leakThresholdPercentage = 30; // More conservative: flag if increase > 30% AND > leakThresholdMB

    if (
      heapIncrease > leakThresholdMB * 1024 * 1024 &&
      (startHeap === 0 || percentageIncrease > leakThresholdPercentage)
    ) {
      console.log(
        chalk.yellow.bold(
          `\nWarning: Significant heap increase detected (${formatBytes(heapIncrease)}), potentially indicating a memory leak.`,
        ),
      );
    } else if (heapIncrease < -(0.05 * startHeap) && startHeap > 0) {
      console.log(chalk.green.bold(`\nHeap usage decreased noticeably.`));
    } else if (
      Math.abs(heapIncrease) <= 0.1 * startHeap ||
      (heapIncrease <= 2 * 1024 * 1024 && heapIncrease >= -(0.05 * startHeap))
    ) {
      // Small change (e.g. within +/-10% or +/- 2MB)
      console.log(
        chalk.green.bold(
          `\nHeap usage remained relatively stable or changed within narrow limits (${formatBytes(heapIncrease)}).`,
        ),
      );
    } else {
      // Increase is present but didn't meet the "significant leak" criteria
      console.log(
        chalk.green(
          `\nHeap usage shows an increase (${formatBytes(heapIncrease)}), but it's below the primary warning threshold. Monitor peak usage.`,
        ),
      );
    }
  } else {
    console.log(chalk.yellow('\nNo memory samples to perform analysis.'));
  }
}

// Run the test
runMemoryTest().catch((err) => {
  testRunning = false; // Ensure loops stop on error
  clearTimeout(matchLoopTimeoutId);
  clearInterval(sampleIntervalId);
  console.error(chalk.red.bold('Memory test runner failed unexpectedly:'), err);
  process.exit(1);
});
