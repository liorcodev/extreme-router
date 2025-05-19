import { beforeEach, describe, it, expect } from 'vitest';
import TestExtreme from './test-util';
import { param } from '../src/plugins/param';
import { wildcard } from '../src/plugins/wildcard';
import { optionalParam } from '../src/plugins/optionalParam';
import { regexParam } from '../src/plugins/regexParam';
import { extensionParam } from '../src/plugins/extensionParam';
import { groupParam } from '../src/plugins/groupParam';
import { prefixGroup } from '../src/plugins/prefixGroup';
import { optionalPrefixGroup } from '../src/plugins/optionalPrefixGroup';

describe('Extreme Router - Complex Path Combinations', () => {
  let testExtreme: TestExtreme;
  const testStore = { storeId: 'test' };

  beforeEach(() => {
    testExtreme = new TestExtreme({
      storeFactory: () => ({ storeId: 'test' }),
      plugins: [
        param,
        wildcard,
        optionalParam,
        regexParam,
        extensionParam,
        groupParam,
        prefixGroup,
        optionalPrefixGroup,
      ],
    });
  });

  it('should match routes with multiple regex parameters', () => {
    testExtreme.register('/api/users/:userId<\\d+>/posts/:postId<\\d+>/comments/:commentId<\\d+>');
    expect(testExtreme.match('/api/users/123/posts/456/comments/789')).toMatchObject({
      ...testStore,
      params: { userId: '123', postId: '456', commentId: '789' },
    });
    expect(testExtreme.match('/api/users/abc/posts/456/comments/789')).toBeNull();
    expect(testExtreme.match('/api/users/123/posts/abc/comments/789')).toBeNull();
    expect(testExtreme.match('/api/users/123/posts/456/comments/abc')).toBeNull();
  });

  it('should match routes with nested regex and optional parameters', () => {
    testExtreme.register('/api/products/:category?/:productId<\\d+>/:format?');
    expect(testExtreme.match('/api/products/electronics/123/json')).toMatchObject({
      ...testStore,
      params: { category: 'electronics', productId: '123', format: 'json' },
    });
    expect(testExtreme.match('/api/products/electronics/123')).toMatchObject({
      ...testStore,
      params: { category: 'electronics', productId: '123' },
    });
    expect(testExtreme.match('/api/products/123/json')).toMatchObject({
      ...testStore,
      params: { productId: '123', format: 'json' },
    });
    expect(testExtreme.match('/api/products/123')).toMatchObject({
      ...testStore,
      params: { productId: '123' },
    });
    expect(testExtreme.match('/api/products/electronics/abc')).toBeNull();
    expect(testExtreme.match('/api/products/abc')).toBeNull();
  });

  it('should match routes with group parameters and wildcard', () => {
    testExtreme.register('/api/:env(dev|staging|prod)/services/:serviceName/*');
    expect(testExtreme.match('/api/dev/services/auth/login')).toMatchObject({
      ...testStore,
      params: { env: 'dev', serviceName: 'auth', '*': 'login' },
    });
    expect(testExtreme.match('/api/staging/services/user-management/users/profile')).toMatchObject({
      ...testStore,
      params: { env: 'staging', serviceName: 'user-management', '*': 'users/profile' },
    });
    expect(testExtreme.match('/api/prod/services/search/query/term/page/2')).toMatchObject({
      ...testStore,
      params: { env: 'prod', serviceName: 'search', '*': 'query/term/page/2' },
    });
    expect(testExtreme.match('/api/test/services/auth/login')).toBeNull();
  });

  it('should match routes with prefix groups and regex parameters', () => {
    testExtreme.register('/api/method(GET|POST|PUT|DELETE)/:resourceId<\\d+>');
    expect(testExtreme.match('/api/methodGET/123')).toMatchObject({
      ...testStore,
      params: { resourceId: '123' },
    });
    expect(testExtreme.match('/api/methodPOST/456')).toMatchObject({
      ...testStore,
      params: { resourceId: '456' },
    });
    expect(testExtreme.match('/api/methodPUT/789')).toMatchObject({
      ...testStore,
      params: { resourceId: '789' },
    });
    expect(testExtreme.match('/api/methodDELETE/101')).toMatchObject({
      ...testStore,
      params: { resourceId: '101' },
    });
    expect(testExtreme.match('/api/methodPATCH/123')).toBeNull();
    expect(testExtreme.match('/api/methodGET/abc')).toBeNull();
  });

  it('should match ultra-complex routes with multiple combined features', () => {
    testExtreme.register(
      '/api/:version<v\\d+>/region(us|eu|asia)?/:resource/:id<[a-f0-9]{8}>/type(basic|premium|enterprise)?/:action?/*',
    );
    expect(testExtreme.match('/api/v2/regioneu/users/abcd1234/typepremium/update/settings/profile')).toMatchObject({
      ...testStore,
      params: {
        version: 'v2',
        resource: 'users',
        id: 'abcd1234',
        action: 'update',
        '*': 'settings/profile',
      },
    });
    expect(testExtreme.match('/api/v1/users/abcd1234/typebasic/view/details')).toBeNull();
    expect(testExtreme.match('/api/v3/regionasia/products/abcd1234/edit/data')).toBeNull();
    expect(testExtreme.match('/api/v1/regionus/services/abcd1234/typeenterprise/details/advanced')).toMatchObject({
      ...testStore,
      params: {
        version: 'v1',
        resource: 'services',
        id: 'abcd1234',
        action: 'details',
        '*': 'advanced',
      },
    });
    expect(testExtreme.match('/api/version1/regionus/users/abcd1234/typebasic/view')).toBeNull();
    expect(testExtreme.match('/api/v1/regionca/users/abcd1234/typebasic/view')).toBeNull();
    expect(testExtreme.match('/api/v1/regionus/users/123/typebasic/view')).toBeNull();
    expect(testExtreme.match('/api/v1/regionus/users/abcd1234/typefree/view')).toBeNull();
  });

  it('should handle complex extension parameters with regex and optionals', () => {
    testExtreme.register('/files/:category?/:filename.json/:version?');
    expect(testExtreme.match('/files/reports/data.json/v2')).toMatchObject({
      ...testStore,
      params: { category: 'reports', filename: 'data', version: 'v2' },
    });
    expect(testExtreme.match('/files/config.json/v3')).toMatchObject({
      ...testStore,
      params: { filename: 'config', version: 'v3' },
    });
    expect(testExtreme.match('/files/settings/system.json')).toMatchObject({
      ...testStore,
      params: { category: 'settings', filename: 'system' },
    });
    expect(testExtreme.match('/files/export.json')).toMatchObject({
      ...testStore,
      params: { filename: 'export' },
    });
    expect(testExtreme.match('/files/config.pdf/v1')).toBeNull();
  });

  it('should handle complex regex validation', () => {
    testExtreme.register('/api/versions/:version<v\\d+>');
    testExtreme.register('/api/ids/:id<[a-f0-9]{8}>');
    expect(testExtreme.match('/api/versions/v1')).toMatchObject({
      ...testStore,
      params: { version: 'v1' },
    });
    expect(testExtreme.match('/api/ids/abcd1234')).toMatchObject({
      ...testStore,
      params: { id: 'abcd1234' },
    });
    expect(testExtreme.match('/api/versions/version1')).toBeNull();
    expect(testExtreme.match('/api/ids/12345')).toBeNull();
  });

  it('should correctly handle separate optional and regex parameters', () => {
    testExtreme.register('/api/:resource/:id<\\d+>');
    testExtreme.register('/api/:resource/:action?');
    expect(testExtreme.match('/api/users/123')).toMatchObject({
      ...testStore,
      params: { resource: 'users', id: '123' },
    });
    expect(testExtreme.match('/api/products/list')).toMatchObject({
      ...testStore,
      params: { resource: 'products', action: 'list' },
    });
    expect(testExtreme.match('/api/settings')).toMatchObject({
      ...testStore,
      params: { resource: 'settings' },
    });
    expect(testExtreme.match('/api/users/abc')).toMatchObject({
      ...testStore,
      params: { resource: 'users', action: 'abc' },
    });
  });

  it('should handle nested wildcards with other parameter types', () => {
    testExtreme.register('/:section/:subsection/:id<\\d+>/:action?/*');
    expect(testExtreme.match('/admin/users/123/edit/roles/permissions')).toMatchObject({
      ...testStore,
      params: {
        section: 'admin',
        subsection: 'users',
        id: '123',
        action: 'edit',
        '*': 'roles/permissions',
      },
    });
    expect(testExtreme.match('/products/categories/456/electronics/computers')).toMatchObject({
      ...testStore,
      params: {
        section: 'products',
        subsection: 'categories',
        id: '456',
        action: 'electronics',
        '*': 'computers',
      },
    });
    expect(testExtreme.match('/projects/active/789/view/2023/q2/detailed/list')).toMatchObject({
      ...testStore,
      params: {
        section: 'projects',
        subsection: 'active',
        id: '789',
        action: 'view',
        '*': '2023/q2/detailed/list',
      },
    });
    expect(testExtreme.match('/admin/users/123/edit')).toBeNull();
    expect(testExtreme.match('/admin/users/abc/edit/extra')).toBeNull();
  });

  it('should handle complex combinations of group and optional prefix groups', () => {
    testExtreme.register(
      '/api/:version/prefix(v1|v2)?/service(auth|users|profiles)/:id<\\d+>/:action(get|set)/:param?',
    );
    expect(testExtreme.match('/api/latest/prefixv2/serviceusers/123/get/public')).toMatchObject({
      ...testStore,
      params: {
        version: 'latest',
        id: '123',
        action: 'get',
        param: 'public',
      },
    });
    expect(testExtreme.match('/api/stable/prefixv2/serviceauth/456/set/private')).toMatchObject({
      ...testStore,
      params: {
        version: 'stable',
        id: '456',
        action: 'set',
        param: 'private',
      },
    });
    expect(testExtreme.match('/api/test/prefixv1/serviceauth/789/get')).toMatchObject({
      ...testStore,
      params: {
        version: 'test',
        id: '789',
        action: 'get',
      },
    });
    expect(testExtreme.match('/api/latest/prefixv3/serviceusers/123/get/public')).toBeNull();
    expect(testExtreme.match('/api/latest/prefixv1/servicepayments/123/get/public')).toBeNull();
    expect(testExtreme.match('/api/latest/prefixv1/serviceusers/123/update/public')).toBeNull();
  });

  it('should handle deeply nested optional parameters with edge cases', () => {
    testExtreme.register('/deep/:p1?/:p2?/:p3?/:p4?/:p5?');
    expect(testExtreme.match('/deep/a/b/c/d/e')).toMatchObject({
      ...testStore,
      params: { p1: 'a', p2: 'b', p3: 'c', p4: 'd', p5: 'e' },
    });
    expect(testExtreme.match('/deep/a/b/e')).toMatchObject({
      ...testStore,
      params: { p1: 'a', p2: 'b', p3: 'e' },
    });
    expect(testExtreme.match('/deep/a/e')).toMatchObject({
      ...testStore,
      params: { p1: 'a', p2: 'e' },
    });
    expect(testExtreme.match('/deep/only')).toMatchObject({
      ...testStore,
      params: { p1: 'only' },
    });
    expect(testExtreme.match('/deep')).toMatchObject({
      ...testStore,
    });
  });

  it('should handle complex overlapping route definitions', () => {
    testExtreme.register('/overlap/:param1/static/:param2');
    testExtreme.register('/overlap/:param1/static/special');
    testExtreme.register('/overlap/:param1/:param2/end');
    testExtreme.register('/overlap/fixed/:param2/end');
    testExtreme.register('/overlap/*');
    expect(testExtreme.match('/overlap/value1/static/special')).toMatchObject({
      ...testStore,
    });
    expect(testExtreme.match('/overlap/value1/static/value2')).toMatchObject({
      ...testStore,
      params: { param1: 'value1', param2: 'value2' },
    });
    expect(testExtreme.match('/overlap/fixed/value2/end')).toMatchObject({
      ...testStore,
      params: { param2: 'value2' },
    });
    expect(testExtreme.match('/overlap/value1/value2/end')).toMatchObject({
      ...testStore,
      params: { param1: 'value1', param2: 'value2' },
    });
  });

  it('should correctly handle priority between dynamic segments in complex scenarios', () => {
    testExtreme.register('/content/:type/special');
    testExtreme.register('/content/:type/:id<\\d+>');
    testExtreme.register('/content/:type/:slug');
    expect(testExtreme.match('/content/articles/special')).toMatchObject({
      ...testStore,
      params: { type: 'articles' },
    });
    expect(testExtreme.match('/content/products/123')).toMatchObject({
      ...testStore,
      params: { type: 'products', id: '123' },
    });
    expect(testExtreme.match('/content/pages/about-us')).toMatchObject({
      ...testStore,
      params: { type: 'pages', slug: 'about-us' },
    });
  });

  it('should handle conflicting routes with correct priority', () => {
    testExtreme.register('/api/items/:id');
    testExtreme.register('/api/items/special');
    testExtreme.register('/api/:resource/featured');
    testExtreme.register('/api/:resource/:action');
    expect(testExtreme.match('/api/items/special')).toMatchObject({
      ...testStore,
    });
    expect(testExtreme.match('/api/items/123')).toMatchObject({
      ...testStore,
      params: { id: '123' },
    });
    expect(testExtreme.match('/api/products/featured')).toMatchObject({
      ...testStore,
      params: { resource: 'products' },
    });
    expect(testExtreme.match('/api/services/restart')).toMatchObject({
      ...testStore,
      params: { resource: 'services', action: 'restart' },
    });
  });

  it('should match complex nested optional parameters', () => {
    testExtreme.register('/dashboard/:section?/:view?/:filter?');
    expect(testExtreme.match('/dashboard/users/grid/active')).toMatchObject({
      ...testStore,
      params: { section: 'users', view: 'grid', filter: 'active' },
    });
    expect(testExtreme.match('/dashboard/users/grid')).toMatchObject({
      ...testStore,
      params: { section: 'users', view: 'grid' },
    });
    expect(testExtreme.match('/dashboard/users')).toMatchObject({
      ...testStore,
      params: { section: 'users' },
    });
    expect(testExtreme.match('/dashboard')).toMatchObject({
      ...testStore,
    });
  });
});
