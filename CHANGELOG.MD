extreme-router\CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-05-18
### Added
- Introduced the `allowRegisterUpdateExisting` option to the router constructor. When enabled (`true`), invoking `router.register()` on an already registered path will return the existing store instance for that path instead of throwing an error, allowing the store's data to be updated. When disabled (`false`, default), attempting to register an existing path will throw an error as before.

### Fixed
- Ensured that when `allowRegisterUpdateExisting` is `true`, `router.register()` consistently returns the original store instance for an existing path, rather than creating a new instance. This guarantees that updates are applied to the correct store object.

## [1.0.2] - 2025-05-14

### Changed
-   Refined the `Store` type from `Record<string, unknown>` to `object`. This change allows custom store types to extend from `object` instead of being constrained to `Record<string, unknown>`, improving type flexibility when initializing the router with a custom store type.

## [1.0.1] - 2025-05-11

### Added
- Added a browser usage example using JSDelivr to the documentation (`docs/examples/browser.md`).

### Changed
- Refined the return type of the `use` method to `this | never` to accurately reflect that it can throw errors.

### Fixed

### Documentation
- Updated README to replace `bun coverage` with `bun test:coverage` for accuracy.
- Updated README to include a link to the new browser example.
- Corrected local file path links in `CONTRIBUTING.md` to use relative paths.
- Refined the browser example (`docs/examples/browser.md`) by removing verbose console logs and simplifying error handling logic for better clarity.
- Further clarified time complexity for dynamic route matching in `README.md`, detailing the `O(k * D_max)` complexity where `D_max` is the maximum number of distinct dynamic patterns at a tree node.

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