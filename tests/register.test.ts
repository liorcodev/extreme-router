import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import { param } from '../src/plugins/param';

describe('Extreme Router - Register() API', () => {
  let testExtreme: TestExtreme;
  type TestStore = { storeId: 'test' };
  const testStore: TestStore = { storeId: 'test' };

  beforeEach(() => {
    testExtreme = new TestExtreme<TestStore>({ storeFactory: () => testStore });
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
});
