/* eslint-disable @typescript-eslint/no-explicit-any */
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

describe('Extreme Router - Priority', () => {
  let testExtreme: TestExtreme;

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
  it('should give priority to static over dynamic', () => {
    (testExtreme.register('/test.ext') as any).handler = 'Static Handler'; // Static
    testExtreme.register('/test(.ext|.css)'); // Prefix group Priority 100
    testExtreme.register('/test(.ext|.css)?'); // Optional prefix group Priority 200
    testExtreme.register('/:param(test.ext|test.css)'); // Group param Priority 300
    testExtreme.register('/:param<test\\.ext>'); // Regex param Priority 400
    testExtreme.register('/:test.ext'); // Extension param Priority 500
    testExtreme.register('/:optional?'); // Optional param Priority 600
    testExtreme.register('/:param'); // Param Priority 700
    testExtreme.register('/*'); // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Static
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Static Handler'); // Static
  });
  it('should give priority to prefix group over other dynamic', () => {
    (testExtreme.register('/test(.ext|.css)') as any).handler = 'PrefixGroup Handler'; // Prefix group Priority 100
    testExtreme.register('/test(.ext|.css)?'); // Optional prefix group Priority 200
    testExtreme.register('/:param(test.ext|test.css)'); // Group param Priority 300
    testExtreme.register('/:param<test\\.ext>'); // Regex param Priority 400
    testExtreme.register('/:test.ext'); // Extension param Priority 500
    testExtreme.register('/:optional?'); // Optional param Priority 600
    testExtreme.register('/:param'); // Param Priority 700
    testExtreme.register('/*'); // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Prefix group
    expect((testExtreme.match('/test.ext') as any).handler).toBe('PrefixGroup Handler'); // Prefix group
  });
  it('should give priority to optional prefix group over other dynamic', () => {
    (testExtreme.register('/test(.ext|.css)?') as any).handler = 'OptionalPrefixGroup Handler'; // Optional prefix group Priority 200
    testExtreme.register('/:param(test.ext|test.css)'); // Group param Priority 300
    testExtreme.register('/:param<test\\.ext>'); // Regex param Priority 400
    testExtreme.register('/:test.ext'); // Extension param Priority 500
    testExtreme.register('/:optional?'); // Optional param Priority 600
    testExtreme.register('/:param'); // Param Priority 700
    testExtreme.register('/*'); // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Optional prefix group
    expect((testExtreme.match('/test.ext') as any).handler).toBe('OptionalPrefixGroup Handler'); // Optional prefix group
  });
  it('should give priority to group param over other dynamic', () => {
    (testExtreme.register('/:param(test.ext|test.css)') as any).handler = 'Group param Handler'; // Group param Priority 300
    testExtreme.register('/:param<test\\.ext>'); // Regex param Priority 400
    testExtreme.register('/:test.ext'); // Extension param Priority 500
    testExtreme.register('/:optional?'); // Optional param Priority 600
    testExtreme.register('/:param'); // Param Priority 700
    testExtreme.register('/*'); // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Group param
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Group param Handler'); // Group param
  });
  it('should give priority to regex param over other dynamic', () => {
    (testExtreme.register('/:param<test\\.ext>') as any).handler = 'Regex Param Handler'; // Regex param Priority 400
    testExtreme.register('/:test.ext'); // Extension param Priority 500
    testExtreme.register('/:optional?'); // Optional param Priority 600
    testExtreme.register('/:param'); // Param Priority 700
    testExtreme.register('/*'); // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Regex param
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Regex Param Handler'); // Regex param
  });
  it('should give priority to extension param over other dynamic', () => {
    (testExtreme.register('/:test.ext') as any).handler = 'Extension Param Handler'; // Extension param Priority 500
    (testExtreme.register('/:optional?') as any).handler = 'Optional Param Handler'; // Optional param Priority 600
    (testExtreme.register('/:param') as any).handler = 'Param Handler'; // Param Priority 700
    (testExtreme.register('/*') as any).handler = 'Wildcard Handler'; // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Extension param
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Extension Param Handler'); // Extension param
  });
  it('should give priority to optional param over other dynamic', () => {
    (testExtreme.register('/:optional?') as any).handler = 'Optional Param Handler'; // Optional param Priority 600
    (testExtreme.register('/:param') as any).handler = 'Param Handler'; // Param Priority 700
    (testExtreme.register('/*') as any).handler = 'Wildcard Handler'; // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Optional param
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Optional Param Handler'); // Optional param
  });
  it('should give priority to param over other dynamic', () => {
    (testExtreme.register('/:param') as any).handler = 'Param Handler'; // Param Priority 700
    (testExtreme.register('/*') as any).handler = 'Wildcard Handler'; // Wildcard Priority 800

    expect(testExtreme.match('/test.ext')).not.toBeNull(); // Param
    expect((testExtreme.match('/test.ext') as any).handler).toBe('Param Handler'); // Param
  });
});
