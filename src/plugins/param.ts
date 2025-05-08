import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle basic parameters.
 * Syntax: `:paramName`
 */
export const param: Plugin = () => {
  const id = 'param';
  const priority = 700;
  const syntax = ':paramName';

  const handler: PluginHandler = (segment) => {
    const match = /^:(?<paramName>[a-zA-Z0-9_-]+)$/.exec(segment);
    if (!match || !match.groups || !match.groups.paramName) {
      return null;
    }
    const paramName = match.groups.paramName;
    return {
      paramName,
      match({ urlSegment, params }) {
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
