import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle parameters with regex validation.
 * Syntax: `:paramName<\d+>`
 */
export const regexParam: Plugin = () => {
  const id = 'regexParam';
  const priority = 400;
  const syntax = ':paramName<\\d+>';

  const handler: PluginHandler = (segment) => {
    const match = /^:(?<paramName>[a-zA-Z0-9_-]+)<(?<regex>.+)>$/.exec(segment);
    if (!match || !match.groups || !match.groups.paramName || !match.groups.regex) {
      return null;
    }
    const paramName = match.groups.paramName;
    const regex = new RegExp(`^${match.groups.regex}$`);
    return {
      paramName,
      additionalMeta: {
        regex,
      },
      match({ urlSegment, params }) {
        const match = urlSegment.match(regex);
        if (!match) return false;
        params[paramName] = match[0];
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
