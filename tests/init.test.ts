/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import { param } from '../src/plugins/param';

describe('Extreme Router - Init', () => {
  let testExtreme: TestExtreme;
  const testStore = { storeId: 'test' };

  beforeEach(() => {
    testExtreme = new TestExtreme({ storeFactory: () => ({ storeId: 'test' }) });
  });

  it('should create a new instance of TestExtreme', () => {
    expect(testExtreme).toBeInstanceOf(TestExtreme);
  });
  it('should set storeFactory option correctly', () => {
    expect(testExtreme.getOptions().storeFactory()).toMatchObject(testStore);
  });
  it('should create a default store if storeFactory is not provided', () => {
    const defaultExtreme = new TestExtreme({ storeFactory: undefined });
    expect(defaultExtreme.getOptions().storeFactory()).toMatchObject(defaultExtreme.getDefaultOptions().storeFactory());
  });
  it('should throw an error if storeFactory is not a function', () => {
    expect(() => new TestExtreme({ storeFactory: 'not a function' as any })).toThrowError();
  });
  it('should throw an error if storeFactory throws a non-Error value', () => {
    expect(
      () =>
        new TestExtreme({
          storeFactory: () => {
            throw 'a string error';
          },
        }),
    ).toThrowErrorMatchingSnapshot();
  });
  it('should throw an error if storeFactory throws a Error value', () => {
    expect(
      () =>
        new TestExtreme({
          storeFactory: () => {
            throw new Error('Unexpected error');
          },
        }),
    ).toThrowErrorMatchingSnapshot();
  });
  it('should throw an error if storeFactory does not return an object', () => {
    expect(() => new TestExtreme({ storeFactory: () => 'not an object' as any })).toThrowErrorMatchingSnapshot();
  });
  it('should create a default plugins array if plugins are not provided', () => {
    const defaultExtreme = new TestExtreme();
    expect(defaultExtreme.getOptions().plugins).toEqual([]);
  });
  it('should throw an error if plugins is not an array', () => {
    expect(() => new TestExtreme({ plugins: 'not an array' as any })).toThrowErrorMatchingSnapshot();
  });
  it('should set plugins option correctly', () => {
    const newTestExtreme = new TestExtreme({
      plugins: [param],
    });
    expect(newTestExtreme.getOptions().plugins.length).toBe(1);
    expect(newTestExtreme.getOptions().plugins[0]).toBe(param);
  });
  it('should set skipPluginValidation to false by default', () => {
    const defaultExtreme = new TestExtreme();
    expect(defaultExtreme.getOptions().skipPluginValidation).toBe(false);
  });
  it('should set skipPluginValidation option correctly', () => {
    const newTestExtreme = new TestExtreme({
      skipPluginValidation: true,
    });
    expect(newTestExtreme.getOptions().skipPluginValidation).toBe(true);
  });
  it('should skip plugin validation when skipPluginValidation is true', () => {
    const invalidPlugin = () => ({
      id: 'invalidPlugin',
      priority: 1,
      syntax: 'invalid',
      handler: () => 'invalid' as any, // Invalid: should return object with match function
    });

    // This should throw when validation is enabled (default)
    expect(() => new TestExtreme({ plugins: [invalidPlugin] })).toThrowError();

    // This should NOT throw when validation is disabled
    const extremeWithSkip = new TestExtreme({
      skipPluginValidation: true,
      plugins: [invalidPlugin],
    });
    expect(extremeWithSkip.getPlugins().length).toBe(1);
  });
  it('should skip plugin validation when using .use() with skipPluginValidation enabled', () => {
    const invalidPlugin = () => ({
      id: 'invalidPlugin',
      priority: 1,
      syntax: 'invalid',
      handler: () => null as any, // Invalid: should return object with match function
    });

    const extremeWithSkip = new TestExtreme({
      skipPluginValidation: true,
    });

    // This should NOT throw when validation is disabled
    expect(() => extremeWithSkip.use(invalidPlugin)).not.toThrow();
    expect(extremeWithSkip.getPlugins().length).toBe(1);
  });
  it('should validate plugins when skipPluginValidation is false', () => {
    const invalidPlugin = () => ({
      id: 'invalidPlugin',
      priority: 1,
      syntax: 'invalid',
      handler: () => null as any, // Invalid
    });

    const extremeWithValidation = new TestExtreme({
      skipPluginValidation: false,
    });

    // This should throw when validation is enabled
    expect(() => extremeWithValidation.use(invalidPlugin)).toThrowError();
  });
});
