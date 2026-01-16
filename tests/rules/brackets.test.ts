/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for brackets rule
 * Ported from Python yamllint tests/rules/test_brackets.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'brackets';

describe('brackets', () => {
  describe('disabled', () => {
    const conf = 'brackets: disable';

    it('should allow any bracket spacing when disabled', () => {
      check(
        '---\n' +
          'array1: []\n' +
          'array2: [ ]\n' +
          'array3: [   a, b]\n' +
          'array4: [a, b, c ]\n' +
          'array5: [a, b, c ]\n' +
          'array6: [  a, b, c ]\n' +
          'array7: [   a, b, c ]\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('forbid', () => {
    describe('forbid: false', () => {
      const conf = 'brackets:\n  forbid: false';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should allow inline array', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {});
      });

      it('should allow multiline array', () => {
        check('---\narray: [\n  a,\n  b\n]\n', conf, RULE_ID, {});
      });
    });

    describe('forbid: true', () => {
      const conf = 'brackets:\n  forbid: true';

      it('should allow block style arrays', () => {
        check('---\narray:\n  - a\n  - b\n', conf, RULE_ID, {});
      });

      it('should detect empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should detect inline array', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should detect multiline array', () => {
        check('---\narray: [\n  a,\n  b\n]\n', conf, RULE_ID, { problem1: [2, 9] });
      });
    });

    describe('forbid: non-empty', () => {
      const conf = 'brackets:\n  forbid: non-empty';

      it('should allow block style arrays', () => {
        check('---\narray:\n  - a\n  - b\n', conf, RULE_ID, {});
      });

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should allow brackets with only newlines', () => {
        check('---\narray: [\n\n]\n', conf, RULE_ID, {});
      });

      it('should allow brackets with only comment', () => {
        check('---\narray: [\n# a comment\n]\n', conf, RULE_ID, {});
      });

      it('should detect inline array', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should detect multiline array with content', () => {
        check('---\narray: [\n  a,\n  b\n]\n', conf, RULE_ID, { problem1: [2, 9] });
      });
    });
  });

  describe('min-spaces-inside', () => {
    describe('min-spaces-inside: 0', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });
    });

    describe('min-spaces-inside: 1', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should detect missing space in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });

      it('should detect missing spaces around content', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 13],
        });
      });

      it('should allow spaces around content', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {});
      });

      it('should allow multiline array', () => {
        check('---\narray: [\n  a,\n  b\n]\n', conf, RULE_ID, {});
      });
    });

    describe('min-spaces-inside: 3', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 3\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should detect insufficient spaces', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {
          problem1: [2, 10],
          problem2: [2, 15],
        });
      });

      it('should allow 3 spaces', () => {
        check('---\narray: [   a, b   ]\n', conf, RULE_ID, {});
      });
    });
  });

  describe('max-spaces-inside', () => {
    describe('max-spaces-inside: 0', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should detect space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow no spaces around content', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {});
      });

      it('should detect spaces around content', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 14],
        });
      });

      it('should detect multiple spaces around content', () => {
        check('---\narray: [   a, b   ]\n', conf, RULE_ID, {
          problem1: [2, 11],
          problem2: [2, 18],
        });
      });

      it('should allow multiline array', () => {
        check('---\narray: [\n  a,\n  b\n]\n', conf, RULE_ID, {});
      });
    });

    describe('max-spaces-inside: 3', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 3\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow 3 spaces', () => {
        check('---\narray: [   a, b   ]\n', conf, RULE_ID, {});
      });

      it('should detect more than 3 spaces', () => {
        check('---\narray: [    a, b     ]\n', conf, RULE_ID, {
          problem1: [2, 12],
          problem2: [2, 21],
        });
      });
    });
  });

  describe('min-and-max-spaces', () => {
    describe('min: 0, max: 0', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should detect space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should detect extra spaces before content', () => {
        check('---\narray: [   a, b]\n', conf, RULE_ID, { problem1: [2, 11] });
      });
    });

    describe('min: 1, max: 1', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should detect missing space before content', () => {
        check('---\narray: [a, b, c ]\n', conf, RULE_ID, { problem1: [2, 9] });
      });
    });

    describe('min: 0, max: 2', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 2\n' +
        '  min-spaces-inside: 0\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow no spaces', () => {
        check('---\narray: [a, b, c ]\n', conf, RULE_ID, {});
      });

      it('should allow 2 spaces', () => {
        check('---\narray: [  a, b, c ]\n', conf, RULE_ID, {});
      });

      it('should detect more than 2 spaces', () => {
        check('---\narray: [   a, b, c ]\n', conf, RULE_ID, { problem1: [2, 11] });
      });
    });
  });

  describe('min-spaces-inside-empty', () => {
    describe('min: 0, max: 0', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: 0';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });
    });

    describe('min-spaces-inside-empty: 1', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: 1';

      it('should detect missing space in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });
    });

    describe('min-spaces-inside-empty: 3', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: -1\n' +
        '  min-spaces-inside-empty: 3';

      it('should detect insufficient spaces in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow 3 spaces in empty brackets', () => {
        check('---\narray: [   ]\n', conf, RULE_ID, {});
      });
    });
  });

  describe('max-spaces-inside-empty', () => {
    describe('max-spaces-inside-empty: 0', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should detect space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, { problem1: [2, 9] });
      });
    });

    describe('max-spaces-inside-empty: 1', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });

      it('should detect 2 spaces in empty brackets', () => {
        check('---\narray: [  ]\n', conf, RULE_ID, { problem1: [2, 10] });
      });
    });

    describe('max-spaces-inside-empty: 3', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 3\n' +
        '  min-spaces-inside-empty: -1';

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should allow 3 spaces in empty brackets', () => {
        check('---\narray: [   ]\n', conf, RULE_ID, {});
      });

      it('should detect 4 spaces in empty brackets', () => {
        check('---\narray: [    ]\n', conf, RULE_ID, { problem1: [2, 12] });
      });
    });
  });

  describe('min-and-max-spaces-empty', () => {
    const conf =
      'brackets:\n' +
      '  max-spaces-inside: -1\n' +
      '  min-spaces-inside: -1\n' +
      '  max-spaces-inside-empty: 2\n' +
      '  min-spaces-inside-empty: 1';

    it('should detect missing space', () => {
      check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
    });

    it('should allow single space', () => {
      check('---\narray: [ ]\n', conf, RULE_ID, {});
    });

    it('should allow 2 spaces', () => {
      check('---\narray: [  ]\n', conf, RULE_ID, {});
    });

    it('should detect 3 spaces', () => {
      check('---\narray: [   ]\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });

  describe('mixed-empty-nonempty', () => {
    describe('min: 1 for content, 0 for empty', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: -1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 0\n' +
        '  min-spaces-inside-empty: 0';

      it('should allow spaces around content', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {});
      });

      it('should detect missing spaces around content', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 13],
        });
      });

      it('should allow empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, {});
      });

      it('should detect space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, { problem1: [2, 9] });
      });
    });

    describe('max: 0 for content, min-max: 1 for empty', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 0\n' +
        '  min-spaces-inside: -1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1';

      it('should detect spaces around content', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 14],
        });
      });

      it('should allow no spaces around content', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {});
      });

      it('should detect missing space in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });
    });

    describe('min: 1, max: 2 for content, min-max: 1 for empty', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 2\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1';

      it('should allow 1-2 spaces around content', () => {
        check('---\narray: [ a, b  ]\n', conf, RULE_ID, {});
      });

      it('should detect missing space and excess spaces', () => {
        check('---\narray: [a, b   ]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 15],
        });
      });

      it('should detect missing space in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });

      it('should detect excess spaces in empty brackets', () => {
        check('---\narray: [   ]\n', conf, RULE_ID, { problem1: [2, 11] });
      });
    });

    describe('min-max: 1 for both', () => {
      const conf =
        'brackets:\n' +
        '  max-spaces-inside: 1\n' +
        '  min-spaces-inside: 1\n' +
        '  max-spaces-inside-empty: 1\n' +
        '  min-spaces-inside-empty: 1';

      it('should allow exactly 1 space around content', () => {
        check('---\narray: [ a, b ]\n', conf, RULE_ID, {});
      });

      it('should detect missing spaces around content', () => {
        check('---\narray: [a, b]\n', conf, RULE_ID, {
          problem1: [2, 9],
          problem2: [2, 13],
        });
      });

      it('should detect missing space in empty brackets', () => {
        check('---\narray: []\n', conf, RULE_ID, { problem1: [2, 9] });
      });

      it('should allow single space in empty brackets', () => {
        check('---\narray: [ ]\n', conf, RULE_ID, {});
      });
    });
  });
});
