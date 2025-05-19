/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import { param } from '../src/plugins/param';
import type { Plugin } from '../src/types';

describe('Extreme Router - Register() API', () => {
  let testExtreme: TestExtreme;
  type TestStore = { storeId: 'test' };
  const testStore: TestStore = { storeId: 'test' };

  beforeEach(() => {
    testExtreme = new TestExtreme<TestStore>({ storeFactory: () => ({ storeId: 'test' }) });
    testExtreme.use(param);
  });

  it('should register static paths correctly', () => {
    testExtreme.register('/');
    testExtreme.register('/test');
    testExtreme.register('/test/test2');
    testExtreme.register('/test/test2/test3');

    expect(testExtreme.getStaticPathCache()).toMatchObject({
      '/': testStore,
      '/test': testStore,
      '/test/test2': testStore,
      '/test/test2/test3': testStore,
    });
  });
  it('should register dynamic paths correctly', () => {
    testExtreme.register('/:id');
    testExtreme.register('/:id/:test');
    testExtreme.register('/:id/:test/user');
    expect(testExtreme.getRoot()).toMatchObject({
      dynamicChildren: [
        {
          pluginMeta: {
            paramName: 'id',
          },
          store: testStore,
          dynamicChildren: [
            {
              pluginMeta: {
                paramName: 'test',
              },
              store: testStore,
              staticChildren: {
                user: {
                  store: testStore,
                },
              },
            },
          ],
        },
      ],
    });
  });
  it('should throw error if static path is already registered', () => {
    testExtreme.register('/test/test2/test3');
    expect(() => testExtreme.register('/test/test2/test3')).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if param path is already registered', () => {
    testExtreme.register('/:id/:test');
    expect(() => testExtreme.register('/:id/:test')).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if param is already registered but with different param name', () => {
    testExtreme.register('/:id/:test/user');
    expect(() => testExtreme.register('/:opa/:test/user')).toThrowErrorMatchingSnapshot();
  });
  it('should not throw error path registered but allowRegisterUpdateExisting is true', () => {
    testExtreme = new TestExtreme<TestStore>({
      storeFactory: () => testStore,
      allowRegisterUpdateExisting: true,
    });
    testExtreme.register('/test/test2/test3');
    expect(() => testExtreme.register('/test/test2/test3')).not.toThrowError();
  });
  it('should return the same store if the static path is already registered and allowRegisterUpdateExisting is true', () => {
    testExtreme = new TestExtreme<TestStore>({
      storeFactory: () => ({ storeId: 'test' }),
      allowRegisterUpdateExisting: true,
    });
    testExtreme.register('/test/test2/test3');
    (testExtreme.register('/test/test2/test3') as any).newProperty = 'newValue';
    expect(testExtreme.register('/test/test2/test3')).toMatchObject({
      newProperty: 'newValue',
      storeId: 'test',
    });
  });
  it('should return the same store if the param path is already registered and allowRegisterUpdateExisting is true', () => {
    testExtreme = new TestExtreme<TestStore>({
      storeFactory: () => ({ storeId: 'test' }),
      allowRegisterUpdateExisting: true,
      plugins: [param],
    });
    testExtreme.register('/:id/:test/user');
    (testExtreme.register('/:id/:test/user') as any).newProperty = 'newValue';
    expect(testExtreme.register('/:id/:test/user')).toMatchObject({
      newProperty: 'newValue',
      storeId: 'test',
    });
  });
  it('should override the store if dynamic property override is set to true and allowRegisterUpdateExisting is false', () => {
    testExtreme = new TestExtreme<TestStore>({
      storeFactory: () => ({ storeId: 'test' }),
      allowRegisterUpdateExisting: false,
    });
    const newPlugin: Plugin = () => {
      return {
        id: 'newPlugin',
        priority: 100,
        syntax: '::no matter',
        handler: (syntax) => {
          if (!syntax.startsWith('::')) return null;
          return {
            paramName: '',
            override: true,
            match: () => {
              return true;
            },
          };
        },
      };
    };
    testExtreme.use(newPlugin);
    (testExtreme.register('/::test') as any).newProperty = 'newValue';
    expect(testExtreme.register('/::test')).not.toHaveProperty('newProperty');
  });
});
