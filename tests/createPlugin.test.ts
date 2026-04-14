/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import TestExtreme from './test-util';
import { createPlugin } from '../src/createPlugin';
import { param } from '../src/plugins/param';
import type { CreatePluginOptions } from '../src/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuidOptions: CreatePluginOptions = {
  id: 'uuid',
  priority: 550,
  syntax: ':name<uuid>',
  detect: /^:(?<paramName>[a-zA-Z0-9_-]+)<uuid>$/,
  test: (urlSegment) => UUID_REGEX.test(urlSegment),
};

describe('createPlugin helper', () => {
  let testExtreme: TestExtreme<any>;

  beforeEach(() => {
    testExtreme = new TestExtreme({ storeFactory: () => ({ handler: '' }) });
  });

  describe('returned Plugin function', () => {
    it('should return a Plugin (factory function)', () => {
      const plugin = createPlugin(uuidOptions);
      expect(typeof plugin).toBe('function');
    });

    it('should return a PluginConfig with correct id, priority and syntax', () => {
      const config = createPlugin(uuidOptions)();
      expect(config.id).toBe('uuid');
      expect(config.priority).toBe(550);
      expect(config.syntax).toBe(':name<uuid>');
    });

    it('should return a PluginConfig with a handler function', () => {
      const config = createPlugin(uuidOptions)();
      expect(typeof config.handler).toBe('function');
    });

    it('should produce a new PluginConfig on each call', () => {
      const plugin = createPlugin(uuidOptions);
      expect(plugin()).not.toBe(plugin());
    });
  });

  describe('handler (registration-time detect)', () => {
    it('should return null when detect does not match the segment', () => {
      const { handler } = createPlugin(uuidOptions)();
      expect(handler(':userId')).toBeNull();
      expect(handler('static')).toBeNull();
      expect(handler(':userId<\\d+>')).toBeNull();
    });

    it('should return null when detect matches but has no paramName group', () => {
      const { handler } = createPlugin({ ...uuidOptions, detect: /^<uuid>$/ })();
      expect(handler('<uuid>')).toBeNull();
    });

    it('should return PluginMeta with the correct paramName when detect matches', () => {
      const { handler } = createPlugin(uuidOptions)();
      const meta = handler(':orderId<uuid>');
      expect(meta).not.toBeNull();
      expect(meta?.paramName).toBe('orderId');
    });

    it('should close over all named capture groups from detect', () => {
      const testFn = vi.fn(() => true);
      const { handler } = createPlugin({
        ...uuidOptions,
        detect: /^:(?<paramName>[a-zA-Z0-9_-]+)<(?<format>[a-z]+)>$/,
        test: testFn,
      })();
      const meta = handler(':fileId<uuid>');
      expect(meta).not.toBeNull();
      meta!.match({ urlSegment: '123e4567-e89b-12d3-a456-426614174000', urlSegments: [], index: 0, params: {} });
      expect(testFn).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        expect.objectContaining({ paramName: 'fileId', format: 'uuid' }),
      );
    });
  });

  describe('PluginMeta.match (match-time test)', () => {
    it('should return true and set params[paramName] when test passes', () => {
      const meta = createPlugin(uuidOptions)().handler(':orderId<uuid>')!;
      const params: Record<string, unknown> = {};
      const result = meta.match({
        urlSegment: '123e4567-e89b-12d3-a456-426614174000',
        urlSegments: [],
        index: 0,
        params,
      });
      expect(result).toBe(true);
      expect(params.orderId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return false and not set params when test fails', () => {
      const meta = createPlugin(uuidOptions)().handler(':orderId<uuid>')!;
      const params: Record<string, unknown> = {};
      const result = meta.match({ urlSegment: 'not-a-uuid', urlSegments: [], index: 0, params });
      expect(result).toBe(false);
      expect(params.orderId).toBeUndefined();
    });

    it('should pass urlSegment and captures to the test function', () => {
      const testFn = vi.fn(() => false);
      const meta = createPlugin({ ...uuidOptions, test: testFn })().handler(':itemId<uuid>')!;
      meta.match({ urlSegment: 'abc', urlSegments: [], index: 0, params: {} });
      expect(testFn).toHaveBeenCalledWith('abc', expect.objectContaining({ paramName: 'itemId' }));
    });
  });

  describe('wildcard and override options', () => {
    it('should not set wildcard on PluginMeta when not provided', () => {
      const meta = createPlugin(uuidOptions)().handler(':id<uuid>')!;
      expect(meta?.wildcard).toBeUndefined();
    });

    it('should not set override on PluginMeta when not provided', () => {
      const meta = createPlugin(uuidOptions)().handler(':id<uuid>')!;
      expect(meta?.override).toBeUndefined();
    });

    it('should forward wildcard: true to PluginMeta', () => {
      const meta = createPlugin({ ...uuidOptions, wildcard: true })().handler(':id<uuid>')!;
      expect(meta?.wildcard).toBe(true);
    });

    it('should forward override: true to PluginMeta', () => {
      const meta = createPlugin({ ...uuidOptions, override: true })().handler(':id<uuid>')!;
      expect(meta?.override).toBe(true);
    });
  });

  describe('integration with router', () => {
    it('should be accepted by router.use() without error', () => {
      expect(() => testExtreme.use(createPlugin(uuidOptions))).not.toThrow();
    });

    it('should match a registered route with a valid UUID segment', () => {
      testExtreme.use(createPlugin(uuidOptions));
      testExtreme.register('/orders/:orderId<uuid>').handler = 'getOrder';
      const match = testExtreme.match('/orders/123e4567-e89b-12d3-a456-426614174000');
      expect(match).not.toBeNull();
      expect(match.handler).toBe('getOrder');
      expect(match?.params.orderId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return null for an invalid UUID segment', () => {
      testExtreme.use(createPlugin(uuidOptions));
      testExtreme.register('/orders/:orderId<uuid>').handler = 'getOrder';
      expect(testExtreme.match('/orders/not-a-uuid')).toBeNull();
    });

    it('should coexist with other plugins without conflict', () => {
      testExtreme.use(createPlugin(uuidOptions));
      testExtreme.use(param);
      testExtreme.register('/orders/:orderId<uuid>').handler = 'getOrderByUuid';
      testExtreme.register('/orders/:orderId').handler = 'getOrderById';

      expect(testExtreme.match('/orders/123e4567-e89b-12d3-a456-426614174000').handler).toBe('getOrderByUuid');
      expect(testExtreme.match('/orders/plain-id').handler).toBe('getOrderById');
    });
  });
});
