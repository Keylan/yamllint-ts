/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for commas rule
 * Ported from Python yamllint tests/rules/test_commas.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'commas';

describe('commas', () => {
  describe('disabled', () => {
    const conf = 'commas: disable';

    it('should allow various comma spacing when disabled', () => {
      check(
        '---\n' +
          'dict: {a: b ,   c: "1 2 3",    d: e , f: [g,      h]}\n' +
          'array: [\n' +
          '  elem  ,\n' +
          '  key: val ,\n' +
          ']\n' +
          'map: {\n' +
          '  key1: val1 ,\n' +
          '  key2: val2,\n' +
          '}\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow comma on new line when disabled', () => {
      check(
        '---\n' +
          '- [one, two , three,four]\n' +
          '- {five,six , seven, eight}\n' +
          '- [\n' +
          '  nine,  ten\n' +
          '  , eleven\n' +
          '  ,twelve\n' +
          ']\n' +
          '- {\n' +
          '  thirteen: 13,  fourteen\n' +
          '  , fifteen: 15\n' +
          '  ,sixteen: 16\n' +
          '}\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('before max', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 0\n' +
      '  min-spaces-after: 0\n' +
      '  max-spaces-after: -1';

    it('should allow no space before comma', () => {
      check('---\n' + 'array: [1, 2,  3, 4]\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect single space before comma', () => {
      check('---\n' + 'array: [1, 2 ,  3, 4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 13],
      });
    });

    it('should detect multiple spaces before commas', () => {
      check('---\n' + 'array: [1 , 2,  3      , 4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 10],
        problem2: [2, 23],
      });
    });

    it('should allow no space before comma in dict', () => {
      check('---\n' + 'dict: {a: b, c: "1 2 3", d: e,  f: [g, h]}\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect single space before comma in dict', () => {
      check('---\n' + 'dict: {a: b, c: "1 2 3" , d: e,  f: [g, h]}\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 24],
      });
    });

    it('should detect multiple spaces before commas in dict', () => {
      check('---\n' + 'dict: {a: b , c: "1 2 3", d: e,  f: [g    , h]}\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 12],
        problem2: [2, 42],
      });
    });

    it('should allow multiline array with no space before comma', () => {
      check('---\n' + 'array: [\n' + '  elem,\n' + '  key: val,\n' + ']\n', conf, RULE_ID, {});
    });

    it('should detect space before comma in multiline array', () => {
      check('---\n' + 'array: [\n' + '  elem ,\n' + '  key: val,\n' + ']\n', conf, RULE_ID, {
        problem1: [3, 7],
      });
    });

    it('should allow multiline map with no space before comma', () => {
      check('---\n' + 'map: {\n' + '  key1: val1,\n' + '  key2: val2,\n' + '}\n', conf, RULE_ID, {});
    });

    it('should detect space before comma in multiline map', () => {
      check('---\n' + 'map: {\n' + '  key1: val1,\n' + '  key2: val2 ,\n' + '}\n', conf, RULE_ID, {
        problem1: [4, 13],
      });
    });
  });

  describe('before max with comma on new line', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 0\n' +
      '  min-spaces-after: 0\n' +
      '  max-spaces-after: -1';

    it('should detect comma at start of line in flow seq', () => {
      check(
        '---\n' + 'flow-seq: [1, 2, 3\n' + '           , 4, 5, 6]\n' + '...\n',
        conf,
        RULE_ID,
        { problem1: [3, 11] }
      );
    });

    it('should detect comma at start of line in flow map', () => {
      check('---\n' + 'flow-map: {a: 1, b: 2\n' + '           , c: 3}\n' + '...\n', conf, RULE_ID, {
        problem1: [3, 11],
      });
    });
  });

  describe('before max with comma on new line and indentation disabled', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 0\n' +
      '  min-spaces-after: 0\n' +
      '  max-spaces-after: -1\n' +
      'indentation: disable';

    it('should detect comma at start of line in flow seq with indentation disabled', () => {
      check(
        '---\n' + 'flow-seq: [1, 2, 3\n' + '         , 4, 5, 6]\n' + '...\n',
        conf,
        RULE_ID,
        { problem1: [3, 9] }
      );
    });

    it('should detect comma at start of line in flow map with indentation disabled', () => {
      check('---\n' + 'flow-map: {a: 1, b: 2\n' + '         , c: 3}\n' + '...\n', conf, RULE_ID, {
        problem1: [3, 9],
      });
    });

    it('should detect comma at column 1 in flow seq', () => {
      check('---\n' + '[\n' + '1,\n' + '2\n' + ', 3\n' + ']\n', conf, RULE_ID, {
        problem1: [5, 1],
      });
    });

    it('should detect comma at column 1 in flow map', () => {
      check('---\n' + '{\n' + 'a: 1,\n' + 'b: 2\n' + ', c: 3\n' + '}\n', conf, RULE_ID, {
        problem1: [5, 1],
      });
    });
  });

  describe('before max 3', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 3\n' +
      '  min-spaces-after: 0\n' +
      '  max-spaces-after: -1';

    it('should allow up to 3 spaces before comma', () => {
      check('---\n' + 'array: [1 , 2, 3   , 4]\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect more than 3 spaces before comma', () => {
      check('---\n' + 'array: [1 , 2, 3    , 4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 20],
      });
    });

    it('should detect more than 3 spaces before comma in multiline', () => {
      check(
        '---\n' + 'array: [\n' + '  elem1   ,\n' + '  elem2    ,\n' + '  key: val,\n' + ']\n',
        conf,
        RULE_ID,
        { problem1: [4, 11] }
      );
    });
  });

  describe('after min', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: -1\n' +
      '  min-spaces-after: 1\n' +
      '  max-spaces-after: -1';

    it('should detect missing space after comma', () => {
      check(
        '---\n' +
          '- [one, two , three,four]\n' +
          '- {five,six , seven, eight}\n' +
          '- [\n' +
          '  nine,  ten\n' +
          '  , eleven\n' +
          '  ,twelve\n' +
          ']\n' +
          '- {\n' +
          '  thirteen: 13,  fourteen\n' +
          '  , fifteen: 15\n' +
          '  ,sixteen: 16\n' +
          '}\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 21],
          problem2: [3, 9],
          problem3: [7, 4],
          problem4: [12, 4],
        }
      );
    });
  });

  describe('after max', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: -1\n' +
      '  min-spaces-after: 0\n' +
      '  max-spaces-after: 1';

    it('should allow single space after comma', () => {
      check('---\n' + 'array: [1, 2, 3, 4]\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect double space after comma', () => {
      check('---\n' + 'array: [1, 2,  3, 4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 15],
      });
    });

    it('should detect multiple spaces after commas', () => {
      check('---\n' + 'array: [1,  2, 3,     4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 12],
        problem2: [2, 22],
      });
    });

    it('should allow single space after comma in dict', () => {
      check(
        '---\n' + 'dict: {a: b , c: "1 2 3", d: e, f: [g, h]}\n' + '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect double space after comma in dict', () => {
      check(
        '---\n' + 'dict: {a: b , c: "1 2 3",  d: e, f: [g, h]}\n' + '...\n',
        conf,
        RULE_ID,
        { problem1: [2, 27] }
      );
    });

    it('should detect multiple spaces after commas in dict', () => {
      check(
        '---\n' + 'dict: {a: b ,  c: "1 2 3", d: e, f: [g,     h]}\n' + '...\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 15],
          problem2: [2, 44],
        }
      );
    });

    it('should allow multiline array with single space', () => {
      check('---\n' + 'array: [\n' + '  elem,\n' + '  key: val,\n' + ']\n', conf, RULE_ID, {});
    });

    it('should detect double space after comma in multiline array', () => {
      check('---\n' + 'array: [\n' + '  elem,  key: val,\n' + ']\n', conf, RULE_ID, {
        problem1: [3, 9],
      });
    });

    it('should detect multiple spaces after commas in multiline map', () => {
      check('---\n' + 'map: {\n' + '  key1: val1,   key2: [val2,  val3]\n' + '}\n', conf, RULE_ID, {
        problem1: [3, 16],
        problem2: [3, 30],
      });
    });
  });

  describe('after max 3', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: -1\n' +
      '  min-spaces-after: 1\n' +
      '  max-spaces-after: 3';

    it('should allow up to 3 spaces after comma', () => {
      check('---\n' + 'array: [1,  2, 3,   4]\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect more than 3 spaces after comma', () => {
      check('---\n' + 'array: [1,  2, 3,    4]\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 21],
      });
    });

    it('should detect more than 3 spaces after commas in dict', () => {
      check(
        '---\n' + 'dict: {a: b ,   c: "1 2 3",    d: e, f: [g,      h]}\n' + '...\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 31],
          problem2: [2, 49],
        }
      );
    });
  });

  describe('both before and after', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 0\n' +
      '  min-spaces-after: 1\n' +
      '  max-spaces-after: 1';

    it('should detect multiple comma spacing issues', () => {
      check(
        '---\n' +
          'dict: {a: b ,   c: "1 2 3",    d: e , f: [g,      h]}\n' +
          'array: [\n' +
          '  elem  ,\n' +
          '  key: val ,\n' +
          ']\n' +
          'map: {\n' +
          '  key1: val1 ,\n' +
          '  key2: val2,\n' +
          '}\n' +
          '...\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 12],
          problem2: [2, 16],
          problem3: [2, 31],
          problem4: [2, 36],
          problem5: [2, 50],
          problem6: [4, 8],
          problem7: [5, 11],
          problem8: [8, 13],
        }
      );
    });
  });

  describe('both before and after with indentation disabled', () => {
    const conf =
      'commas:\n' +
      '  max-spaces-before: 0\n' +
      '  min-spaces-after: 1\n' +
      '  max-spaces-after: 1\n' +
      'indentation: disable';

    it('should detect multiple comma spacing issues with indentation disabled', () => {
      check(
        '---\n' +
          '- [one, two , three,four]\n' +
          '- {five,six , seven, eight}\n' +
          '- [\n' +
          '  nine,  ten\n' +
          '  , eleven\n' +
          '  ,twelve\n' +
          ']\n' +
          '- {\n' +
          '  thirteen: 13,  fourteen\n' +
          '  , fifteen: 15\n' +
          '  ,sixteen: 16\n' +
          '}\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 12],
          problem2: [2, 21],
          problem3: [3, 9],
          problem4: [3, 12],
          problem5: [5, 9],
          problem6: [6, 2],
          problem7: [7, 2],
          problem8: [7, 4],
          problem9: [10, 17],
          problem10: [11, 2],
          problem11: [12, 2],
          problem12: [12, 4],
        }
      );
    });
  });
});
