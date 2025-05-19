import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import { param } from '../src/plugins/param';
import { wildcard } from '../src/plugins/wildcard';
import { optionalParam } from '../src/plugins/optionalParam';
import type { Store } from '../src/types';

describe('Extreme Router - inspect() API', () => {
  let router: TestExtreme<Store>;
  const storeFactory = () => ({ message: 'default store from factory' });

  beforeEach(() => {
    router = new TestExtreme<Store>({
      storeFactory,
      plugins: [param, wildcard, optionalParam],
    });
  });

  it('should return an empty array for a new router with no routes', () => {
    expect(router.inspect()).toEqual([]);
  });

  it('should correctly list a registered static route', () => {
    const path = '/static/path';
    const expectedStore = router.register(path);

    const routes = router.inspect();
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({
      path: path,
      type: 'static',
      store: expectedStore,
    });
  });

  it('should correctly list a registered dynamic route', () => {
    const path = '/users/:id/profile/:action';
    const expectedStore = router.register(path);

    const routes = router.inspect();
    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({
      path: path,
      type: 'dynamic',
      store: expectedStore,
    });
  });

  it('should correctly list routes generated from an optional parameter path', () => {
    const expectedStore = router.register('/optional/:opt?');
    const routes = router.inspect();

    expect(routes).toHaveLength(2);

    expect(routes[0]).toMatchObject({
      path: '/optional',
      type: 'static',
      store: expectedStore,
    });
    // Test the dynamic route
    expect(routes[1]).toMatchObject({
      path: '/optional/:opt?',
      type: 'dynamic',
      store: expectedStore,
    });
  });

  it('should correctly list a mix of routes, including root and wildcards', () => {
    const storeRootHolder = router.register('/');
    const storeAboutHolder = router.register('/about');
    const storeApiOptionalShared = router.register('/api/:version?/data');
    const storeUser = router.register('/user/:id');
    const storeFiles = router.register('/files/*');

    const routes = router.inspect();
    expect(routes.length).toBe(6);

    expect(routes[0]).toMatchObject({
      path: '/',
      type: 'static',
      store: storeRootHolder,
    });
    expect(routes[1]).toMatchObject({
      path: '/about',
      type: 'static',
      store: storeAboutHolder,
    });
    expect(routes[2]).toMatchObject({
      path: '/api/data',
      type: 'static',
      store: storeApiOptionalShared,
    });
    expect(routes[3]).toMatchObject({
      path: '/api/:version?/data',
      type: 'dynamic',
      store: storeApiOptionalShared,
    });
    expect(routes[4]).toMatchObject({
      path: '/user/:id',
      type: 'dynamic',
      store: storeUser,
    });
    expect(routes[5]).toMatchObject({
      path: '/files/*',
      type: 'dynamic',
      store: storeFiles,
    });
  });
});
