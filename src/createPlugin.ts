import type { CreatePluginOptions, Plugin, PluginConfig, PluginHandler } from './types';

/**
 * A helper utility that creates a fully valid `Plugin` from a minimal configuration,
 * eliminating the boilerplate of writing `PluginHandler`, `PluginMeta`, and the factory
 * wrapper by hand.
 *
 * @param {CreatePluginOptions} options - The plugin configuration.
 * @returns {Plugin} A plugin factory function ready to be passed to `router.use()`.
 *
 * @example
 * ```typescript
 * import Extreme, { createPlugin } from 'extreme-router';
 *
 * const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 *
 * const uuidPlugin = createPlugin({
 *   id: 'uuid',
 *   priority: 550,
 *   syntax: ':name<uuid>',
 *   detect: /^:(?<paramName>[a-zA-Z0-9_-]+)<uuid>$/,
 *   test: (urlSegment) => UUID_REGEX.test(urlSegment),
 * });
 *
 * const router = new Extreme();
 * router.use(uuidPlugin);
 * router.register('/orders/:orderId<uuid>').handler = 'getOrder';
 * ```
 */
export const createPlugin = (options: CreatePluginOptions): Plugin => {
  const { id, priority, syntax, detect, test, wildcard, override } = options;

  const plugin: Plugin = () => {
    const handler: PluginHandler = (segment) => {
      const match = detect.exec(segment);
      if (!match || !match.groups || !match.groups.paramName) {
        return null;
      }

      // Capture all named groups at registration time; close over them for match time
      const captures = match.groups as Record<string, string>;
      // paramName is guaranteed to be a string here (checked in the guard above)
      const paramName = match.groups.paramName;

      return {
        paramName,
        ...(wildcard !== undefined && { wildcard }),
        ...(override !== undefined && { override }),
        match({ urlSegment, params }) {
          if (!test(urlSegment, captures)) return false;
          params[paramName] = urlSegment;
          return true;
        },
      };
    };

    const pluginConfig: PluginConfig = {
      id,
      priority,
      syntax,
      handler,
    };

    return pluginConfig;
  };

  return plugin;
};
