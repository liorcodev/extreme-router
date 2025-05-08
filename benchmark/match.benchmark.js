import Benchmark from 'benchmark';
import chalk from 'chalk';
import Extreme from '../dist/index.js';
import { param, wildcard } from '../dist/index.js';
import minimist from 'minimist';

// --- Argument Parsing ---
const args = minimist(process.argv.slice(2));
const benchmarkType = args.type || 'mixed'; // Default to 'mixed' if --type is not provided
const routeCountArg = args.routes; // Get the --routes argument

if (!['static', 'dynamic', 'mixed'].includes(benchmarkType)) {
  console.error(chalk.red(`Invalid --type argument: ${benchmarkType}. Must be 'static', 'dynamic', or 'mixed'.`));
  process.exit(1);
}

console.log(chalk.cyan(`Setting up Extreme Router benchmark (Type: ${chalk.yellow(benchmarkType)})...`));

// --- Configuration ---
// Use the --routes argument if provided and valid, otherwise default to 25
const routeCount = typeof routeCountArg === 'number' && routeCountArg > 0 ? routeCountArg : 25;
console.log(chalk.cyan(`Using ${chalk.yellow(routeCount)} routes (Default: 25, use --routes <number> to override)`));

// Adjust ratios based on benchmark type
let staticRatio = 0.7;
let dynamicParamRatio = 0.25;
// dynamicWildcardRatio is implicitly calculated

if (benchmarkType === 'static') {
  staticRatio = 1.0;
  dynamicParamRatio = 0.0;
} else if (benchmarkType === 'dynamic') {
  staticRatio = 0.0;
  // Adjust dynamic ratios to fill the count, e.g., 95% param, 5% wildcard
  dynamicParamRatio = 0.95;
}
// 'mixed' uses the default ratios defined above

// --- Route Generation ---
const routes = [];
const staticCount = Math.floor(routeCount * staticRatio);
const dynamicParamCount = Math.floor(routeCount * dynamicParamRatio);
// Calculate remaining count for wildcards to ensure total equals routeCount
const dynamicWildcardCount = routeCount - staticCount - dynamicParamCount;

console.log(chalk.blue(`Generating routes for type: ${benchmarkType}`));

// Static Routes
if (staticCount > 0) {
  console.log(chalk.gray(`  Generating ${staticCount} static routes...`));
  routes.push('/');
  routes.push('/users');
  routes.push('/repos');
  routes.push('/zen');
  routes.push('/gitignore/templates');
  routes.push('/licenses');
  // Ensure loop count doesn't go below zero
  const staticLoopCount = Math.max(0, staticCount - routes.length);
  for (let i = 0; i < staticLoopCount; i++) {
    routes.push(`/static/route${i}/${i % 10}/${i % 5}`);
  }
}

// Dynamic Param Routes
if (dynamicParamCount > 0) {
  console.log(chalk.gray(`  Generating ${dynamicParamCount} param routes...`));
  routes.push('/users/:username');
  routes.push('/repos/:owner/:repo');
  routes.push('/repos/:owner/:repo/issues/:issue_number');
  routes.push('/orgs/:org/members');
  routes.push('/teams/:team_id/members/:username');
  // Ensure loop count doesn't go below zero if dynamicParamCount is small
  const paramLoopCount = Math.max(0, dynamicParamCount - 5);
  for (let i = 0; i < paramLoopCount; i++) {
    routes.push(`/param/route${i}/:p${(i % 3) + 2}`);
  }
}

// Dynamic Wildcard Routes
if (dynamicWildcardCount > 0) {
  console.log(chalk.gray(`  Generating ${dynamicWildcardCount} wildcard routes...`));
  routes.push('/search/*');
  routes.push('/legacy/search/:query/*');
  // Ensure loop count doesn't go below zero
  const wildcardLoopCount = Math.max(0, dynamicWildcardCount - 2);
  for (let i = 0; i < wildcardLoopCount; i++) {
    routes.push(`/wild/route${i}/*`);
  }
}

// Shuffle routes for more realistic matching order during benchmark
routes.sort(() => Math.random() - 0.5);

// Ensure the total number of routes matches routeCount if there were rounding issues or specific type generation
while (routes.length < routeCount && routes.length > 0) {
  // Add fallback routes if needed
  // Add appropriate fallback based on type if possible, otherwise static
  if (benchmarkType === 'dynamic' && dynamicParamCount > 0) {
    routes.push(`/extra/param${routes.length}/:id`);
  } else if (benchmarkType === 'dynamic' && dynamicWildcardCount > 0) {
    routes.push(`/extra/wild${routes.length}/*`);
  } else {
    // Default to static or if type is static/mixed
    routes.push(`/extra/static${routes.length}`);
  }
}
// If rounding resulted in too many routes, trim the excess
if (routes.length > routeCount) {
  routes.splice(routeCount);
}

console.log(chalk.blue(`\nGenerated ${routes.length} routes:`));
if (staticCount > 0) console.log(chalk.blue(`  - Static: ${staticCount}`));
if (dynamicParamCount > 0) console.log(chalk.blue(`  - Param: ${dynamicParamCount}`));
if (dynamicWildcardCount > 0) console.log(chalk.blue(`  - Wildcard: ${dynamicWildcardCount} (remainder)`));

// --- Router Setup ---
const router = new Extreme();

// Register necessary plugins only if dynamic routes are involved
if (benchmarkType === 'dynamic' || benchmarkType === 'mixed') {
  console.log(chalk.yellow('Registering dynamic plugins...'));
  if (dynamicParamCount > 0 || dynamicWildcardCount > 0) {
    // Be more specific
    router.use(param).use(wildcard);
  }
  // Add other plugins (regexParam, etc.) if dynamic routes require them
}

console.log(chalk.yellow('Registering routes...'));
try {
  routes.forEach((route) => {
    router.register(route); // Register each route
  });
  console.log(chalk.green('Routes registered successfully.'));
} catch (error) {
  console.error(chalk.red('Error registering routes:'), error);
  process.exit(1);
}

// --- Benchmark Suite ---
const suite = new Benchmark.Suite(`Extreme Router Match (${benchmarkType})`); // Add type to suite name

console.log(chalk.cyan('\nStarting benchmark...\n'));

// Generate test paths based on the actual registered routes
const testPaths = routes.map((route) => {
  // Basic substitution for params/wildcards for matching test
  let path = route
    .replace(/:[^/?*]+/g, 'value') // Replace params like :id with 'value'
    .replace(/\*/g, 'wild/card'); // Replace * with 'wild/card'
  // Handle edge case of root path '/'
  return path === '/' ? '/' : path.replace(/\?$/, ''); // Remove trailing '?' if any from optional (though optionals removed)
});

suite
  .add('router.match()', () => {
    // Match a random *generated* path from the list for better realism
    const randomPath = testPaths[Math.floor(Math.random() * testPaths.length)];
    const match = router.match(randomPath);
    if (match === null) {
      console.log(`No match found for path: ${randomPath}`);
    }
  })
  .on('cycle', (event) => {
    // Format hz with thousand separators and keep 2 decimal places
    const opsPerSec = event.target.hz.toLocaleString('en-US', { maximumFractionDigits: 2 });
    console.log(
      `  ${chalk.magenta(String(event.target.name))}: ${chalk.green(
        opsPerSec, // Use the formatted number
      )} ops/sec ±${chalk.yellow(event.target.stats.rme.toFixed(2))}% (${chalk.cyan(
        event.target.stats.sample.length,
      )} runs sampled)`,
    );
  })
  .on('complete', function () {
    console.log(chalk.blue(`\nBenchmark (${benchmarkType}) complete.`));
  })
  .on('error', (event) => {
    console.error(chalk.red(`Benchmark error in ${event.target.name}:`), event.target.error);
  })
  .run({ async: false }); // Run synchronously for simpler console output
