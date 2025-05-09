<p align="center">
  <img src="./assets/extreme-router-logo.png" alt="Extreme Router Logo" width="240">
  <h1 align="center">⚡ Extreme Router – Fast and Extensible ⚡</h1>
</p>

<div align="center">
  <img src="https://img.shields.io/github/issues/liorcodev/extreme-router.svg" />
  &nbsp;
  <img src="https://img.shields.io/npm/v/extreme-router.svg" />
  &nbsp;
  <img src="https://img.shields.io/badge/License-MIT-orange.svg?color=orange" alt="License: MIT" />
</div>
<br />

🔥 **A high-performance, tree-based router for JavaScript and TypeScript, featuring a powerful plugin system for extreme extensibility.**

Extreme Router is designed for speed and flexibility. It uses an optimized radix tree (trie) structure for fast dynamic route matching and a dedicated cache for O(1) static route lookups, while its plugin architecture allows you to easily extend its capabilities to handle virtually any URL pattern.

## 📚 Table of Contents

- [✨ Features](#features)
- [🚀 Installation](#installation)
- [💡 Basic Usage](#basic-usage)
- [⚡ Advanced Usage](#advanced-usage)
- [🔌 Built-in Plugins](#built-in-plugins)
  - [Example using regex param plugin](#example-using-regex-param-plugin)
- [🛠️ Custom Plugins](#custom-plugins)
- [⚙️ API](#api)
  - [Error Types](./docs/error-types.md)
- [📊 Benchmarks](#benchmarks)
- [✅ Testing](#testing)
- [🙏 Acknowledgments](#acknowledgments)
- [🤝 Contributing](#contributing)
- [📜 License](#license)

<span id="features"></span>

## ✨ Features

- **Blazing Fast:** Optimized radix tree implementation for O(k) lookup (k = path length), with a dedicated cache for static routes (O(1)).
- **Universal Compatibility:** Runs seamlessly on every JavaScript environment.
- **Static & Dynamic Routing:** Supports fixed paths, parameterized segments, and wildcards.
- **Path Normalization:** Automatically normalizes paths by removing trailing slashes and collapsing multiple consecutive slashes (e.g., `/a//b///c/` becomes `/a/b/c`).
- **No URI Decoding by Default:** The router operates on raw path segments. URI decoding (e.g., `%20` to space) should be handled by the user before matching if needed.
- **Extensible Plugin System:** Easily add custom logic for complex routing patterns.
- **Smart Optional Parameter Handling:** Efficiently generates all unique path combinations (2^n) for routes with optional parameters using bitwise operations, ensuring comprehensive matching.
- **Built-in Plugins:** Comes with essential plugins for common use cases:
  - Parameters (`:id`)
  - Wildcards (`*`, `:name*`)
  - Regex Parameters (`:id<\\d+>`)
  - Optional Parameters (`:id?`)
  - File Extension Parameters (`:file.ext`)
  - Group Parameters (`/:paramName(val1|val2)`)
  - Prefix Group Parameters (`img(png|jpg|gif)`)
  - Optional Prefix Group Parameters (`img(png|jpg|gif)?`)
- **TypeScript Native:** Written entirely in TypeScript with excellent type support.
- **Zero Dependencies:** Lightweight and dependency-free core.
- **Compact Size:** The core library is lightweight: **12.87 KB minified** / **3.81 KB gzipped** (ESM) and **13.44 KB minified** / **4.06 KB gzipped** (CJS).
- **Well-Tested:** Comprehensive test suite ensuring reliability with **100% code coverage**.
- **Benchmarked:** Performance is continuously monitored.

<span id="installation"></span>

## 🚀 Installation

```bash
bun install extreme-router
# or
npm install extreme-router
# or
yarn add extreme-router
# or
pnpm add extreme-router
```

<span id="basic-usage"></span>

## 💡 Basic Usage

```typescript
import Extreme, { param, wildcard } from 'extreme-router';

// 1. Initialize the router
const router = new Extreme<{ handler: string }>(); // Specify the type for your route store
// Alternatively, specify a custom store factory function:
// const router = new Extreme<{ handler: string }>({ storeFactory: () => ({ handler: 'SharedHandler' }) });

// 2. Register plugins (chaining supported)
router.use(param).use(wildcard);

// Alternatively, you can register plugins when creating the router:
// const router = new Extreme<{ handler: string }>({
//  plugins: [param, wildcard],
// });

// 3. Register routes
// The register method returns the store object associated with the route.
// The store object is created by the storeFactory function (if provided) or defaults to an empty object.
// You can use the store object to attach any data to the route, such as handler functions, HTTP methods, middlewares, or other metadata.

router.register('/').handler = 'HomePage';
router.register('/users').handler = 'UserListPage';
router.register('/users/:userId').handler = 'UserProfilePage';
router.register('/files/*').handler = 'FileCatchAll';

// 4. Match paths
const match1 = router.match('/');
// match1 = { handler: 'HomePage' }

const match2 = router.match('/users/123');
// match2 = { handler: 'UserProfilePage', params: { userId: '123' } }

const match3 = router.match('/files/a/b/c.txt');
// match3 = { handler: 'FileCatchAll', params: { '*': 'a/b/c.txt' } }

const match4 = router.match('/nonexistent');
// match4 = null

router.unregister('/users/:userId'); // Unregister a specific route

const match5 = router.match('/users/123');
// match5 = null // Unregistered route, no match

console.log(router.inspect());
/*
[
  {
    path: "/",
    type: "static",
    store: {
      handler: "HomePage",
    },
  }, {
    path: "/users",
    type: "static",
    store: {
      handler: "UserListPage",
    },
  }, {
    path: "/files/*",
    type: "dynamic",
    store: [Object: null prototype] {
      handler: "FileCatchAll",
    },
  }
]
*/
```

<span id="advanced-usage"></span>

## ⚡ Advanced Usage

Here are examples `docs/examples` of how to integrate Extreme Router into simple HTTP servers using different JavaScript runtimes.

- [Bun HTTP Server](./docs/examples/server.bun.md)
- [Node.js HTTP Server](./docs/examples/server.node.md)
- [Deno HTTP Server](./docs/examples/server.deno.md)

## 🔌 Built-in Plugins

Extreme Router comes with several pre-built plugins. You need to register them using `router.use()` before registering routes that depend on them. When matching a URL segment against potential dynamic routes, the router checks the registered plugins based on their **`priority`** value. **Lower priority numbers are checked first**.

| Priority | Plugin                | Syntax Example        | Description                                                             | Example Usage (after registering plugin)                                                                                                                |
| :------- | :-------------------- | :-------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 100      | `prefixGroup`         | `/img(png\|jpg\|gif)` | Matches a static prefix followed by one of a predefined set.            | `router.register('/img(png\|jpg)');` <br> `match('/imgpng'); // Match` <br> `match('/img'); // No Match`                                                |
| 200      | `optionalPrefixGroup` | `/img(png\|jpg)?`     | Matches a static prefix optionally followed by one of a predefined set. | `router.register('/img(png\|jpg)?');` <br> `match('/imgpng'); // Match` <br> `match('/img'); // Match`                                                  |
| 300      | `groupParam`          | `/:png(\|jpg\|gif)`   | Matches one of a predefined set of static values as a parameter.        | `router.register('/:fmt(png\|jpg)');` <br> `match('/png'); // { params: { fmt: 'png' } }` <br> `match('/gif'); // No Match`                             |
| 400      | `regexParam`          | `/:id<\\d+>`          | Matches a named parameter against a custom regex.                       | `router.register('/user/:id<\\d+>');` <br> `match('/user/123'); // { params: { id: '123' } }` <br> `match('/user/abc'); // No Match`                    |
| 500      | `extensionParam`      | `/:file.ext`          | Matches segments with a specific file extension.                        | `router.register('/:file.:ext');` <br> `match('/report.pdf'); // { params: { file: 'report', ext: 'pdf' } }`                                            |
| 600      | `optionalParam`       | `/:id?`               | Matches an optional named parameter. See note below on priority.        | `router.register('/product/:id?');` <br> `match('/product/123'); // { params: { id: '123' } }` <br> `match('/product'); // Match (no params)`           |
| 700      | `param`               | `/:id`                | Matches a standard named parameter.                                     | `router.register('/post/:slug');` <br> `match('/post/hello'); // { params: { slug: 'hello' } }`                                                         |
| 800      | `wildcard`            | `/*`, `/:name*`       | Matches the rest of the path. Must be the last segment.                 | `router.register('/files/*');` <br> `match('/files/a/b'); // { params: { '*': 'a/b' } }` <br> `router.register('/docs/:p*'); // { params: { p: ... } }` |

<span id="note-on-optional-parameters-and-priority"></span>
[See Note on Optional Parameters and Priority](./docs/optional-parameters-priority.md)

<span id="example-using-multiple-plugins"></span>

### Example using regex param plugin

```typescript
import Extreme, { regexParam } from 'extreme-router';

// Initialize the router
const router = new Extreme<{ handler: string }>();

// Register plugins
router.use(regexParam);

// Register route
router.register('/users/:userId<\\d+>').handler = 'UserProfilePage';

// Match paths
const match1 = router.match('/users/123');
// match1 = { handler: 'UserProfilePage', params: { userId: '123' } }

const match2 = router.match('/users/abc');
// match2 = null // No match, regex didn't match
```

<span id="custom-plugins"></span>

## 🛠️ Custom Plugins

Extreme Router's power lies in its extensibility. You can easily create your own plugins to handle unique URL patterns or add custom matching logic. The process involves defining a plugin function that returns a configuration object, which in turn includes a handler function responsible for recognizing syntax and providing the runtime matching logic.

**Core Types:** (from [`src/types.ts`](c:\Users\lior3\Development\liodex\extreme-router\src\types.ts))

1.  **`Plugin`**: `() => PluginConfig`

    - The function you register with `router.use()`. It's a factory function that, when called, returns a `PluginConfig` object. This allows plugins to be configured or initialized if needed, though simple plugins might just return a static configuration object.

2.  **`PluginConfig`**: `{ id: string, priority: number, syntax: string, handler: PluginHandler }`

    - Defines the plugin's identity, precedence, the **representative syntax pattern** it handles, and the handler function.
    - **`id: string`**: A unique identifier for the plugin (e.g., `"param"`, `"myCustomPlugin"`). This is used internally and for error reporting.
    - **`priority: number`**: A number determining the order in which plugins are evaluated during route registration and matching. Lower numbers have higher priority. Built-in plugins have priorities like `param` (700) and `wildcard` (800). Choose a priority that makes sense relative to other plugins.
    - **`syntax: string`**: A representative string example of the syntax this plugin handles (e.g., `":paramName"`, `":id<regex>"`, `"*"`). This string is passed to the `plugin.handler` during `router.use()` to validate that the handler can correctly process this type of syntax.
    - **`handler: PluginHandler`**: The function responsible for processing path segments during route registration.

3.  **`PluginHandler`**: `(segment: string) => PluginMeta | undefined | null`

    - Called during `router.register()`. It receives a path segment string (e.g., `":userId"`, `":id<uuid>"`, `"*"`).
    - Its job is to determine if this `segment` matches the pattern the plugin is designed for.
    - If it matches, it should return a `PluginMeta` object containing the necessary information for matching and parameter extraction.
    - If it doesn't match the plugin's expected syntax, it should return `null` or `undefined` to allow other plugins to attempt to handle the segment.

4.  **`PluginMeta`**: `{ paramName: string, match: (args) => boolean, override?: boolean, wildcard?: boolean, additionalMeta?: object }`
    - Returned by the `PluginHandler` if a segment's syntax is recognized. This object is stored in the routing tree node.
    - **`paramName: string`**: The name to be used for the parameter if the segment is dynamic (e.g., for `":userId"`, `paramName` would be `"userId"`). For non-capturing plugins (like a static prefix group), this might be an empty string.
    - **`match: ({ urlSegment: string, urlSegments: string[], index: number, params: Record<string, unknown> }) => boolean`**: This is the crucial function called during `router.match()`.
      - It receives the current URL segment (`urlSegment`), all URL segments (`urlSegments`), the current segment's `index`, and the `params` object (to populate if a match occurs).
      - It must return `true` if the `urlSegment` matches the plugin's logic, and `false` otherwise.
      - If it returns `true`, it should also populate the `params` object with any captured values.
    - **`override?: boolean`** (optional): If `true`, this plugin can override an existing dynamic segment registered by a plugin with the _same ID_ at the same node. This is useful for plugins like `optionalParam` that might need to "claim" a segment that could also be interpreted by the base `param` plugin if the optional marker wasn't present. Defaults to `false`.
    - **`wildcard?: boolean`** (optional): If `true`, indicates this plugin handles a wildcard match (like `*` or `:name*`). Wildcard routes have special handling (e.g., they must be at the end of a path, and matching can consume multiple remaining segments). Defaults to `false`.
    - **`additionalMeta?: object`** (optional for logging purpose): An object to store any other metadata about the plugin's behavior. For example, the `regexParam` plugin stores the compiled `RegExp` object here.
      - `group?: Record<string | number, unknown>`: Used by group-based plugins.
      - `regex?: RegExp`: Used by regex-based plugins.
      - `extension?: string`: Used by extension-based plugins.

**Example: Custom UUID Plugin**

```typescript
import Extreme, { param } from 'extreme-router';
import type { Plugin, PluginHandler, PluginMeta } from 'extreme-router'; // Import types

// Define the UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1. Define the Plugin Function
const uuidPlugin: Plugin = () => {
  // 2. Define the Plugin Handler
  const handler: PluginHandler = (segment) => {
    // Check if the registration segment matches our syntax :name<uuid>
    const syntaxMatch = /^:(?<paramName>[a-zA-Z0-9_-]+)<uuid>$/i.exec(segment);

    if (!syntaxMatch?.groups?.paramName) {
      return null; // Doesn't match our syntax, let other plugins handle it
    }

    const paramName = syntaxMatch.groups.paramName;

    // 3. Return the PluginMeta object
    const meta: PluginMeta = {
      paramName: paramName,
      // 4. Define the runtime 'match' function
      match: ({ urlSegment, params }) => {
        // Check if the actual URL segment matches the UUID regex
        if (UUID_REGEX.test(urlSegment)) {
          params[paramName] = urlSegment; // Capture the value
          return true; // It's a match!
        }
        return false; // Not a match
      },
    };
    return meta;
  };

  // 5. Return the PluginConfig
  return {
    id: 'uuid', // Unique ID for this plugin
    priority: 550, // Example: Higher precedence than 'param' (700)
    syntax: ':name<uuid>', // Representative syntax pattern for validation
    handler: handler,
  };
};

// --- Usage ---
const router = new Extreme<{ handler: string }>();

// Register plugins - priority determines order handlers are checked during registration
router
  .use(uuidPlugin) // Priority 550
  .use(param); // Priority 700

// Register routes: The highest-priority plugin whose handler recognizes
// the segment's syntax during registration determines which PluginMeta
// is associated with the resulting node in the routing tree.
router.register('/orders/:orderId<uuid>').handler = 'GetOrder'; // Handled by uuidPlugin
router.register('/users/:userId').handler = 'GetUser'; // Handled by param plugin

// Match paths
const match1 = router.match('/orders/123e4567-e89b-12d3-a456-426614174000');
// match1 = { handler: 'GetOrder', params: { orderId: '...' } }
// Uses the match function from the uuidPlugin's PluginMeta.

const match2 = router.match('/orders/invalid-uuid-format');
// match2 = null
// The uuidPlugin's match function returned false. No other dynamic nodes
// were registered at this specific point for '/orders/...'

const match3 = router.match('/users/regular-id');
// match3 = { handler: 'GetUser', params: { userId: 'regular-id' } }
// Uses the match function from the param plugin's PluginMeta.

console.log(match1);
console.log(match2);
console.log(match3);
```

<span id="api"></span>

## ⚙️ API

- **`new Extreme<T>(options?: Options<T>)`**: Creates a new router instance.
  - `options.storeFactory`: A function that returns a new store object for each registered route. Defaults to `() => Object.create(null)`.
  - `options.plugins`: An array of plugin functions (`Plugin[]`) to register automatically when the router is created. Defaults to `[]`. Plugins will be applied (and sorted by priority) before any manual `router.use()` calls.
- **`router.use(plugin: Plugin): this`**: Registers a plugin function and returns the router instance, allowing method chaining.
  - Example:
    ```typescript
    router.use(param).use(wildcard).use(regexParam);
    ```
- **`router.register(path: string): T`**: Registers a route path and returns the associated store object (created by `storeFactory`). Throws errors for invalid paths or conflicts.
- **`router.unregister(path: string): boolean`**: Unregisters a route path. Returns `true` if the path was successfully unregistered, `false` otherwise.
  - Handles static paths, dynamic paths, and paths with optional parameters.
    - For paths with optional parameters, all generated combinations are unregistered **only if you unregister the full registered URL with the optionals**. If you unregister just one of its generated combinations, only that specific combination is removed.
- **`router.match(path: string): Match<T> | null`**: Matches a given path against the registered routes.
  - Returns a `Match<T>` object if a matching route is found. `Match<T>` is the route's store `T` augmented with a `params: Record<string, string>` property.
    - For dynamic path matches, the returned object includes a `params` property containing the extracted parameter values.
    - For static path matches, the returned object is simply the route's store. While the `Match<T>` type includes a `params` property, it will not be present as an own property on the returned store object.
  - Returns `null` if no match is found.
- **`router.inspect(): ListedRoute<T>[]`**: Retrieves a list of all registered routes. This is useful for debugging or administrative purposes.
  - Returns an array of `ListedRoute<T>` objects. Each object has the following properties:
    - `path: string`: The registered path string.
    - `type: 'static' | 'dynamic'`: The type of the route.
    - `store: T`: The original store object associated with the route.
- **Error Handling**: The router uses a set of predefined [Error Types](./docs/error-types.md) for consistent error reporting.

<span id="benchmarks"></span>

## 📊 Benchmarks

The following benchmarks measure the raw speed of the `router.match()` operation (ops/sec) for different route types and route counts.

Benchmarks were conducted on: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz, 16GB RAM.

### Benchmark Results

**Matching Benchmarks (ops/sec)**
Higher is better.

<table style="width:100%; border: none; border-spacing: 0;">
  <tr style="border: none;">
    <td style="width:50%; vertical-align:top; padding-right:10px; padding-bottom:15px; border: none;">
      <strong>25 Routes</strong>
      <table>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Type</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bun</td>
            <td>Static</td>
            <td>40,664,369.57</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Static</td>
            <td>32,699,587.31</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Mixed</td>
            <td>11,275,739.98</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Mixed</td>
            <td>7,984,073.83</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Dynamic</td>
            <td>5,315,190.38</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Dynamic</td>
            <td>3,700,454.56</td>
          </tr>
        </tbody>
      </table>
    </td>
    <td style="width:50%; vertical-align:top; padding-left:10px; padding-bottom:15px; border: none;">
      <strong>100 Routes</strong>
      <table>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Type</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bun</td>
            <td>Static</td>
            <td>43,161,335.67</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Static</td>
            <td>30,731,126.72</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Mixed</td>
            <td>10,314,999.21</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Mixed</td>
            <td>7,047,826.06</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Dynamic</td>
            <td>2,570,193.17</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Dynamic</td>
            <td>1,791,611.34</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  <tr style="border: none;">
    <td style="width:50%; vertical-align:top; padding-right:10px; border: none;">
      <strong>500 Routes</strong>
      <table>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Type</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bun</td>
            <td>Static</td>
            <td>30,417,507.26</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Static</td>
            <td>28,521,879.69</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Mixed</td>
            <td>5,597,866.27</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Mixed</td>
            <td>4,139,942.82</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Dynamic</td>
            <td>1,822,528.37</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Dynamic</td>
            <td>1,226,324.41</td>
          </tr>
        </tbody>
      </table>
    </td>
    <td style="width:50%; vertical-align:top; padding-left:10px; border: none;">
      <strong>1000 Routes</strong>
      <table>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Type</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bun</td>
            <td>Static</td>
            <td>25,570,061.69</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Static</td>
            <td>27,940,237.55</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Mixed</td>
            <td>4,723,668.94</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Mixed</td>
            <td>3,477,167.42</td>
          </tr>
          <tr>
            <td>Bun</td>
            <td>Dynamic</td>
            <td>1,859,733.12</td>
          </tr>
          <tr>
            <td>Node</td>
            <td>Dynamic</td>
            <td>1,166,799.26</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
</table>

#### Stress Test Benchmarks

Total matches performed in 20 seconds with 50 concurrent workers. Higher is better.

| Runtime | Routes | Total Matches |
| :------ | :----- | :------------ |
| Bun     | 25     | 151,799,882   |
| Node    | 25     | 92,383,913    |
| Bun     | 100    | 129,399,072   |
| Node    | 100    | 78,502,959    |
| Bun     | 500    | 75,988,452    |
| Node    | 500    | 50,230,329    |
| Bun     | 1000   | 66,190,291    |
| Node    | 1000   | 46,227,299    |

#### Memory Usage Benchmarks

Test duration: 30 seconds. Lower heap usage and increase is generally better.

| Runtime | Routes | Start Heap | Stable End Heap | Peak Heap | Increase (Stable End - Start) |
| :------ | :----- | :--------- | :-------------- | :-------- | :---------------------------- |
| Bun     | 25     | 228.86 KB  | 1.97 MB         | 2.04 MB   | 1.75 MB (782.49%)             |
| Node    | 25     | 5.33 MB    | 6.53 MB         | 8.56 MB   | 1.19 MB (22.39%)              |
| Bun     | 100    | 228.86 KB  | 2.06 MB         | 2.15 MB   | 1.83 MB (820.44%)             |
| Node    | 100    | 5.47 MB    | 6.7 MB          | 8.63 MB   | 1.23 MB (22.58%)              |
| Bun     | 500    | 228.86 KB  | 2.18 MB         | 2.27 MB   | 1.96 MB (876.51%)             |
| Node    | 500    | 5.67 MB    | 7.83 MB         | 12.04 MB  | 2.15 MB (37.99%)              |
| Bun     | 1000   | 228.86 KB  | 2.37 MB         | 2.45 MB   | 2.15 MB (961.21%)             |
| Node    | 1000   | 5.96 MB    | 9.02 MB         | 12.12 MB  | 3.06 MB (51.26%)              |

### Understanding Bun vs. Node.js Memory Behavior

The memory benchmark results highlight differing memory usage patterns between Bun and Node.js. These differences primarily stem from their underlying JavaScript engines and memory management strategies:

1.  **JavaScript Engines:**

    - **Bun:** Utilizes JavaScriptCore (JSC), known for quick startup and potentially lower initial memory consumption.
    - **Node.js:** Employs V8, which is highly optimized for long-running server applications.

2.  **Initial Heap Size and Growth:**

    - **Bun (JSC):** The benchmarks show Bun starting with a very small heap (e.g., `228.86 KB`). This results in a large _percentage_ increase as the application allocates memory, even if the final _absolute_ heap size remains relatively small (around 2 MB).
    - **Node.js (V8):** Node.js starts with a considerably larger initial heap (e.g., `5.33 MB - 5.67 MB`). Consequently, its _percentage_ increase is smaller for comparable absolute memory growth.

3.  **Interpreting the "Increase":**
    - The significant _percentage_ increase in Bun's memory usage is largely due to its low starting base. The "Stable End Heap" and absolute MB increase offer a clearer view of the memory actively used during the test.
    - Both runtimes demonstrate memory stability under the test conditions, suggesting `extreme-router` itself is not exhibiting a runaway memory leak. The observed variations are more indicative of the engines' default heap management behaviors.

In essence, Bun/JSC's strategy leads to a low initial memory footprint, causing high percentage growth to a still modest absolute size. Node/V8 begins with a larger heap, resulting in smaller percentage growth for similar absolute increases. Both appear to manage memory effectively for the router in these tests.

You can run benchmarks to see Extreme Router's performance:

```bash
# Matching benchmark (25 routes by default)
# General mixed benchmark
bun run benchmark # static and dynamic routes
# Specify type: static, dynamic
bun run benchmark:static
bun run benchmark:dynamic
# Specify number of routes
bun run benchmark --routes=100
bun run benchmark:static --routes=100
bun run benchmark:dynamic --routes=100

# Memory usage benchmark
bun run benchmark:memory
bun run benchmark:memory --routes=200

# Stress test (concurrent matching)
bun run benchmark:stress
bun run benchmark:stress --routes=500
bun run benchmark:stress --routes=1000
```

<span id="testing"></span>

## ✅ Testing

Run the comprehensive test suite:

```bash
bun test
# or for coverage report
bun run coverage
```

The coverage report can be found in the `coverage/` directory ([`coverage/index.html`](c:\Users\lior3\Development\liodex\extreme-router\coverage\index.html)).

**100% code coverage** is ensured.

<span id="acknowledgments"></span>

## 🙏 Acknowledgments

Extreme Router draws inspiration from the high-level routing concepts and per-route register/store design of [Medley Router](https://github.com/medleyjs/router). Sincere thanks to the Medley Router authors for their foundational ideas.

<span id="contributing"></span>

## 🤝 Contributing

Contributions are welcome!  
Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on development, testing, benchmarking, and submitting pull requests.

<span id="license"></span>

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
