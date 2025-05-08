export type Store = Record<string, unknown>;

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
