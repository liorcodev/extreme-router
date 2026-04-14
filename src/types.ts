export type Store = object;

export type PluginHandler = (segment: string) => PluginMeta | undefined | null;

export interface PluginConfig {
  id: string;
  priority: number;
  syntax: string;
  handler: PluginHandler;
}

export type Plugin = () => PluginConfig;

export interface PluginMeta {
  // Priority, id, syntax are automatically added by the plugin manager according to the plugin config
  // So no need to add them in the plugin meta
  // They are used here for matching priority logic (Important!), id and syntax for debugging
  paramName: string;
  priority?: number;
  id?: string;
  syntax?: string;
  override?: boolean;
  wildcard?: boolean;
  additionalMeta?: {
    group?: Record<string | number, unknown>;
    regex?: RegExp;
    extension?: string;
    [k: string]: unknown;
  };
  match: ({
    urlSegment,
    urlSegments,
    index,
    params,
  }: {
    urlSegment: string;
    urlSegments: string[];
    index: number;
    params: Record<string, unknown>;
  }) => boolean;
}

export interface Node<T extends Store = Store> {
  registeredPath?: string;
  staticChildren: Record<string, Node<T>>;
  dynamicChildren?: Node<T>[];
  pluginMeta?: PluginMeta;
  store?: T;
}

export interface Options<T extends Store = Store> {
  storeFactory: () => T;
  plugins: Plugin[];
  allowRegisterUpdateExisting?: boolean;
  skipPluginValidation?: boolean;
}

export type Match<T extends Store = Store> = T & {
  params: Record<string, string>;
};

export enum ErrorTypes {
  StoreIsNotFunction,
  StoreDoesNotReturnObject,
  StoreUnexpected,
  PathAlreadyRegistered,
  PathIsEmpty,
  PluginWithSameIdAlreadyExists,
  PluginWithSamePriorityAlreadyExists,
  PluginIsNotFunction,
  PluginDoesNotReturnObject,
  PluginsOptionNotArray,
  PluginMissingId,
  PluginMissingPriority,
  PluginIdIsNotString,
  PluginPriorityIsNotNumber,
  PluginMissingSyntax,
  PluginSyntaxIsNotString,
  PluginMissingHandler,
  PluginHandlerIsNotFunction,
  PluginHandlerReturnNullOrUndefinedForSyntax,
  PluginHandlerDoesNotReturnObject,
  PluginHandlerMissingMatch,
  PluginHandlerMatchIsNotFunction,
  PluginHandlerMatchDoesNotReturnBoolean,
  PluginUnexpected,
  PluginDoesNotExist,
  DynamicSegmentAlreadyExists,
  WildcardNotAtEnd,
}

export interface ListedRoute<T extends Store> {
  path: string;
  type: 'static' | 'dynamic';
  store: T;
}

export interface CleanupTraversalResult {
  shouldDelete: boolean;
  unregistered: boolean;
}

export interface CreatePluginOptions {
  id: string;
  priority: number;
  syntax: string;
  /**
   * A regular expression run against the **registration-time** path segment to detect whether
   * this plugin should handle it.
   *
   * Must contain a named capture group `paramName` that identifies the parameter name
   * (e.g., `/^:(?<paramName>[a-zA-Z0-9_-]+)<uuid>$/`).
   *
   * Any additional named capture groups are extracted and passed to `test` as the `captures` argument.
   *
   * **⚠️ WARNING:** Do not use stateful flags (`g`, `y`) — it is executed once per segment via `exec`.
   */
  detect: RegExp;
  /**
   * A function called at **match time** to validate the incoming URL segment.
   *
   * Receives the raw URL segment and an object of all named capture groups from `detect`.
   * When `true` is returned, the helper automatically sets `params[paramName] = urlSegment`.
   */
  test: (urlSegment: string, captures: Record<string, string>) => boolean;
  wildcard?: boolean;
  override?: boolean;
}
