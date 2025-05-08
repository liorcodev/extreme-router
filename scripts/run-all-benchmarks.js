import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

let selectedRuntimes = ['bun', 'node'];

if (argv.type) {
  const typeArg = String(argv.type).toLowerCase();
  if (typeArg === 'bun') {
    selectedRuntimes = ['bun'];
  } else if (typeArg === 'node') {
    selectedRuntimes = ['node'];
  } else {
    console.log(chalk.yellow(`Invalid --type argument: ${argv.type}. Running for both bun and node.`));
  }
}

const configurations = [
  { name: 'static', script: 'benchmark/match.benchmark.js', typeArg: '--type static' },
  { name: 'dynamic', script: 'benchmark/match.benchmark.js', typeArg: '--type dynamic' },
  { name: 'mixed', script: 'benchmark/match.benchmark.js', typeArg: '--type mixed' },
  { name: 'stress', script: 'benchmark/match.stress.js', typeArg: '' },
  { name: 'memory', script: 'benchmark/match.memory.js', typeArg: '' },
];
const routeCounts = [25, 100, 500, 1000];
const resultsDir = 'benchmark/results';
const projectRoot = process.cwd(); // Assumes script is run from project root

// Ensure results directory exists
const absoluteResultsDir = path.resolve(projectRoot, resultsDir);
if (!fs.existsSync(absoluteResultsDir)) {
  fs.mkdirSync(absoluteResultsDir, { recursive: true });
  console.log(chalk.yellow(`Created directory: ${absoluteResultsDir}`));
}

async function runBenchmarks() {
  console.log(chalk.cyan(`Running benchmarks for runtime(s): ${selectedRuntimes.join(', ')}`));
  for (const runtime of selectedRuntimes) {
    for (const config of configurations) {
      for (const count of routeCounts) {
        const routesArg = count === 25 ? '' : `--routes ${count}`;
        const fileNameSuffix = count === 25 ? '' : String(count);
        const outputFileName = `${runtime}.${config.name}${fileNameSuffix}.txt`;
        const outputFilePath = path.resolve(absoluteResultsDir, outputFileName);
        const scriptPath = path.resolve(projectRoot, config.script);

        let commandParts = [];
        commandParts.push(runtime); // 'bun' or 'node'

        // Add --expose-gc for Node.js and Bun memory benchmarks
        if (config.name === 'memory' && (runtime === 'node' || runtime === 'bun')) {
          commandParts.push('--expose-gc');
        }

        commandParts.push(scriptPath);

        if (config.typeArg) {
          commandParts.push(config.typeArg);
        }
        if (routesArg) {
          commandParts.push(routesArg);
        }

        const command = commandParts.join(' ');

        console.log(chalk.blue(`Running: ${command}`));
        console.log(chalk.blue(`Saving output to: ${outputFilePath}`));

        try {
          const output = execSync(command, { encoding: 'utf8', cwd: projectRoot, stdio: 'pipe' });
          fs.writeFileSync(outputFilePath, output);
          console.log(chalk.green(`Successfully ran ${command} and saved to ${outputFilePath}\n`));
        } catch (error) {
          console.error(chalk.red(`Error running command: ${command}`));
          console.error(chalk.red(`Output file: ${outputFilePath}`));
          const errorOutput = `COMMAND: ${command}\n\nEXIT_CODE: ${error.status}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nERROR_OBJECT:\n${error.toString()}`;
          fs.writeFileSync(outputFilePath, errorOutput);
          console.error(chalk.red(`Benchmark failed. Error details saved to ${outputFilePath}.\n`));
        }
      }
    }
  }
  console.log(chalk.blue.bold('All selected benchmarks complete.'));
}

runBenchmarks().catch((err) => {
  console.error(chalk.red.bold('An unexpected error occurred in the benchmark runner:'), err);
});
