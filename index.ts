import Extreme from './src/router';
import type {
  Match,
  Options,
  Plugin,
  PluginConfig,
  PluginHandler,
  PluginMeta,
  ListedRoute,
  ErrorTypes,
} from './src/types';
import { param } from './src/plugins/param';
import { wildcard } from './src/plugins/wildcard';
import { regexParam } from './src/plugins/regexParam';
import { extensionParam } from './src/plugins/extensionParam';
import { groupParam } from './src/plugins/groupParam';
import { prefixGroup } from './src/plugins/prefixGroup';
import { optionalPrefixGroup } from './src/plugins/optionalPrefixGroup';
import { optionalParam } from './src/plugins/optionalParam';

export default Extreme;
export type { Match, Options, Plugin, PluginConfig, PluginHandler, PluginMeta, ListedRoute, ErrorTypes };
export { param, wildcard, regexParam, extensionParam, groupParam, prefixGroup, optionalPrefixGroup, optionalParam };
