import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'braces';

describe('braces', () => {
  describe('disabled', () => {
    it('should allow any braces when disabled', () => {
      const conf = 'braces: disable';
      check(
        '---\n' +
          'dict1: {}\n' +
          'dict2: { }\n' +
          'dict3: {   a: 1, b}\n' +
          'dict4: {a: 1, b, c: 3 }\n' +
          'dict5: {a: 1, b, c: 3 }\n' +
          'dict6: {  a: 1, b, c: 3 }\n' +
          'dict7: {   a: 1, b, c: 3 }\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('forbid', () => {
    it('should allow braces when forbid is false', () => {
      const conf = 'braces:\n' + '  forbid: false\n';
      check('---\n' + 'dict: {}\n', conf, RULE_ID);
      check('---\n' + 'dict: {a}\n', conf, RULE_ID);
      check('---\n' + 'dict: {a: 1}\n', conf, RULE_ID);
      check('---\n' + 'dict: {\n' + '  a: 1\n' + '}\n', conf, RULE_ID);
    });

    it('should forbid all braces when forbid is true', () => {
      const conf = 'braces:\n' + '  forbid: true\n';
      check('---\n' + 'dict:\n' + '  a: 1\n', conf, RULE_ID);
      check('---\n' + 'dict: {}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {a}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {a: 1}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {\n' + '  a: 1\n' + '}\n', conf, RULE_ID, { problem1: [2, 8] });
    });

    it('should forbid only non-empty braces when forbid is non-empty', () => {
      const conf = 'braces:\n' + '  forbid: non-empty\n';
      check('---\n' + 'dict:\n' + '  a: 1\n', conf, RULE_ID);
      check('---\n' + 'dict: {}\n', conf, RULE_ID);
      check('---\n' + 'dict: {\n' + '}\n', conf, RULE_ID);
      check(
        '---\n' + 'dict: {\n' + '# commented: value\n' + '# another: value2\n' + '}\n',
        conf,
        RULE_ID
      );
      check('---\n' + 'dict: {a}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {a: 1}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {\n' + '  a: 1\n' + '}\n', conf, RULE_ID, { problem1: [2, 8] });
    });
  });

  describe('min-spaces-inside', () => {
    it('should allow any spaces when min-spaces-inside is 0', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {}\n', conf, RULE_ID);
    });

    it('should require at least 1 space when min-spaces-inside is 1', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {}\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: { }\n', conf, RULE_ID);
      check('---\n' + 'dict: {a: 1, b}\n', conf, RULE_ID, {
        problem1: [2, 8],
        problem2: [2, 15],
      });
      check('---\n' + 'dict: { a: 1, b }\n', conf, RULE_ID);
      check('---\n' + 'dict: {\n' + '  a: 1,\n' + '  b\n' + '}\n', conf, RULE_ID);
    });

    it('should require at least 3 spaces when min-spaces-inside is 3', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 3\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: { a: 1, b }\n', conf, RULE_ID, {
        problem1: [2, 9],
        problem2: [2, 17],
      });
      check('---\n' + 'dict: {   a: 1, b   }\n', conf, RULE_ID);
    });
  });

  describe('max-spaces-inside', () => {
    it('should disallow spaces when max-spaces-inside is 0', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {}\n', conf, RULE_ID);
      check('---\n' + 'dict: { }\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {a: 1, b}\n', conf, RULE_ID);
      check('---\n' + 'dict: { a: 1, b }\n', conf, RULE_ID, {
        problem1: [2, 8],
        problem2: [2, 16],
      });
      check('---\n' + 'dict: {   a: 1, b   }\n', conf, RULE_ID, {
        problem1: [2, 10],
        problem2: [2, 20],
      });
      check('---\n' + 'dict: {\n' + '  a: 1,\n' + '  b\n' + '}\n', conf, RULE_ID);
    });

    it('should allow up to 3 spaces when max-spaces-inside is 3', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 3\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {   a: 1, b   }\n', conf, RULE_ID);
      check('---\n' + 'dict: {    a: 1, b     }\n', conf, RULE_ID, {
        problem1: [2, 11],
        problem2: [2, 23],
      });
    });
  });

  describe('min-and-max-spaces', () => {
    it('should require exactly 0 spaces when both min and max are 0', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {}\n', conf, RULE_ID);
      check('---\n' + 'dict: { }\n', conf, RULE_ID, { problem1: [2, 8] });
      check('---\n' + 'dict: {   a: 1, b}\n', conf, RULE_ID, { problem1: [2, 10] });
    });

    it('should require exactly 1 space when both min and max are 1', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {a: 1, b, c: 3 }\n', conf, RULE_ID, { problem1: [2, 8] });
    });

    it('should allow 0-2 spaces when min is 0 and max is 2', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 2\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'dict: {a: 1, b, c: 3 }\n', conf, RULE_ID);
      check('---\n' + 'dict: {  a: 1, b, c: 3 }\n', conf, RULE_ID);
      check('---\n' + 'dict: {   a: 1, b, c: 3 }\n', conf, RULE_ID, { problem1: [2, 10] });
    });
  });

  describe('min-spaces-inside-empty', () => {
    it('should allow empty braces when min-spaces-inside-empty is 0', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: 0\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID);
    });

    it('should require at least 1 space in empty braces when min-spaces-inside-empty is 1', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: 1\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: { }\n', conf, RULE_ID);
    });

    it('should require at least 3 spaces in empty braces when min-spaces-inside-empty is 3', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: 3\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: {   }\n', conf, RULE_ID);
    });
  });

  describe('max-spaces-inside-empty', () => {
    it('should disallow spaces in empty braces when max-spaces-inside-empty is 0', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID);
      check('---\n' + 'array: { }\n', conf, RULE_ID, { problem1: [2, 9] });
    });

    it('should allow up to 1 space in empty braces when max-spaces-inside-empty is 1', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID);
      check('---\n' + 'array: { }\n', conf, RULE_ID);
      check('---\n' + 'array: {  }\n', conf, RULE_ID, { problem1: [2, 10] });
    });

    it('should allow up to 3 spaces in empty braces when max-spaces-inside-empty is 3', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 3\n' +
        '  min-spaces-inside-empty: -1\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID);
      check('---\n' + 'array: {   }\n', conf, RULE_ID);
      check('---\n' + 'array: {    }\n', conf, RULE_ID, { problem1: [2, 12] });
    });
  });

  describe('min-and-max-spaces-empty', () => {
    it('should require 1-2 spaces in empty braces', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 2\n' +
        '  min-spaces-inside-empty: 1\n';
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: { }\n', conf, RULE_ID);
      check('---\n' + 'array: {  }\n', conf, RULE_ID);
      check('---\n' + 'array: {   }\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });

  describe('mixed-empty-nonempty', () => {
    it('should handle different rules for empty and non-empty braces (min 1, empty 0)', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: 0\n';
      check('---\n' + 'array: { a: 1, b }\n', conf, RULE_ID);
      check('---\n' + 'array: {a: 1, b}\n', conf, RULE_ID, {
        problem1: [2, 9],
        problem2: [2, 16],
      });
      check('---\n' + 'array: {}\n', conf, RULE_ID);
      check('---\n' + 'array: { }\n', conf, RULE_ID, { problem1: [2, 9] });
    });

    it('should handle different rules for empty and non-empty braces (max 0, empty 1)', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1\n';
      check('---\n' + 'array: { a: 1, b }\n', conf, RULE_ID, {
        problem1: [2, 9],
        problem2: [2, 17],
      });
      check('---\n' + 'array: {a: 1, b}\n', conf, RULE_ID);
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: { }\n', conf, RULE_ID);
    });

    it('should handle different rules for empty and non-empty braces (1-2, empty 1)', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 2\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1\n';
      check('---\n' + 'array: { a: 1, b  }\n', conf, RULE_ID);
      check('---\n' + 'array: {a: 1, b   }\n', conf, RULE_ID, {
        problem1: [2, 9],
        problem2: [2, 18],
      });
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: { }\n', conf, RULE_ID);
      check('---\n' + 'array: {   }\n', conf, RULE_ID, { problem1: [2, 11] });
    });

    it('should handle same rules for empty and non-empty braces (all 1)', () => {
      const conf =
        'braces:\n' +
        '  max-spaces-inside: 1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1\n';
      check('---\n' + 'array: { a: 1, b }\n', conf, RULE_ID);
      check('---\n' + 'array: {a: 1, b}\n', conf, RULE_ID, {
        problem1: [2, 9],
        problem2: [2, 16],
      });
      check('---\n' + 'array: {}\n', conf, RULE_ID, { problem1: [2, 9] });
      check('---\n' + 'array: { }\n', conf, RULE_ID);
    });
  });
});
