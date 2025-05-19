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

describe('Extreme Router - Match() API', () => {
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
  it('should return null for non-registered paths', () => {
    expect(testExtreme.match('/non-registered')).toBeNull();
  });
  it('should throw error for trying to register empty path', () => {
    expect(() => testExtreme.register('')).toThrowErrorMatchingSnapshot();
  });
  it('should match static paths correctly', () => {
    testExtreme.register('/');
    testExtreme.register('/test');
    testExtreme.register('/test/test2');
    testExtreme.register('/test/test2/test3');

    expect(testExtreme.match('/')).toMatchObject(testStore);
    expect(testExtreme.match('/test')).toMatchObject(testStore);
    expect(testExtreme.match('/test/test2')).toMatchObject(testStore);
    expect(testExtreme.match('/test/test2/test3')).toMatchObject(testStore);
  });
  it('should match allowed chars in static paths correctly', () => {
    testExtreme.register('/test/test.json');
    testExtreme.register('/test/test_test.json');
    testExtreme.register('/test/test-test.json');
    testExtreme.register('/test/test test');

    expect(testExtreme.match('/test/test.json')).toMatchObject(testStore);
    expect(testExtreme.match('/test/test_test.json')).toMatchObject(testStore);
    expect(testExtreme.match('/test/test-test.json')).toMatchObject(testStore);
    expect(testExtreme.match('/test/test test')).toMatchObject(testStore);

    expect(testExtreme.match('/test/test.test].json')).toBeNull();
    expect(testExtreme.match('/test/test!test.json')).toBeNull();
    expect(testExtreme.match('/test/test test.json')).toBeNull();
    expect(testExtreme.match('/test/test}test.json')).toBeNull();
  });
  it('should match param paths correctly', () => {
    testExtreme.register('/user/:id');
    testExtreme.register('/user/:id/:name');
    testExtreme.register('/user/:id/:name/test');
    testExtreme.register('/user/:id/:name/test/test2');

    expect(testExtreme.match('/user/123')).toMatchObject({
      ...testStore,
      params: { id: '123' },
    });
    expect(testExtreme.match('/user/123/john')).toMatchObject({
      ...testStore,
      params: { id: '123', name: 'john' },
    });
    expect(testExtreme.match('/user/123/john/test')).toMatchObject({
      ...testStore,
      params: { id: '123', name: 'john' },
    });
    expect(testExtreme.match('/user/123/john/test/test2')).toMatchObject({
      ...testStore,
      params: { id: '123', name: 'john' },
    });
  });
  it('should match wildcard paths correctly', () => {
    testExtreme.register('/test/*');
    testExtreme.register('/user/:settings*');

    expect(testExtreme.match('/test/123')).toMatchObject({
      ...testStore,
      params: { '*': '123' },
    });
    expect(testExtreme.match('/test/123/456')).toMatchObject({
      ...testStore,
      params: { '*': '123/456' },
    });
    expect(testExtreme.match('/user/123/456')).toMatchObject({
      ...testStore,
      params: { settings: '123/456' },
    });
    expect(testExtreme.match('/user/123/456/789')).toMatchObject({
      ...testStore,
      params: { settings: '123/456/789' },
    });
  });
  it('should throw error if wildcard is not at the end of the path', () => {
    expect(() => testExtreme.register('/test/*/test')).toThrowErrorMatchingSnapshot();
  });
  it('should match optional param paths correctly', () => {
    testExtreme.register('/user/:id?/:name?');

    expect(testExtreme.match('/user')).toMatchObject(testStore);
    expect(testExtreme.match('/user/123')).toMatchObject({
      ...testStore,
      params: { id: '123' },
    });
    expect(testExtreme.match('/user/123/john')).toMatchObject({
      ...testStore,
      params: { id: '123', name: 'john' },
    });
  });
  /**
   * Note on priority interaction with optional parameters followed by other segments:
   * The relative priority between the ':optional?' node and the node for the segment immediately
   * following it ('nextSegment') determines which node attempts to match the next URL segment first.
   * Example Route: /prefix/:optional?/nextSegment
   * Example URL: /prefix/value
   * 1. If 'nextSegment' (static or dynamic) has HIGHER priority than ':optional?':
   *    - The router attempts to match 'value' against 'nextSegment' first.
   *    - If it matches, the path taken is /prefix/nextSegment, bypassing the optional node.
   *    - If 'nextSegment'.match('value') returns false, ':optional?' is then attempted against 'value'.
   * 2. If `:optional?` has HIGHER priority than `nextSegment`:
   *    - When matching the URL segment following `/prefix` (let's call it `segmentValue`):
   *    - The router **first** attempts to match `segmentValue` using the higher-priority `:optional?` plugin.
   *    - Since the built-in `paramOptional` plugin's `match` function **always returns `true`**, it will **always** successfully match and consume `segmentValue`.
   *    - The path taken proceeds down the `:optional?` branch. `currentNode` becomes the `:optional?` node.
   *    - The lower-priority `nextSegment` node (the one that is a sibling of `:optional?`) is **never** considered for `segmentValue`.
   *    - The router then attempts to match the **next** URL segment against the children of the `currentNode` (the `:optional?` node).
   *    - Crucially, the `nextSegment` node **also exists as a child** of the `:optional?` node (due to the registration of `/prefix/:optional/nextSegment`).
   *    - The router will attempt to match this child `nextSegment` node against the next URL segment.
   *    - If the next URL segment matches `nextSegment` (or any other valid child path under `:optional?`), the match continues.
   *    - If the next URL segment does **not** match `nextSegment` or any other valid child path under `:optional?`, the overall match fails and returns `null`.
   * Key Takeaway: When the built-in `paramOptional` plugin has higher priority than a subsequent segment (`nextSegment`), it **will always intercept** the corresponding URL segment. The router then proceeds down the optional branch and attempts to match the *following* URL segment against the children of the `:optional?` node, which includes the `nextSegment` node itself. The match fails if the remainder of the URL does not match the structure defined *after* the optional segment in the route definition.
   */
  it('should match optional param paths folowed by param correctly', () => {
    testExtreme.register('/user/:id?/:param');

    expect(testExtreme.match('/user/123')).toBeNull();
    expect(testExtreme.match('/user/123/john')).toMatchObject({
      ...testStore,
      params: { id: '123', param: 'john' },
    });
  });
  it('should match optional param paths followed by wildcard correctly', () => {
    testExtreme.register('/user/:id?/*');

    expect(testExtreme.match('/user/123')).toBeNull();
    expect(testExtreme.match('/user/123/john')).toMatchObject({
      ...testStore,
      params: { id: '123', '*': 'john' },
    });
    expect(testExtreme.match('/user/123/john/456')).toMatchObject({
      ...testStore,
      params: { id: '123', '*': 'john/456' },
    });
  });
  it('should match regex param paths correctly', () => {
    testExtreme.register('/user/:id<\\d+>');
    testExtreme.register('/user/:id<\\d+>/:name<\\w+>');

    expect(testExtreme.match('/user/123')).toMatchObject({
      ...testStore,
      params: { id: '123' },
    });
    expect(testExtreme.match('/user/123/john')).toMatchObject({
      ...testStore,
      params: { id: '123', name: 'john' },
    });

    expect(testExtreme.match('/user/aaa')).toBeNull();
    expect(testExtreme.match('/user/123/john/456')).toBeNull();
  });
  it('should match extension param paths correctly', () => {
    testExtreme.register('/data/:file.json');
    testExtreme.register('/data/:file.json/:name.txt');
    testExtreme.register('/data/:file.json/:name.txt/test');

    expect(testExtreme.match('/data/test.json')).toMatchObject({
      ...testStore,
      params: { file: 'test' },
    });
    expect(testExtreme.match('/data/test.json/extra.txt')).toMatchObject({
      ...testStore,
      params: { file: 'test', name: 'extra' },
    });
    expect(testExtreme.match('/data/test.json/extra.txt/test')).toMatchObject({
      ...testStore,
      params: { file: 'test', name: 'extra' },
    });
  });
  it('should match group param paths correctly', () => {
    testExtreme.register('/user/:id(a|b)');
    testExtreme.register('/user/:id(a|b)/:name(c|d)');

    expect(testExtreme.match('/user/a')).toMatchObject({
      ...testStore,
      params: { id: 'a' },
    });
    expect(testExtreme.match('/user/b')).toMatchObject({
      ...testStore,
      params: { id: 'b' },
    });
    expect(testExtreme.match('/user/c')).toBeNull();

    expect(testExtreme.match('/user/a/c')).toMatchObject({
      ...testStore,
      params: { id: 'a', name: 'c' },
    });
    expect(testExtreme.match('/user/a/d')).toMatchObject({
      ...testStore,
      params: { id: 'a', name: 'd' },
    });
    expect(testExtreme.match('/user/b/c')).toMatchObject({
      ...testStore,
      params: { id: 'b', name: 'c' },
    });
    expect(testExtreme.match('/user/b/d')).toMatchObject({
      ...testStore,
      params: { id: 'b', name: 'd' },
    });

    expect(testExtreme.match('/user/a/e')).toBeNull();
    expect(testExtreme.match('/user/b/e')).toBeNull();
    expect(testExtreme.match('/user/c/c')).toBeNull();
  });
  it('should match prefix group paths correctly', () => {
    testExtreme.register('/user/prefix(a|b)');
    testExtreme.register('/user/prefix(a|b)/static');

    expect(testExtreme.match('/user/prefixa')).not.toBeNull();
    expect(testExtreme.match('/user/prefixb')).not.toBeNull();
    expect(testExtreme.match('/user/prefixc')).toBeNull();

    expect(testExtreme.match('/user/prefixa/static')).not.toBeNull();
    expect(testExtreme.match('/user/prefixb/static')).not.toBeNull();
    expect(testExtreme.match('/user/prefixc/static')).toBeNull();
  });
  it('should match optional prefix group paths correctly', () => {
    testExtreme.register('/user/prefix(a|b)?');
    testExtreme.register('/user/prefix(a|b)?/static');

    expect(testExtreme.match('/user/prefix')).not.toBeNull();
    expect(testExtreme.match('/user/prefixa')).not.toBeNull();
    expect(testExtreme.match('/user/prefixb')).not.toBeNull();
    expect(testExtreme.match('/user/prefixc')).toBeNull();

    expect(testExtreme.match('/user/prefix/static')).not.toBeNull();
    expect(testExtreme.match('/user/prefixa/static')).not.toBeNull();
    expect(testExtreme.match('/user/prefixb/static')).not.toBeNull();
    expect(testExtreme.match('/user/prefixc/static')).toBeNull();
  });
  it('should match complex with all plugins paths correctly', () => {
    testExtreme.register(
      '/user/prefix(a|b)/optionalPrefix(a|b)?/:groupParam(a|b)/:regexParam<\\d+>/:file.json/:optionalParam?/:param/*',
    );
    expect(testExtreme.match('/user/prefixa/optionalPrefix/a/123/test.json/optional/param/extra')).toMatchObject({
      ...testStore,
      params: {
        groupParam: 'a',
        regexParam: '123',
        file: 'test',
        optionalParam: 'optional',
        param: 'param',
        '*': 'extra',
      },
    });
  });
});
