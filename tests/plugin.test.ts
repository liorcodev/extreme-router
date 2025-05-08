/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import type { PluginConfig } from '../src/types';

describe('Extreme Router - Plugin System', () => {
  let testExtreme: TestExtreme;
  const testStore = { data: 'test' };

  beforeEach(() => {
    testExtreme = new TestExtreme({ storeFactory: () => ({ ...testStore }) });
  });

  it('should register a plugin', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });

    testExtreme.use(plugin);
    const plugins = testExtreme.getPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.id).toBe('testPlugin');
    expect(plugins[0]?.priority).toBe(1);
    expect(plugins[0]?.handler).toBeInstanceOf(Function);
  });
  it('should throw error if plugin is not a function', () => {
    const plugin = 'notAFunction' as unknown as () => PluginConfig;
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin function throw a Error value', () => {
    const plugin = () => {
      throw new Error('Unexpected error');
    };
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin function throws a non-Error value', () => {
    const plugin = () => {
      throw 'Unexpected string error';
    };
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin does not return an object', () => {
    const plugin = () => 'notAnObject' as unknown as PluginConfig;
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin does not have an id', () => {
    const plugin = () => ({
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin id is not a string', () => {
    const plugin = () => ({
      id: 123 as unknown as string,
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin does not have a priority', () => {
    const plugin = () => ({
      id: 'testPlugin',
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin priority is not a number', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 'notANumber' as unknown as number,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin does not have a syntax', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin syntax is not a string', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 123 as unknown as string,
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    expect(() => testExtreme.use(plugin)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin syntax fails to match', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => null,
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin does not have a handler', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler is not a function', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: 'notAFunction' as unknown as () => void,
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler acts unexpectedly', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => {
        throw new Error('Unexpected error');
      },
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error (string) if plugin handler acts unexpectedly', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => {
        throw 'Unexpected string error in handler';
      },
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler does not return an object', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => 'notAnObject' as unknown as PluginConfig,
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler does not have match function', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler match function is not a function', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
        match: 'notAFunction' as unknown as () => boolean,
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler match function does not return a boolean', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
        match: () => 'notABoolean' as unknown as boolean,
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin handler match function acts unexpectedly', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
        match: () => {
          throw new Error('Unexpected error');
        },
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error (string) if plugin handler match function acts unexpectedly', () => {
    const plugin = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
        match: () => {
          throw 'Unexpected string error in match';
        },
      }),
    });
    expect(() => testExtreme.use(plugin as any)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin id already exists', () => {
    const plugin1 = () => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    const plugin2 = () => ({
      id: 'testPlugin',
      priority: 2,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    testExtreme.use(plugin1);
    expect(() => testExtreme.use(plugin2)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if plugin priority already exists', () => {
    const plugin1 = () => ({
      id: 'testPlugin1',
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    const plugin2 = () => ({
      id: 'testPlugin2',
      priority: 1,
      syntax: 'testSyntax',
      handler: (segment: string) => ({
        paramName: segment,
        match: () => true,
      }),
    });
    testExtreme.use(plugin1);
    expect(() => testExtreme.use(plugin2)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if no plugin is registered', () => {
    expect(() => testExtreme.register('/:id')).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if no plugin match the segment', () => {
    const testExtremeNoPlugin = new TestExtreme();
    testExtremeNoPlugin.use(() => ({
      id: 'testPlugin',
      priority: 1,
      syntax: 'testSyntax',
      handler: () => ({
        paramName: 'test',
        match: () => false,
      }),
    }));
    (testExtremeNoPlugin.getPlugins()[0] as any).handler = () => false;
    expect(() => testExtremeNoPlugin.register('/:id')).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if registered plugins do not match the dynamic segment', () => {
    const specificExtreme = new TestExtreme();
    specificExtreme.use(() => ({
      // Add the non-matching plugin
      id: 'userPlugin',
      priority: 5,
      syntax: 'user-:name',
      handler: (segment: string) => {
        if (segment.startsWith('user-')) {
          return { paramName: segment.substring(5), match: ({ urlSegment }) => urlSegment.startsWith('user-') };
        }
        return null; // <-- Crucial: return null for non-matches
      },
    }));

    expect(() => specificExtreme.register('/product/:productId')).toThrowErrorMatchingSnapshot();
  });
});
