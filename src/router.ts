import {
  ErrorTypes,
  type Match,
  type Node,
  type Options,
  type Plugin,
  type PluginConfig,
  type PluginMeta,
  type Store,
  type ListedRoute,
  type CleanupTraversalResult,
} from './types';

/**
 * High-performance, modular, tree-based router with plugin support.
 *
 * @template T The type of the store object associated with each route. Defaults to `Store`.
 */
export default class Extreme<T extends Store = Store> {
  /**
   * Creates a new Extreme router instance.
   * @param {Partial<Options<T>>} [options={}] Configuration options for the router.
   * @param {() => T} [options.storeFactory=() => Object.create(null)] A function that returns a new store object for each registered route.
   */
  constructor(options: Partial<Options<T>> = {}) {
    this.options = this.validateOptions(options);
    this.staticPathCache = Object.create(null);
    this.root = this.createNode();
    this.errorTypes = this.createErrorTypes();
    this.plugins = [];
    if (this.options.plugins.length > 0) {
      this.loadPlugins(this.options.plugins);
    }
  }

  /**
   * Default configuration options for the router.
   * @protected
   */
  protected defaultOptions: Options<T> = {
    storeFactory: () => Object.create(null),
    plugins: [],
  };

  /**
   * The validated configuration options for this router instance.
   * @protected
   */
  protected options: Options<T>;

  /**
   * Cache for quickly matching static paths (O(1) lookup).
   * Keys are static paths, values are the associated route stores.
   * @protected
   */
  protected staticPathCache: Record<string, Match<T>>;

  /**
   * The root node of the radix tree used for dynamic path matching.
   * @protected
   */
  protected root: Node<T>;

  /**
   * Array storing the registered plugin configurations, sorted by priority.
   * @protected
   */
  protected plugins: PluginConfig[];

  /**
   * Map of error types to their corresponding error message generators.
   * @protected
   */
  protected errorTypes: Record<ErrorTypes, (inline?: string) => string>;

  /**
   * Regular expressions used for matching path segments and types.
   * @protected
   */
  protected matchers = {
    staticPath: /^(?:\/|\/?(?:[a-zA-Z0-9 _.-]+)(?:\/[a-zA-Z0-9 _.-]+)*)$/,
    paramOptionalInPath: /\/:[a-zA-Z0-9_-]+\?/,
    staticSegment: /^[a-zA-Z0-9 _.-]+$/,
    paramOptionalSegment: /^:[a-zA-Z0-9_-]+\?$/,
  };

  /**
   * Loads and registers an array of plugins, validating each plugin before adding it to the internal plugins list.
   * After all plugins are added, the list is sorted by priority in ascending order (lower number indicates higher precedence).
   *
   * @param plugins - An array of plugins to be loaded and registered.
   */
  private loadPlugins(plugins: Plugin[]): void | never {
    plugins.forEach((plugin) => {
      const pluginConfig = this.validatePlugin(plugin);
      this.plugins.push(pluginConfig);
    });
    // Keep this.plugins sorted by priority (lower number = higher precedence)
    this.plugins.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Validates the provided router options and merges them with defaults.
   * @param {Partial<Options<T>>} options The options provided to the constructor.
   * @returns {Options<T>} The validated and merged options.
   * @throws {Error} If the storeFactory is invalid.
   * @private
   */
  private validateOptions(options: Partial<Options<T>>): Options<T> {
    const finalOptions = { ...this.defaultOptions, ...options };
    // Store validation
    if (!finalOptions.storeFactory) {
      finalOptions.storeFactory = this.defaultOptions.storeFactory;
    } else if (typeof finalOptions.storeFactory !== 'function') {
      this.throwError(ErrorTypes.StoreIsNotFunction, typeof finalOptions.storeFactory);
    } else {
      let storeObject: T;
      try {
        storeObject = finalOptions.storeFactory();
      } catch (error) {
        this.throwError(ErrorTypes.StoreUnexpected, error instanceof Error ? error.message : String(error));
      }
      if (typeof storeObject !== 'object' || Array.isArray(storeObject)) {
        this.throwError(ErrorTypes.StoreDoesNotReturnObject, typeof storeObject);
      }
    }
    if (!Array.isArray(finalOptions.plugins)) {
      this.throwError(ErrorTypes.PluginsOptionNotArray, typeof finalOptions.plugins);
    }
    return finalOptions;
  }

  /**
   * Creates the map of error type enums to error message generator functions.
   * @returns {Record<ErrorTypes, (inline?: string) => string>} The error types map.
   * @private
   */
  private createErrorTypes(): typeof this.errorTypes {
    return {
      [ErrorTypes.StoreIsNotFunction]: (inline?: string) => `Store is not a function: ${inline}`,
      [ErrorTypes.StoreDoesNotReturnObject]: (inline?: string) => `Store does not return an object: ${inline}`,
      [ErrorTypes.StoreUnexpected]: (inline?: string) => `Store unexpected error: ${inline}`,
      [ErrorTypes.PathAlreadyRegistered]: (inline?: string) => `Path already registered: ${inline}`,
      [ErrorTypes.PluginWithSameIdAlreadyExists]: (inline?: string) => `Plugin with same ID already exists: ${inline}`,
      [ErrorTypes.PluginWithSamePriorityAlreadyExists]: (inline?: string) =>
        `Plugin with same priority already exists: ${inline}`,
      [ErrorTypes.PluginIsNotFunction]: (inline?: string) => `Plugin is not a function: ${inline}`,
      [ErrorTypes.PluginDoesNotReturnObject]: (inline?: string) => `Plugin does not return an object: ${inline}`,
      [ErrorTypes.PluginsOptionNotArray]: (inline?: string) => `Plugins option must be an array, got: ${inline}`,
      [ErrorTypes.PluginMissingId]: () => 'Plugin missing ID',
      [ErrorTypes.PluginMissingPriority]: () => 'Plugin missing priority',
      [ErrorTypes.PluginIdIsNotString]: (inline?: string) => `Plugin ID is not a string: ${inline}`,
      [ErrorTypes.PluginPriorityIsNotNumber]: (inline?: string) => `Plugin priority is not a number: ${inline}`,
      [ErrorTypes.PluginMissingSyntax]: () => 'Plugin missing syntax',
      [ErrorTypes.PluginSyntaxIsNotString]: (inline?: string) => `Plugin syntax is not a string: ${inline}`,
      [ErrorTypes.PluginMissingHandler]: (inline?: string) => `Plugin missing handler: ${inline}`,
      [ErrorTypes.PluginHandlerIsNotFunction]: (inline?: string) => `Plugin handler is not a function: ${inline}`,
      [ErrorTypes.PluginHandlerReturnNullOrUndefinedForSyntax]: (inline?: string) =>
        `Plugin handler returned null or undefined while matching syntax: ${inline}`,
      [ErrorTypes.PluginHandlerDoesNotReturnObject]: (inline?: string) =>
        `Plugin handler does not return an object: ${inline}`,
      [ErrorTypes.PluginHandlerMissingMatch]: () => 'Plugin handler missing match function',
      [ErrorTypes.PluginHandlerMatchIsNotFunction]: (inline?: string) =>
        `Plugin handler match is not a function: ${inline}`,
      [ErrorTypes.PluginHandlerMatchDoesNotReturnBoolean]: (inline?: string) =>
        `Plugin handler match does not return a boolean: ${inline}`,
      [ErrorTypes.PluginUnexpected]: (inline?: string) => `Plugin unexpected error: ${inline}`,
      [ErrorTypes.PluginDoesNotExist]: (inline?: string) => `Plugin does not exist for: ${inline}`,
      [ErrorTypes.DynamicSegmentAlreadyExists]: (inline?: string) => `Dynamic segment already exists: ${inline}`,
      [ErrorTypes.WildcardNotAtEnd]: () => 'Wildcard must be at the end of the path',
      [ErrorTypes.PathIsEmpty]: () => 'Path cannot be empty',
    };
  }

  /**
   * Throws a formatted error based on the ErrorTypes enum.
   * @param {ErrorTypes} type The type of error to throw.
   * @param {string} [inline] Optional additional context for the error message.
   * @throws {Error} Always throws an error.
   * @protected
   */
  protected throwError(type: ErrorTypes, inline?: string): never {
    const errorType = ErrorTypes[type];
    if (errorType !== undefined) {
      const errorMessage = this.errorTypes[type](inline);
      throw new Error(errorMessage);
    }
    throw new Error('Unknown error type');
  }

  /**
   * Creates a new, empty node for the routing tree.
   * @returns {Node<T>} A new node object.
   * @private
   */
  private createNode(): Node<T> {
    return {
      staticChildren: Object.create(null),
    };
  }

  /**
   * Generates all possible path combinations for a route containing optional parameters.
   * For example, '/a/:b?/:c?' generates ['/a', '/a/:b', '/a/:c', '/a/:b/:c'].
   * Note: This currently generates combinations based on presence, not order permutations if multiple optionals are adjacent.
   * @param {string} path The path string containing optional parameters (e.g., '/users/:id?').
   * @returns {string[]} An array of path strings representing all combinations.
   * @protected
   */
  protected generateOptionals(path: string): string[] {
    // Split path into segments
    const segments = path.split('/').filter(Boolean);

    // Identify optional segments
    const optionalIndexes = segments
      .map((s, i) => (this.matchers.paramOptionalSegment.test(s) ? i : -1))
      .filter((i) => i >= 0);

    // If no optional params, return original path
    if (optionalIndexes.length === 0) {
      return ['/' + segments.join('/')];
    }

    // Generate all combinations using bitwise operations
    const combinations: Set<string> = new Set();
    const total = 1 << optionalIndexes.length; // 2^n combinations

    for (let mask = 0; mask < total; mask++) {
      const includedSegments = segments.filter((_segment, idx) => {
        // Always include non-optional segments
        if (!this.matchers.paramOptionalSegment.test(segments[idx]!)) {
          return true;
        }
        // Include optional segment if corresponding bit is set
        const bit = optionalIndexes.indexOf(idx);
        return !!(mask & (1 << bit));
      });

      // Build path string for this combination
      const combinationPath = includedSegments.length === 0 ? '/' : '/' + includedSegments.join('/');

      combinations.add(combinationPath);
    }

    return Array.from(combinations);
  }

  /**
   * Registers a static path directly into the static path cache.
   * @param {string} path The static path to register.
   * @param {T} [store] Optional pre-created store object. If not provided, a new one is created using `storeFactory`.
   * @returns {T} The store object associated with the path.
   * @throws {Error} If the path is already registered.
   * @private
   */
  private registerStaticPath(path: string, store?: T): Match<T> | never {
    if (this.staticPathCache[path]) {
      this.throwError(ErrorTypes.PathAlreadyRegistered, path);
    }
    // No params in static path, so we can use the store directly
    // Even though Match<T> has params definitions and here we not return params,
    // I decided to leave the return type as Match<T> so TypeScript does not recognize params as unknown
    const newStore = Object.create(store ?? this.options.storeFactory());
    this.staticPathCache[path] = newStore;
    return newStore;
  }

  /**
   * Registers a dynamic path into the radix tree.
   * @param {string} path The dynamic path to register (e.g., '/users/:id', '/files/*').
   * @param {T} [store] Optional pre-created store object. If not provided, a new one is created using `storeFactory`.
   * @returns {T} The store object associated with the path.
   * @throws {Error} If the path conflicts with an existing registration or uses invalid syntax.
   * @private
   */
  private registerDynamicPath(path: string, store?: T): T | never {
    const segments = path.split('/').filter(Boolean);
    let currentNode: Node<T> = this.root;
    const newStore = store ?? this.options.storeFactory();
    const segmentsLength = segments.length;
    for (let i = 0; i < segmentsLength; i++) {
      const segment = segments[i] as string;
      //Static segment
      if (this.matchers.staticSegment.test(segment)) {
        currentNode = currentNode.staticChildren[segment] ??= this.createNode();
      }
      // Dynamic segment
      else if (this.plugins.length > 0) {
        let pluginMatch = false;
        for (const plugin of this.plugins) {
          const pluginMeta = plugin.handler(segment);
          if (pluginMeta !== null && pluginMeta !== undefined) {
            if (pluginMeta.wildcard && i !== segmentsLength - 1) {
              this.throwError(ErrorTypes.WildcardNotAtEnd, segment);
            }

            // Set plugin match flag
            pluginMatch = true;
            // Copy the plugin required properties to the pluginMeta object
            pluginMeta.id = plugin.id;
            pluginMeta.priority = plugin.priority;
            pluginMeta.syntax = plugin.syntax;

            // Ensure dynamicChildren array exists
            currentNode.dynamicChildren ??= [];
            const existingDynamicChildren = currentNode.dynamicChildren;

            // 1. Check if a node for this exact parameter (same plugin id, same param name) already exists
            const existingNodeForParam = existingDynamicChildren.find(
              (child) => child.pluginMeta?.id === pluginMeta.id && child.pluginMeta?.paramName === pluginMeta.paramName,
            );

            if (existingNodeForParam) {
              // Exact match found, reuse this node
              currentNode = existingNodeForParam;
            } else {
              // 2. No exact match. Check for conflicts: Does another dynamic node handled by the *same plugin* exist?
              const conflictingNode = existingDynamicChildren.find((child) => child.pluginMeta?.id === pluginMeta.id);

              if (conflictingNode) {
                // Conflict found. Throw error unless the *new* segment allows overriding.
                if (pluginMeta.override !== true) {
                  this.throwError(
                    ErrorTypes.DynamicSegmentAlreadyExists,
                    `${segment} (Plugin ID conflict: ${pluginMeta.id})`,
                  );
                }
                // If override is true, we allow adding a new node (handled below).
              }
              // 3. No exact match and no conflict (or override allowed), create a new node.
              const newNode: Node<T> = this.createNode();
              newNode.pluginMeta = pluginMeta;
              existingDynamicChildren.push(newNode);
              //  Keep dynamic children sorted by priority for matching
              // ! assertion: pluginMeta and priority are guaranteed to exist here
              existingDynamicChildren.sort((a, b) => a.pluginMeta!.priority! - b.pluginMeta!.priority!);
              currentNode = newNode;
            }
            // Break out of the loop since we found a plugin match
            break;
          }
        }
        // No plugin match found after checking all plugins
        if (!pluginMatch) {
          this.throwError(ErrorTypes.PluginDoesNotExist, segment);
        }
      }
      // No plugin found
      else {
        this.throwError(ErrorTypes.PluginDoesNotExist, segment);
      }
    }

    if (currentNode.store && currentNode.pluginMeta?.override !== true) {
      this.throwError(ErrorTypes.PathAlreadyRegistered, path);
    }

    currentNode.store = newStore;
    currentNode.registeredPath = path;
    return newStore;
  }

  /**
   * Unregisters a static path from the routing tree.
   * @param {string} path The static path to unregister (e.g., '/users/123').
   * @returns {boolean} `true` if the path was successfully unregistered, `false` otherwise.
   * @private
   */
  private unregisterStaticPath(path: string): boolean {
    const cachedStore = this.staticPathCache[path];
    if (cachedStore) {
      delete this.staticPathCache[path]; // Remove from static path cache
      return true; // Successfully unregistered
    }
    return false; // Path not found in static cache
  }

  /**
   * Unregisters a dynamic path from the routing tree.
   * @param {string} path The dynamic path to unregister (e.g., '/users/:id', '/files/*').
   * @returns {boolean} `true` if the path was successfully unregistered, `false` otherwise.
   * @private
   */
  private unregisterDynamicPath(path: string): boolean {
    const rootNode = this.root;
    // Segments length are always greater than 0. (If not, it would be a static path)
    const segments = path.split('/').filter(Boolean);
    const { unregistered } = this.cleanupTraversal(rootNode, segments, 0);
    return unregistered;
  }

  /**
   * Recursively traverses and cleans up the dynamic routing tree to unregister a dynamic path.
   * @param node The current node in the tree.
   * @param segment The current segment being processed.
   * @param segments The full array of path segments.
   * @param index The current index in the segments array.
   * @returns {boolean} True if the node should be deleted from its parent, false otherwise.
   */
  private cleanupTraversal(node: Node<T>, segments: string[], index: number): CleanupTraversalResult {
    // Helper function to check if a node is empty (no children)
    const isNodeEmpty = (node: Node<T>): boolean =>
      Object.keys(node.staticChildren).length === 0 && !node.dynamicChildren?.length;

    // Helper function to check if a node can be deleted (empty and no store)
    const canDeleteNode = (node: Node<T>): boolean => isNodeEmpty(node) && !node.store;

    // Last segment reached
    if (index === segments.length) {
      if (node.store) {
        node.store = undefined; // Clear the store
        node.registeredPath = undefined; // Clear the registered path
        return { shouldDelete: isNodeEmpty(node), unregistered: true };
      }
      return { shouldDelete: isNodeEmpty(node), unregistered: false }; // No store to clear
    }

    const segment = segments[index] as string;

    // Static segment
    if (this.matchers.staticSegment.test(segment)) {
      const staticChild = node.staticChildren[segment];
      if (staticChild) {
        const { shouldDelete, unregistered } = this.cleanupTraversal(staticChild, segments, index + 1);
        if (shouldDelete) {
          delete node.staticChildren[segment]; // Remove the static child
          return { shouldDelete: canDeleteNode(node), unregistered };
        }
        if (unregistered) {
          return { shouldDelete: false, unregistered: true };
        }
      }
    }
    // Dynamic segment
    else if (this.plugins.length > 0) {
      const dynamicChildren = node.dynamicChildren;
      if (dynamicChildren) {
        for (let i = 0; i < this.plugins.length; i++) {
          const pluginConfig = this.plugins[i];
          for (let j = 0; j < dynamicChildren.length; j++) {
            const childNode = dynamicChildren[j] as Node<T>;
            const childMeta = childNode.pluginMeta;
            const pluginMeta = pluginConfig?.handler(segment);
            if (childMeta?.id === pluginConfig?.id && childMeta?.paramName === pluginMeta?.paramName) {
              const { shouldDelete, unregistered } = this.cleanupTraversal(childNode, segments, index + 1);
              if (shouldDelete) {
                // Remove the child node from the dynamic children array
                dynamicChildren.splice(j, 1);
                // Check if the parent node can be deleted
                return { shouldDelete: canDeleteNode(node), unregistered };
              }
              if (unregistered) {
                return { shouldDelete: false, unregistered: true };
              }
            }
          }
        }
      }
    }
    return { shouldDelete: false, unregistered: false };
  }

  /**
   * Validates a plugin and its configuration.
   * @param {Plugin} plugin The plugin function to validate.
   * @returns {PluginConfig} The validated plugin configuration.
   * @throws {Error} If the plugin is invalid or fails validation checks.
   * @protected
   */
  protected validatePlugin(plugin: Plugin): PluginConfig | never {
    // Check if the plugin is a function
    if (typeof plugin !== 'function') {
      this.throwError(ErrorTypes.PluginIsNotFunction, typeof plugin);
    }
    let pluginConfig: PluginConfig;
    // Call the plugin function to get the configuration
    try {
      pluginConfig = plugin();
    } catch (error) {
      this.throwError(ErrorTypes.PluginUnexpected, error instanceof Error ? error.message : String(error));
    }
    // Check if the pluginConfig is an object
    if (!pluginConfig || typeof pluginConfig !== 'object') {
      this.throwError(ErrorTypes.PluginDoesNotReturnObject, typeof pluginConfig);
    }
    // Check if the pluginConfig has a id, priority
    if (!pluginConfig.id) {
      this.throwError(ErrorTypes.PluginMissingId);
    }
    // Check if the pluginConfig id is a string
    if (typeof pluginConfig.id !== 'string') {
      this.throwError(ErrorTypes.PluginIdIsNotString, typeof pluginConfig.id);
    }
    // Check if the pluginConfig id is already registered
    if (this.plugins.some((p) => p.id === pluginConfig.id)) {
      this.throwError(ErrorTypes.PluginWithSameIdAlreadyExists, pluginConfig.id);
    }
    // Check if the pluginConfig has a priority
    if (!pluginConfig.priority) {
      this.throwError(ErrorTypes.PluginMissingPriority);
    }
    // Check if the pluginConfig priority is a number
    if (typeof pluginConfig.priority !== 'number') {
      this.throwError(ErrorTypes.PluginPriorityIsNotNumber, typeof pluginConfig.priority);
    }
    // Check if the pluginConfig priority is already registered
    if (this.plugins.some((p) => p.priority === pluginConfig.priority)) {
      this.throwError(ErrorTypes.PluginWithSamePriorityAlreadyExists, String(pluginConfig.priority));
    }
    // Check if the pluginConfig has a syntax
    if (!pluginConfig.syntax) {
      this.throwError(ErrorTypes.PluginMissingSyntax);
    }
    // Check if the pluginConfig syntax is a string
    if (typeof pluginConfig.syntax !== 'string') {
      this.throwError(ErrorTypes.PluginSyntaxIsNotString, typeof pluginConfig.syntax);
    }
    // Check if the pluginConfig has no handler
    if (!pluginConfig.handler) {
      this.throwError(ErrorTypes.PluginMissingHandler, pluginConfig.id);
    }
    // Check if the pluginConfig has a handler
    if (typeof pluginConfig.handler !== 'function') {
      this.throwError(ErrorTypes.PluginIsNotFunction, typeof pluginConfig.handler);
    }

    let pluginMeta: PluginMeta | undefined | null;
    const syntax = pluginConfig.syntax;
    // Call the pluginConfig.handler to get the pluginMeta
    try {
      pluginMeta = pluginConfig.handler(syntax);
    } catch (error) {
      this.throwError(ErrorTypes.PluginUnexpected, error instanceof Error ? error.message : String(error));
    }
    // Check if the pluginMeta is not null or undefined
    // This is important when it return null or undefined it means that the plugin unsuccessfully hanldled the given syntax
    if (pluginMeta === null || pluginMeta === undefined) {
      this.throwError(ErrorTypes.PluginHandlerReturnNullOrUndefinedForSyntax, syntax);
    }
    // Check if the pluginMeta is an object
    if (!pluginMeta || typeof pluginMeta !== 'object') {
      this.throwError(ErrorTypes.PluginHandlerDoesNotReturnObject, typeof pluginMeta);
    }
    // Check if the pluginMeta has a match function
    if (!pluginMeta.match) {
      this.throwError(ErrorTypes.PluginHandlerMissingMatch);
    }
    // Check if the pluginMeta match is a function
    if (typeof pluginMeta.match !== 'function') {
      this.throwError(ErrorTypes.PluginHandlerMatchIsNotFunction, typeof pluginMeta.match);
    }

    let matchResult: boolean;
    // Call the pluginMeta.match to get the match result
    try {
      matchResult = pluginMeta.match({ urlSegment: '', urlSegments: [''], index: 0, params: {} });
    } catch (error) {
      this.throwError(ErrorTypes.PluginUnexpected, error instanceof Error ? error.message : String(error));
    }
    // Check if the matchResult is a boolean. we dont care now about the exact value.
    if (typeof matchResult !== 'boolean') {
      this.throwError(ErrorTypes.PluginHandlerMatchDoesNotReturnBoolean, typeof matchResult);
    }
    return pluginConfig;
  }

  /**
   * Registers a plugin with the router.
   * Plugins extend the router's ability to handle custom parameter types or wildcards in dynamic routes.
   * Plugins are validated and added in order of their `priority` (lower number = higher precedence).
   * @param {Plugin} plugin The plugin function to register.
   * @returns {this} The router instance (for chaining).
   * @throws {Error} If the plugin is invalid or conflicts with an existing plugin.
   * @public
   */
  public use(plugin: Plugin): this | never {
    const pluginConfig = this.validatePlugin(plugin);
    this.plugins.push(pluginConfig);
    // Keep this.plugins sorted by priority (lower number = higher precedence)
    this.plugins.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Retrieves a list of all registered routes.
   * Useful for debugging or administrative purposes.
   * @returns {ListedRoute<T>[]} An array of objects, each describing a registered route.
   * @public
   */
  public inspect(): ListedRoute<T>[] {
    const listedRoute: ListedRoute<T>[] = [];
    // 1. Static Routes
    for (const path in this.staticPathCache) {
      if (Object.prototype.hasOwnProperty.call(this.staticPathCache, path)) {
        const staticStore = this.staticPathCache[path] as T;
        listedRoute.push({
          path: path,
          type: 'static',
          store: staticStore,
        });
      }
    }

    // 2. Dynamic Routes
    // Use a Set to ensure each unique registeredPath is added only once,
    const addedDynamicRegisteredPaths = new Set<string>();

    const traverse = (node: Node<T>) => {
      // If a node has a store and a registeredPath, it's a terminal node for a dynamic route.
      if (node.store && node.registeredPath) {
        if (!addedDynamicRegisteredPaths.has(node.registeredPath)) {
          listedRoute.push({
            path: node.registeredPath, // Use the stored registeredPath
            type: 'dynamic', // Routes from the tree with registeredPath are dynamic
            store: node.store,
          });
          addedDynamicRegisteredPaths.add(node.registeredPath);
        }
      }

      // Traverse static children
      for (const segment in node.staticChildren) {
        if (Object.prototype.hasOwnProperty.call(node.staticChildren, segment)) {
          traverse(node.staticChildren[segment]!);
        }
      }

      // Traverse dynamic children
      if (node.dynamicChildren) {
        for (const childNode of node.dynamicChildren) {
          traverse(childNode);
        }
      }
    };

    traverse(this.root); // Start traversal from the root for dynamic paths

    return listedRoute;
  }

  /**
   * Registers a route path with the router.
   * Handles static paths, dynamic paths with parameters/wildcards (requires plugins),
   * and paths with optional parameters.
   * @param {string} path The route path to register.
   * @returns {T} The store object associated with this route. You can add route-specific data to this object.
   * @throws {Error} If the path is invalid, conflicts with an existing route, or requires an unregistered plugin.
   * @public
   */
  public register(path: string): T | never {
    if (!path) {
      this.throwError(ErrorTypes.PathIsEmpty);
    }
    // Static path registration
    if (this.matchers.staticPath.test(path)) {
      return this.registerStaticPath(path);
    }
    // Param optional in path registration
    if (this.matchers.paramOptionalInPath.test(path)) {
      // Generate all combinations of optional segments
      const generatedPaths = this.generateOptionals(path);
      // Define a shared store for all generated paths
      const sharedStore: T = this.options.storeFactory();
      // Register each generated path with the shared store
      for (const generatedPath of generatedPaths) {
        // For static paths, register them in the static path cache
        if (this.matchers.staticPath.test(generatedPath)) {
          this.registerStaticPath(generatedPath, sharedStore);
        }
        // For dynamic paths, register them in root tree
        else {
          this.registerDynamicPath(generatedPath, sharedStore);
        }
      }
      return sharedStore;
    }
    // No static path, no param optional in path, so it must be a dynamic path
    return this.registerDynamicPath(path);
  }

  public unregister(path: string): boolean {
    // Check if the path is a static path
    if (this.matchers.staticPath.test(path)) {
      return this.unregisterStaticPath(path);
    }
    // Check if the path is has optional params
    if (this.matchers.paramOptionalInPath.test(path)) {
      // Generate all combinations of optional segments
      const generatedPaths = this.generateOptionals(path);
      let success = false;
      for (const generatedPath of generatedPaths) {
        // For static paths, unregister them in the static path cache
        if (this.matchers.staticPath.test(generatedPath)) {
          success = this.unregisterStaticPath(generatedPath);
        }
        // For dynamic paths, unregister them in root tree
        else {
          success = this.unregisterDynamicPath(generatedPath);
        }
      }
      return success;
    }
    // No static path, no param optional in path, so it must be a dynamic path
    return this.unregisterDynamicPath(path);
  }

  /**
   * Matches a given path against the registered routes.
   * Checks the static cache first, then traverses the radix tree for dynamic matches.
   * @param {string} path The path to match (e.g., '/users/123').
   * @returns {Match<T> | T | null}
   *   - The exact store object `T` if a static path matches.
   *   - A `Match<T>` object (the store object `T` augmented with a `params` property) if a dynamic path matches.
   *   - `null` if no matching route is found.
   * @public
   */
  public match(path: string): Match<T> | null {
    // 1. Check static path cache (Fast O(1))
    const cachedStore = this.staticPathCache[path];
    if (cachedStore) {
      return cachedStore;
    }

    // 2. Prepare for dynamic path traversal
    const segments = path.split('/').filter(Boolean);
    const segmentCount = segments.length; // Cache length
    let currentNode: Node<T> = this.root;
    const params: Record<string, string> = Object.create(null);
    let i = 0;

    // 3. Traverse segments
    for (; i < segmentCount; i++) {
      const segment = segments[i] as string;

      // 3a. Check static children first (Fast O(1) average)
      const staticChild = currentNode.staticChildren[segment];
      if (staticChild) {
        currentNode = staticChild;
        continue; // Move to the next segment
      }
      // 3b. Check dynamic children (Potentially O(N) where N is num dynamic children)
      const dynamicChildren = currentNode.dynamicChildren;
      if (dynamicChildren) {
        let dynamicMatchFound = false;
        // Iterate through dynamic children (sorted by priority during registration)
        for (let j = 0; j < dynamicChildren.length; j++) {
          const dynamicChildNode = dynamicChildren[j] as Node<T>;
          const pluginMeta = dynamicChildNode?.pluginMeta;
          if (pluginMeta?.match({ urlSegment: segment, urlSegments: segments, index: i, params })) {
            // If it's a wildcard match, return immediately.
            if (pluginMeta.wildcard && dynamicChildNode?.store !== undefined) {
              const matchResult = Object.create(dynamicChildNode.store);
              matchResult.params = params;
              return matchResult;
            }

            currentNode = dynamicChildNode; // Move to the matched dynamic node
            dynamicMatchFound = true;
            break; // Stop checking other dynamic children for this segment (priority respected)
          }
        }

        // If no dynamic child matched this segment after checking all possibilities, return null
        if (!dynamicMatchFound) {
          return null;
        }
      }
      // 3c. No static child and no dynamic children array at this node, return null
      else {
        return null;
      }
    }

    // 4. End of segments reached. Check if the final node has a store.
    // Ensure we consumed all segments (i === segmentCount)
    if (i === segmentCount && currentNode.store) {
      // Create result object inheriting from store
      const matchResult = Object.create(currentNode.store);
      matchResult.params = params;
      return matchResult;
    }

    // 5. End of segments reached, but no store at the final node, or not all segments consumed
    return null;
  }
}
