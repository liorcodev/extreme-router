import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle grouped parameters.
 * Syntax: `:paramName(a|b)`
 */
export const groupParam: Plugin = () => {
  const id = 'groupParam';
  const priority = 300;
  const syntax = ':paramName(a|b)';

  const handler: PluginHandler = (segment) => {
    const match = /^:(?<paramName>[a-zA-Z0-9_-]+)\((?<dynamicGroup>[^|)]+(\|[^|)]+)+)\)$/.exec(segment);
    if (!match || !match.groups || !match.groups.paramName || !match.groups.dynamicGroup) {
      return null;
    }
    const paramName = match.groups.paramName;
    const dynamicGroup = match.groups.dynamicGroup;
    const group = Object.fromEntries(dynamicGroup.split('|').map((g) => [g, g]));
    return {
      paramName,
      additionalMeta: { group },
      match({ urlSegment, params }) {
        if (!group || !group[urlSegment]) return false;
        params[paramName] = urlSegment;
        return true;
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
