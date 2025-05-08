import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle wildcard parameters.
 * Syntax: `*` or `:wildcardName*`
 */
export const wildcard: Plugin = () => {
  const id = 'wildcard';
  const priority = 800;
  const syntax = '*';

  const handler: PluginHandler = (segment) => {
    const match = /^(?:\*|:(?<wildcardName>[a-zA-Z0-9_-]+)\*)$/.exec(segment);
    if (!match) {
      return null;
    }
    const paramName = match.groups?.wildcardName ?? '*';
    return {
      paramName,
      wildcard: true,
      match({ urlSegments, index, params }) {
        let rest = urlSegments[index];
        const segmentsLength = urlSegments.length;
        for (let j = index + 1; j < segmentsLength; j++) {
          rest += '/' + urlSegments[j];
        }
        params[paramName] = rest || '';
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
