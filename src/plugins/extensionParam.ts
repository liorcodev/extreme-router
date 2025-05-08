import type { Plugin, PluginHandler } from '../types';

/**
 * Plugin to handle parameters with a specific file extension.
 * Syntax: `:file.css`
 */
export const extensionParam: Plugin = () => {
  const id = 'extensionParam';
  const priority = 500;
  const syntax = ':file.css';

  const handler: PluginHandler = (segment) => {
    const match = /^:(?<paramName>[a-zA-Z0-9_-]+)\.(?<extension>.+)$/.exec(segment);
    if (!match || !match.groups || !match.groups.paramName || !match.groups.extension) {
      return null;
    }
    const paramName = match.groups.paramName;
    const extension = match.groups.extension;
    return {
      paramName,
      additionalMeta: {
        extension,
      },
      match({ urlSegment, params }) {
        if (!urlSegment.endsWith(extension)) return false;
        params[paramName] = urlSegment.slice(0, -(extension.length + 1));
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
