import type { Store, Options, Node, ErrorTypes, PluginConfig, Plugin } from '../src/types';
import Extreme from '../src/router';

// For testing purposes, expose the protected members of the Extreme class
export default class TestExtreme<T extends Store = Store> extends Extreme<T> {
  constructor(options: Partial<Options<T>> = {}) {
    super(options);
  }
  public getStaticPathCache(): Record<string, T> {
    return this.staticPathCache;
  }
  public getRoot(): Node<T> {
    return this.root;
  }
  public getErrorTypes(): Record<ErrorTypes, (inline?: string) => string> {
    return this.errorTypes;
  }
  public getMatchers(): Record<string, RegExp> {
    return this.matchers;
  }
  public getOptions(): Options<T> {
    return this.options;
  }
  public getDefaultOptions(): Options<T> {
    return this.defaultOptions;
  }
  public generateOptionals(path: string): string[] {
    return super.generateOptionals(path);
  }
  public throwError(type: ErrorTypes, inline?: string): never {
    return super.throwError(type, inline);
  }
  public getPlugins(): PluginConfig[] {
    return this.plugins;
  }
  public validatePlugin(plugin: Plugin): PluginConfig | never {
    return super.validatePlugin(plugin);
  }
}
