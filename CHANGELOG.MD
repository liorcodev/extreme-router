extreme-router\CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added a browser usage example using JSDelivr to the documentation (`docs/examples/browser.md`).

### Changed

### Fixed

### Documentation
- Updated README to replace `bun coverage` with `bun test:coverage` for accuracy.
- Updated README to include a link to the new browser example.
- Corrected local file path links in `CONTRIBUTING.md` to use relative paths.

## [1.0.0] - 2025-05-09

### Added

-   Initial implementation of the `Extreme` router class.
-   Support for static route registration and matching.
-   Support for dynamic route registration and matching via a plugin system.
-   Plugin registration mechanism (`router.use`).
-   Route registration mechanism (`router.register`).
-   Route unregistration mechanism (`router.unregister`) for static, dynamic, and optional parameter paths.
-   Route matching mechanism (`router.match`).
-   Route inspection mechanism (`inspect()` for retrieving a list of all registered routes).
-   Built-in plugins: `param`, `wildcard`, `regexParam`, `extensionParam`, `groupParam`, `prefixGroup`, `optionalPrefixGroup`, `optionalParam`.
-   Support for optional parameters in routes (`router.register`).
-   Configurable `storeFactory` for route stores.
-   Comprehensive JSDoc/TSDoc comments for the `Extreme` router class and its public methods.
-   Development setup using Bun, ESLint, Prettier, Vitest, tsup, Husky, lint-staged.
-   Benchmark scripts (`match`, `memory`, `stress`).
-   Testing suite with coverage reporting.
-   `README.md` with usage examples, API documentation, and development guidelines.
-   `CONTRIBUTING.md` outlining contribution guidelines.
-   `LICENSE` file (MIT).
-   Scripts for generating bundle size and benchmark reports.

### Changed

-   Improved error handling with specific `ErrorTypes`.
-   Refined plugin validation logic in `router.use`.
-   Optimized dynamic node sorting by priority in `registerDynamicPath`.

### Fixed

-   Ensured correct handling of wildcard routes during matching.
-   Addressed potential conflicts during dynamic route registration.