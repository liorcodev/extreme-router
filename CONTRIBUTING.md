# Contributing to Extreme Router

First off, thank you for considering contributing to Extreme Router! Your help is appreciated.

This document provides guidelines for contributing to this project. Please feel free to propose changes to this document in a pull request.

## Table of Contents

- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Styleguides](#styleguides)
  - [Git Commit Messages](#git-commit-messages)
  - [JavaScript/TypeScript Styleguide](#javascripttypescript-styleguide)
- [Testing](#testing)
  - [Test Utilities](#test-utilities-teststest-utilts)
  - [Checking Bundle Size](#checking-bundle-size)
- [Benchmarking](#benchmarking)
  - [Running All Benchmarks](#running-all-benchmarks)
- [License](#license)

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Extreme Router. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use the GitHub Issues tab** to create a bug report.
- **Check if the bug has already been reported** by searching the issues.
- **Provide a clear and descriptive title**.
- **Describe the steps to reproduce the bug** with as much detail as possible. Include code snippets if applicable.
- **Explain the behavior you observed** and what you expected to happen.
- **Include details about your environment** (Node.js/Bun version, OS, etc.).

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Extreme Router, including completely new features and minor improvements to existing functionality.

- **Use the GitHub Issues tab** to create an enhancement suggestion.
- **Provide a clear and descriptive title**.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Explain why this enhancement would be useful** to most Extreme Router users.
- **Include code examples** if applicable.

### Your First Code Contribution

Unsure where to begin contributing to Extreme Router? You can start by looking through `good first issue` or `help wanted` issues.

### Pull Requests

The process described here has several goals:

- Maintain Extreme Router's quality.
- Fix problems that are important to users.
- Engage the community in working toward the best possible Extreme Router.
- Enable a sustainable system for Extreme Router's maintainers to review contributions.

Please follow these steps to have your contribution considered by the maintainers:

1.  Follow the [Development Setup](#development-setup) instructions.
2.  Follow the [Styleguides](#styleguides).
3.  Ensure [Testing](#testing) requirements are met.
4.  Submit your pull request!

## Development Setup

As mentioned in the [`README.md#development`](c:\Users\lior3\Development\liodex\extreme-router\README.md#L554), you'll need [Bun](https://bun.sh/) installed.

1.  Clone the repository:
    ```bash
    git clone https://github.com/liorcodev/extreme-router.git
    cd extreme-router
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```

## Styleguides

### Git Commit Messages

This project aims to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps with automated changelog generation (as seen in [`CHANGELOG.MD`](c:\Users\lior3\Development\liodex\extreme-router\CHANGELOG.MD)) and makes the commit history easier to read.

Common prefixes include:

- `feat:` (new feature)
- `fix:` (bug fix)
- `docs:` (documentation changes)
- `style:` (formatting, missing semi colons, etc; no code logic change)
- `refactor:` (refactoring production code)
- `test:` (adding missing tests, refactoring tests; no production code change)
- `chore:` (updating build tasks etc; no production code change)
- `perf:` (performance improvements)

### JavaScript/TypeScript Styleguide

Consistency is key. Please adhere to the established style in the codebase.

- **Formatting:** All code is automatically formatted using [Prettier](https://prettier.io/). Please run `bun format` before committing to ensure your code matches the project's style.
- **Linting:** Code quality and potential errors are checked using [ESLint](https://eslint.org/) based on the configuration in [`eslint.config.js`](c:\Users\lior3\Development\liodex\extreme-router\eslint.config.js). Run `bun lint` to check your code and `bun lint:fix` to automatically fix issues.
- **Naming Conventions:**
  - Use `camelCase` for variables, functions, and method names.
    - Strive for descriptive names that clearly indicate the variable's purpose (e.g., `staticPathCache`, `currentNode`, `pluginMatch` rather than generic names like `cache`, `node`, or `flag`).
  - Use `PascalCase` for classes, types, and interfaces (e.g., `Extreme`, `PluginHandler`, `Node`).
  - Use `UPPER_SNAKE_CASE` for constants and enum members (e.g., `ErrorTypes.PluginMissingId`, `UUID_REGEX`).
- **TypeScript:**
  - This project uses TypeScript with strict mode enabled ([`tsconfig.json`](c:\Users\lior3\Development\liodex\extreme-router\tsconfig.json)). Ensure your contributions are strongly typed.
  - Leverage TypeScript features like interfaces, types, and enums as used throughout the project (see [`src/types.ts`](c:\Users\lior3\Development\liodex\extreme-router\src\types.ts)).
- **Modules:** Use ES Modules (`import`/`export`) syntax.
- **Comments:** Use JSDoc/TSDoc style comments for explaining functions, classes, and complex logic. Use `//` for brief inline comments.
- **Error Handling:** Follow the existing pattern of using the `ErrorTypes` enum ([`src/types.ts`](c:\Users\lior3\Development\liodex\extreme-router\src\types.ts)) and the `throwError` method where applicable.

**Pre-commit Hook:** Remember that [Husky](https://typicode.github.io/husky/) runs `bun lint-staged` (which includes formatting and linting) and `bun run test:coverage --changed` automatically before each commit ([`.husky/pre-commit`](c:\Users\lior3\Development\liodex\extreme-router.husky\pre-commit)). Ensure these checks pass.

## Testing

Extreme Router uses [Vitest](https://vitest.dev/) for testing. Please ensure that your contribution includes relevant tests and that the entire test suite passes.

- Run the full test suite:
  ```bash
  bun run test
  ```
- Run tests in watch mode:
  ```bash
  bun run test:watch
  ```
- Generate a coverage report (output in `./coverage/`):
  ```bash
  bun run test:coverage
  ```

As mentioned, the pre-commit hook also runs `bun run test:coverage --changed` to ensure tests related to your changes pass and maintain coverage.

### Test Utilities (`tests/test-util.ts`)

To facilitate more thorough testing, especially for internal logic and state, the project includes a test utility class `TestExtreme` located in `tests/test-util.ts`. This class extends the main `Extreme` router and exposes several internal properties and methods (e.g., `getStaticPathCache()`, `getRoot()`, `getPlugins()`, `throwError()`).

When writing tests that need to inspect or interact with the router's internals, you can import and use `TestExtreme` instead of the standard `Extreme` class. This allows for more direct assertions on the router's state and behavior.

### Checking Bundle Size

Ensure the bundle size remains reasonable after your changes:

```bash
bun run size
```

This command checks the size of the built files and saves a report to `dist/bundle-size.json`. Review this report to ensure your changes haven't significantly increased the bundle size unexpectedly.

## Benchmarking

Extreme Router includes performance and memory benchmarks to help contributors ensure that changes do not negatively impact speed or memory usage.

- **General matching benchmark (mixed and 25 routes by default):**
  ```bash
  bun benchmark
  ```
- **Run specific benchmarks (25 routes by default):**
  ```bash
  bun benchmark:dynamic
  bun benchmark:static
  bun benchmark:stress
  bun benchmark:memory
  ```
- **(Optional) Specify number of routes:**
  ```bash
  bun benchmark --routes=<number>
  bun benchmark:dynamic --routes=<number>
  # ... and so on for other specific benchmarks
  ```

Benchmark results are logged to the console. Please run relevant benchmarks if your changes may affect performance or memory usage.

### Running All Benchmarks

A script is available to run all benchmark combinations (runtimes, types, route counts) and save their outputs to the `benchmark/results/` directory:

```bash
bun run scripts/run-all-benchmarks.js
```

You can also specify a runtime (e.g., `bun` or `node`):

```bash
bun run scripts/run-all-benchmarks.js --type bun
bun run scripts/run-all-benchmarks.js --type node
```

This is useful for comprehensive performance regression testing.

## License

By contributing to Extreme Router, you agree that your contributions will be licensed under its [MIT License](LICENSE).
