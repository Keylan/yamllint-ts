import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'empty-values';

describe('empty-values', () => {
  describe('disabled', () => {
    it('should allow empty values when disabled', () => {
      const conf =
        'empty-values: disable\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + 'foo:\n', conf, RULE_ID);
      check('---\n' + 'foo:\n' + ' bar:\n', conf, RULE_ID);
      check('---\n' + '{a:}\n', conf, RULE_ID);
      check('---\n' + 'foo: {a:}\n', conf, RULE_ID);
      check(
        '---\n' +
          '- {a:}\n' +
          '- {a:, b: 2}\n' +
          '- {a: 1, b:}\n' +
          '- {a: 1, b: , }\n',
        conf,
        RULE_ID
      );
      check('---\n' + '{a: {b: , c: {d: 4, e:}}, f:}\n', conf, RULE_ID);
    });
  });

  describe('in-block-mappings', () => {
    it('should allow empty values when forbid-in-block-mappings is false', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n', conf, RULE_ID);
      check('---\n' + 'foo:\n' + 'bar: aaa\n', conf, RULE_ID);
    });

    it('should detect empty values on single line', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'implicitly-null:\n', conf, RULE_ID, { problem1: [2, 17] });
      check('---\n' + 'implicitly-null:with-colons:in-key:\n', conf, RULE_ID, {
        problem1: [2, 36],
      });
      check('---\n' + 'implicitly-null:with-colons:in-key2:\n', conf, RULE_ID, {
        problem1: [2, 37],
      });
    });

    it('should detect empty values on all lines', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + 'bar:\n' + 'foobar:\n', conf, RULE_ID, {
        problem1: [2, 5],
        problem2: [3, 5],
        problem3: [4, 8],
      });
    });

    it('should detect empty values with explicit end of document', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + '...\n', conf, RULE_ID, { problem1: [2, 5] });
    });

    it('should detect empty values not at end of document', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + 'bar:\n' + ' aaa\n', conf, RULE_ID, { problem1: [2, 5] });
    });

    it('should detect empty values at different indentation level', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + ' bar:\n' + 'aaa: bbb\n', conf, RULE_ID, { problem1: [3, 6] });
    });

    it('should allow empty flow mappings when forbid-in-flow-mappings is false', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + 'foo: {a:}\n', conf, RULE_ID);
      check(
        '---\n' + '- {a:}\n' + '- {a:, b: 2}\n' + '- {a: 1, b:}\n' + '- {a: 1, b: , }\n',
        conf,
        RULE_ID
      );
    });

    it('should allow empty block sequences when forbid-in-block-sequences is false', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + '  -\n', conf, RULE_ID);
    });

    it('should allow non-empty values and explicit null', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + ' bar:\n' + '  aaa\n', conf, RULE_ID);
      check('---\n' + 'explicitly-null: null\n', conf, RULE_ID);
      check('---\n' + 'explicitly-null:with-colons:in-key: null\n', conf, RULE_ID);
      check('---\n' + 'false-null: nulL\n', conf, RULE_ID);
      check('---\n' + "empty-string: ''\n", conf, RULE_ID);
      check('---\n' + 'nullable-boolean: false\n', conf, RULE_ID);
      check('---\n' + 'nullable-int: 0\n', conf, RULE_ID);
      check(
        '---\n' + 'First occurrence: &anchor Foo\n' + 'Second occurrence: *anchor\n',
        conf,
        RULE_ID
      );
    });

    it('should allow various explicit null values', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'null-alias: ~\n', conf, RULE_ID);
      check('---\n' + 'null-key1: {?: val}\n', conf, RULE_ID);
      check('---\n' + 'null-key2: {? !!null "": val}\n', conf, RULE_ID);
    });

    it('should detect empty values with comments', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: true,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'comments: disable\n';
      check('---\n' + 'empty:  # comment\n' + 'foo:\n' + '  bar: # comment\n', conf, RULE_ID, {
        problem1: [2, 7],
        problem2: [4, 7],
      });
    });
  });

  describe('in-flow-mappings', () => {
    it('should allow empty values when forbid-in-flow-mappings is false', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + '{a:}\n', conf, RULE_ID);
      check('---\n' + 'foo: {a:}\n', conf, RULE_ID);
      check(
        '---\n' + '- {a:}\n' + '- {a:, b: 2}\n' + '- {a: 1, b:}\n' + '- {a: 1, b: , }\n',
        conf,
        RULE_ID
      );
      check('---\n' + '{a: {b: , c: {d: 4, e:}}, f:}\n', conf, RULE_ID);
    });

    it('should detect empty values on single line', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: true,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + '{a:}\n', conf, RULE_ID, { problem1: [2, 4] });
      check('---\n' + 'foo: {a:}\n', conf, RULE_ID, { problem1: [2, 9] });
      check(
        '---\n' + '- {a:}\n' + '- {a:, b: 2}\n' + '- {a: 1, b:}\n' + '- {a: 1, b: , }\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 6],
          problem2: [3, 6],
          problem3: [4, 12],
          problem4: [5, 12],
        }
      );
      check('---\n' + '{a: {b: , c: {d: 4, e:}}, f:}\n', conf, RULE_ID, {
        problem1: [2, 8],
        problem2: [2, 23],
        problem3: [2, 29],
      });
    });

    it('should detect empty values on multiple lines', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: true,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + 'foo: {\n' + '  a:\n' + '}\n', conf, RULE_ID, { problem1: [3, 5] });
      check(
        '---\n' +
          '{\n' +
          '  a: {\n' +
          '    b: ,\n' +
          '    c: {\n' +
          '      d: 4,\n' +
          '      e:\n' +
          '    }\n' +
          '  },\n' +
          '  f:\n' +
          '}\n',
        conf,
        RULE_ID,
        {
          problem1: [4, 7],
          problem2: [7, 9],
          problem3: [10, 5],
        }
      );
    });

    it('should allow various explicit null values', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: true,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n';
      check('---\n' + '{explicit-null: null}\n', conf, RULE_ID);
      check('---\n' + '{null-alias: ~}\n', conf, RULE_ID);
      check('---\n' + 'null-key1: {?: val}\n', conf, RULE_ID);
      check('---\n' + 'null-key2: {? !!null "": val}\n', conf, RULE_ID);
    });

    it('should detect empty values with comments', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: true,\n' +
        '               forbid-in-block-sequences: false}\n' +
        'braces: disable\n' +
        'commas: disable\n' +
        'comments: disable\n';
      check(
        '---\n' +
          '{\n' +
          '  a: {\n' +
          '    b: ,  # comment\n' +
          '    c: {\n' +
          '      d: 4,  # comment\n' +
          '      e:  # comment\n' +
          '    }\n' +
          '  },\n' +
          '  f:  # comment\n' +
          '}\n',
        conf,
        RULE_ID,
        {
          problem1: [4, 7],
          problem2: [7, 9],
          problem3: [10, 5],
        }
      );
    });
  });

  describe('in-block-sequences', () => {
    it('should allow empty values when forbid-in-block-sequences is false', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: false}\n';
      check('---\n' + 'foo:\n' + '  - bar\n' + '  -\n', conf, RULE_ID);
      check('---\n' + 'foo:\n' + '  -\n', conf, RULE_ID);
    });

    it('should detect empty primitive items', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: true}\n';
      check('---\n' + 'foo:\n' + '  -\n', conf, RULE_ID, { problem1: [3, 4] });
      check('---\n' + 'foo:\n' + '  - bar\n' + '  -\n', conf, RULE_ID, { problem1: [4, 4] });
      check('---\n' + 'foo:\n' + '  - 1\n' + '  - 2\n' + '  -\n', conf, RULE_ID, {
        problem1: [5, 4],
      });
      check('---\n' + 'foo:\n' + '  - true\n', conf, RULE_ID);
    });

    it('should detect empty items in complex objects', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: true}\n';
      check('---\n' + 'foo:\n' + '  - a: 1\n', conf, RULE_ID);
      check('---\n' + 'foo:\n' + '  - a: 1\n' + '  -\n', conf, RULE_ID, { problem1: [4, 4] });
      check('---\n' + 'foo:\n' + '  - a: 1\n' + '    b: 2\n' + '  -\n', conf, RULE_ID, {
        problem1: [5, 4],
      });
      check('---\n' + 'foo:\n' + '  - a: 1\n' + '  - b: 2\n' + '  -\n', conf, RULE_ID, {
        problem1: [5, 4],
      });
      check(
        '---\n' + 'foo:\n' + '  - - a\n' + '    - b: 2\n' + '    -\n',
        conf,
        RULE_ID,
        { problem1: [5, 6] }
      );
      check('---\n' + 'foo:\n' + '  - - a\n' + '    - b: 2\n' + '  -\n', conf, RULE_ID, {
        problem1: [5, 4],
      });
    });

    it('should allow various explicit null values', () => {
      const conf =
        'empty-values: {forbid-in-block-mappings: false,\n' +
        '               forbid-in-flow-mappings: false,\n' +
        '               forbid-in-block-sequences: true}\n';
      check('---\n' + 'foo:\n' + '  - null\n', conf, RULE_ID);
      check('---\n' + '- null\n', conf, RULE_ID);
      check('---\n' + 'foo:\n' + '  - bar: null\n' + '  - null\n', conf, RULE_ID);
      check('---\n' + '- null\n' + '- null\n', conf, RULE_ID);
      check('---\n' + '- - null\n' + '  - null\n', conf, RULE_ID);
    });
  });
});
