/**
 * Indentation rule tests - Ported from Python yamllint
 */

import { describe, test } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'indentation';

describe('indentation', () => {
  test('disabled', () => {
    const conf = 'indentation: disable';
    check('---\n' +
          'object:\n' +
          '   k1: v1\n' +
          'obj2:\n' +
          ' k2:\n' +
          '     - 8\n', conf, RULE_ID);
  });

  test('spaces 2', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'object:\n' +
          '  k1: v1\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '   k1: v1\n', conf, RULE_ID, { problem1: [3, 4] });
    check('---\n' +
          'object:\n' +
          ' k1: v1\n', conf, RULE_ID, { problem1: [3, 2] });
  });

  test('spaces 4', () => {
    const conf = 'indentation: {spaces: 4}';
    check('---\n' +
          'object:\n' +
          '    k1: v1\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '   k1: v1\n', conf, RULE_ID, { problem1: [3, 4] });
    check('---\n' +
          'object:\n' +
          '  k1: v1\n', conf, RULE_ID, { problem1: [3, 3] });
  });

  test('spaces consistent', () => {
    const conf = 'indentation: {spaces: consistent}';
    check('---\n' +
          'object:\n' +
          '   k1: v1\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '   k1: v1\n' +
          '   k2:\n' +
          '      v2\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '   k1: v1\n' +
          '   k2:\n' +
          '     v2\n', conf, RULE_ID, { problem1: [5, 6] });
  });

  test('indent sequences whatever', () => {
    const conf = 'indentation: {spaces: 4, indent-sequences: whatever}';
    check('---\n' +
          'list:\n' +
          '    - 1\n' +
          '    - 2\n' +
          '    - 3\n', conf, RULE_ID);
    check('---\n' +
          'list:\n' +
          '- 1\n' +
          '- 2\n' +
          '- 3\n', conf, RULE_ID);
  });

  test('indent sequences true', () => {
    const conf = 'indentation: {spaces: 4, indent-sequences: true}';
    check('---\n' +
          'list:\n' +
          '    - 1\n' +
          '    - 2\n' +
          '    - 3\n', conf, RULE_ID);
    check('---\n' +
          'list:\n' +
          '- 1\n' +
          '- 2\n' +
          '- 3\n', conf, RULE_ID, { problem1: [3, 1], problem2: [4, 1], problem3: [5, 1] });
  });

  test('indent sequences false', () => {
    const conf = 'indentation: {spaces: 4, indent-sequences: false}';
    check('---\n' +
          'list:\n' +
          '- 1\n' +
          '- 2\n' +
          '- 3\n', conf, RULE_ID);
    check('---\n' +
          'list:\n' +
          '    - 1\n' +
          '    - 2\n' +
          '    - 3\n', conf, RULE_ID, { problem1: [3, 5], problem2: [4, 5], problem3: [5, 5] });
  });

  test('indent sequences consistent', () => {
    const conf = 'indentation: {spaces: 4, indent-sequences: consistent}';
    check('---\n' +
          'list one:\n' +
          '    - 1\n' +
          '    - 2\n' +
          'list two:\n' +
          '    - a\n' +
          '    - b\n', conf, RULE_ID);
    check('---\n' +
          'list one:\n' +
          '- 1\n' +
          '- 2\n' +
          'list two:\n' +
          '- a\n' +
          '- b\n', conf, RULE_ID);
    check('---\n' +
          'list one:\n' +
          '    - 1\n' +
          '    - 2\n' +
          'list two:\n' +
          '- a\n' +
          '- b\n', conf, RULE_ID, { problem1: [6, 1], problem2: [7, 1] });
    check('---\n' +
          'list one:\n' +
          '- 1\n' +
          '- 2\n' +
          'list two:\n' +
          '    - a\n' +
          '    - b\n', conf, RULE_ID, { problem1: [6, 5], problem2: [7, 5] });
  });

  test('nested collections', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          '- o:\n' +
          '  k1: v1\n', conf, RULE_ID);
    check('---\n' +
          '- o:\n' +
          '   k1: v1\n', conf, RULE_ID, { problem1: [3, 4] });
    // 4-space indent is also valid when spaces=2 (it's 2+2 from sequence entry + map value)
    check('---\n' +
          '- o:\n' +
          '    k1: v1\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '  - val\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '   - val\n', conf, RULE_ID, { problem1: [3, 4] });
  });

  test('return', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a:\n' +
          '  b:\n' +
          '    c:\n' +
          '  d:\n' +
          '    e:\n' +
          'f:\n', conf, RULE_ID);
    // Invalid YAML - our parser reports syntax error at different position than Python
    // Also reports indentation error because the token is still processed
    check('---\n' +
          'a:\n' +
          '  b:\n' +
          '    c:\n' +
          ' d:\n', conf, RULE_ID, { problem1: [4, 7, 'syntax'], problem2: [5, 2] });
  });

  test('first line', () => {
    const conf = ('indentation: {spaces: 2}\n' +
                  'document-start: disable');
    check('  a: 1\n', conf, RULE_ID, { problem1: [1, 3] });
  });

  test('explicit block seq indent', () => {
    const conf = 'indentation: {spaces: 4, indent-sequences: true}';
    check('---\n' +
          'object:\n' +
          '    - elem\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '    -\n' +
          '        elem\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '    -\n' +
          '      elem\n', conf, RULE_ID, { problem1: [4, 7] });
  });

  test('explicit block map indent', () => {
    const conf = 'indentation: {spaces: 4}';
    check('---\n' +
          'object:\n' +
          '    ? key\n' +
          '    : value\n', conf, RULE_ID);
    check('---\n' +
          'object:\n' +
          '    ?\n' +
          '        key\n' +
          '    :\n' +
          '        value\n', conf, RULE_ID);
  });

  test('clear sequence item', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          '-\n' +
          '  string\n', conf, RULE_ID);
    check('---\n' +
          '-\n' +
          '   string\n', conf, RULE_ID, { problem1: [3, 4] });
    check('---\n' +
          'list:\n' +
          '  -\n' +
          '    string\n', conf, RULE_ID);
    check('---\n' +
          'list:\n' +
          '  -\n' +
          '     string\n', conf, RULE_ID, { problem1: [4, 6] });
  });

  test('anchors', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'key: &anchor value\n', conf, RULE_ID);
    check('---\n' +
          'key: &anchor\n' +
          '  value\n', conf, RULE_ID);
    check('---\n' +
          '- &anchor value\n', conf, RULE_ID);
    check('---\n' +
          '- &anchor\n' +
          '  value\n', conf, RULE_ID);
  });

  test('tags', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'key: !tag value\n', conf, RULE_ID);
    check('---\n' +
          'key: !tag\n' +
          '  value\n', conf, RULE_ID);
    check('---\n' +
          '- !tag value\n', conf, RULE_ID);
    check('---\n' +
          '- !tag\n' +
          '  value\n', conf, RULE_ID);
  });

  test('flows', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: {x: 1,\n' +
          '    y: 2}\n', conf, RULE_ID);
    check('---\n' +
          'a: {x: 1,\n' +
          '  y: 2}\n', conf, RULE_ID, { problem1: [3, 3] });
    check('---\n' +
          'a: [x,\n' +
          '    y]\n', conf, RULE_ID);
    check('---\n' +
          'a: [x,\n' +
          '  y]\n', conf, RULE_ID, { problem1: [3, 3] });
  });

  test('empty flows', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: {}\n', conf, RULE_ID);
    check('---\n' +
          'a: []\n', conf, RULE_ID);
    check('---\n' +
          'a: {\n' +
          '}\n', conf, RULE_ID);
    check('---\n' +
          'a: [\n' +
          ']\n', conf, RULE_ID);
  });

  test('multiline flow', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: {\n' +
          '  x: 1\n' +
          '}\n', conf, RULE_ID);
    check('---\n' +
          'a: [\n' +
          '  x\n' +
          ']\n', conf, RULE_ID);
  });

  test('block scalar', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: |\n' +
          '  text\n', conf, RULE_ID);
    check('---\n' +
          'a: >\n' +
          '  text\n', conf, RULE_ID);
    check('---\n' +
          '- |\n' +
          '  text\n', conf, RULE_ID);
    check('---\n' +
          '- >\n' +
          '  text\n', conf, RULE_ID);
  });

  test('block scalar indent indicator', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: |2\n' +
          '  text\n', conf, RULE_ID);
    check('---\n' +
          'a: |4\n' +
          '    text\n', conf, RULE_ID);
    check('---\n' +
          'a: >2\n' +
          '  text\n', conf, RULE_ID);
  });

  test('multi docs', () => {
    const conf = 'indentation: {spaces: 2}';
    check('---\n' +
          'a: 1\n' +
          '---\n' +
          'b: 2\n', conf, RULE_ID);
  });

  test('directives', () => {
    const conf = 'indentation: {spaces: 2}';
    check('%YAML 1.2\n' +
          '---\n' +
          'a: 1\n', conf, RULE_ID);
    check('%TAG !custom! tag:yaml.org,2002:\n' +
          '---\n' +
          'a: 1\n', conf, RULE_ID);
  });
});

describe('scalar indentation', () => {
  test('basics', () => {
    const conf = ('indentation: {spaces: 2,\n' +
                  '              check-multi-line-strings: true}\n' +
                  'document-start: disable');
    check('after-colon: string\n', conf, RULE_ID);
    check('after-colon:\n' +
          '  string\n', conf, RULE_ID);
    check('- string\n', conf, RULE_ID);
    check('-\n' +
          '  string\n', conf, RULE_ID);
  });

  test('check multi line strings false', () => {
    const conf = ('indentation: {spaces: 2,\n' +
                  '              check-multi-line-strings: false}\n' +
                  'document-start: disable');
    check('multi\n' +
          'line\n', conf, RULE_ID);
    check('multi\n' +
          ' line\n', conf, RULE_ID);
    check('- multi\n' +
          '   line\n', conf, RULE_ID);
    check('a key:\n' +
          '  multi\n' +
          '   line\n', conf, RULE_ID);
  });

  test('check multi line strings true', () => {
    const conf = ('indentation: {spaces: 2,\n' +
                  '              check-multi-line-strings: true}\n' +
                  'document-start: disable');
    check('multi\n' +
          'line\n', conf, RULE_ID);
    check('multi\n' +
          ' line\n', conf, RULE_ID, { problem1: [2, 2] });
    check('- multi\n' +
          '  line\n', conf, RULE_ID);
    check('- multi\n' +
          '   line\n', conf, RULE_ID, { problem1: [2, 4] });
    check('a key: multi\n' +
          '       line\n', conf, RULE_ID);
    check('a key:\n' +
          '  multi\n' +
          '  line\n', conf, RULE_ID);
    check('a key:\n' +
          '  multi\n' +
          '   line\n', conf, RULE_ID, { problem1: [3, 4] });
  });

  test('literal block scalar', () => {
    const conf = ('indentation: {spaces: 2,\n' +
                  '              check-multi-line-strings: true}\n' +
                  'document-start: disable');
    // Block scalar content must be indented relative to indicator position
    check('- |\n' +
          '    multi\n' +
          '    line\n', conf, RULE_ID);
    check('- |\n' +
          '    multi\n' +
          '     line\n', conf, RULE_ID, { problem1: [3, 6] });
    check('- >\n' +
          '    multi\n' +
          '    line\n', conf, RULE_ID);
    check('- >\n' +
          '    multi\n' +
          '     line\n', conf, RULE_ID, { problem1: [3, 6] });
  });

  test('quoted strings', () => {
    const conf = ('indentation: {spaces: 2,\n' +
                  '              check-multi-line-strings: true}\n' +
                  'document-start: disable');
    check('- "multi\n' +
          '   line"\n', conf, RULE_ID);
    check('- "multi\n' +
          '  line"\n', conf, RULE_ID, { problem1: [2, 3] });
    check("- 'multi\n" +
          "   line'\n", conf, RULE_ID);
    check("- 'multi\n" +
          "  line'\n", conf, RULE_ID, { problem1: [2, 3] });
  });

  test('consistent', () => {
    const conf = ('indentation: {spaces: consistent,\n' +
                  '              check-multi-line-strings: true}\n' +
                  'document-start: disable');
    check('multi\n' +
          'line\n', conf, RULE_ID);
    check('multi\n' +
          ' line\n', conf, RULE_ID, { problem1: [2, 2] });
    check('- multi\n' +
          '  line\n', conf, RULE_ID);
    check('- multi\n' +
          '   line\n', conf, RULE_ID, { problem1: [2, 4] });
    check('a key: multi\n' +
          '  line\n', conf, RULE_ID, { problem1: [2, 3] });
    check('a key: multi\n' +
          '        line\n', conf, RULE_ID, { problem1: [2, 9] });
    check('a key:\n' +
          '  multi\n' +
          '   line\n', conf, RULE_ID, { problem1: [3, 4] });
  });
});
