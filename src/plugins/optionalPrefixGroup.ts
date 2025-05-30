import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle optional prefix groups.
 * Syntax: `prefix(a|b)?`
 */
export const optionalPrefixGroup: Plugin = () => {
  const id = 'optionalPrefixGroup';
  const priority = 200;
  const syntax = 'prefix(a|b)?';

  const handler: PluginHandler = (segment) => {
    const match = /^(?<staticName>[a-zA-Z0-9_.-]+)\((?<dynamicGroup>[^|)]+(\|[^|)]+)+)\)\?$/.exec(segment);
    if (!match || !match.groups || !match.groups.staticName || !match.groups.dynamicGroup) {
      return null;
    }
    const staticName = match.groups.staticName;
    const dynamicGroup = match.groups.dynamicGroup;
    const group = Object.fromEntries(dynamicGroup.split('|').map((g) => [staticName + g, staticName + g]));
    group[staticName] = staticName;
    return {
      paramName: '',
      additionalMeta: { group },
      match({ urlSegment }) {
        return !!(group && group[urlSegment]);
      },
    };
  };

  return {
    id,
    priority,
    syntax,
    handler,
  };
};
