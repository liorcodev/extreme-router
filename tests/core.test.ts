/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';

describe('Extreme Router - Core', () => {
  let testExtreme: TestExtreme;

  beforeEach(() => {
    testExtreme = new TestExtreme({ storeFactory: () => ({ storeId: 'test' }) });
  });
  it('should generateOptionals correctly', () => {
    let generatedPaths = testExtreme.generateOptionals('/test/:id?/:name?/age');
    expect(generatedPaths).toMatchObject(['/test/age', '/test/:id?/age', '/test/:name?/age', '/test/:id?/:name?/age']);
    generatedPaths = testExtreme.generateOptionals('/:id?');
    expect(generatedPaths).toMatchObject(['/', '/:id?']);
    generatedPaths = testExtreme.generateOptionals('/test/user');
    expect(generatedPaths).toMatchObject(['/test/user']);
  });
  it('should throw error if error type is undefined or unknown', () => {
    expect(() => testExtreme.throwError(undefined as any)).toThrowError('Unknown error type');
  });
});
