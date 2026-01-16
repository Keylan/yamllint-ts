/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for empty-lines rule
 * Ported from Python yamllint tests/rules/test_empty_lines.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'empty-lines';

describe('empty-lines', () => {
  describe('disabled', () => {
    const conf =
      'empty-lines: disable\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should allow two newlines', () => {
      check('\n\n', conf, RULE_ID, {});
    });

    it('should allow many newlines', () => {
      check('\n\n\n\n\n\n\n\n\n', conf, RULE_ID, {});
    });

    it('should allow many trailing newlines after text', () => {
      check('some text\n\n\n\n\n\n\n\n\n', conf, RULE_ID, {});
    });

    it('should allow many leading newlines before text', () => {
      check('\n\n\n\n\n\n\n\n\nsome text', conf, RULE_ID, {});
    });

    it('should allow newlines around text', () => {
      check('\n\n\nsome text\n\n\n', conf, RULE_ID, {});
    });
  });

  describe('empty document', () => {
    const conf =
      'empty-lines: {max: 0, max-start: 0, max-end: 0}\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });
  });

  describe('0 empty lines', () => {
    const conf =
      'empty-lines: {max: 0, max-start: 0, max-end: 0}\n' +
      'new-line-at-end-of-file: disable';

    it('should allow document start only', () => {
      check('---\n', conf, RULE_ID, {});
    });

    it('should detect empty line between text without trailing newline', () => {
      check('---\ntext\n\ntext', conf, RULE_ID, { problem1: [3, 1] });
    });

    it('should detect empty line between text with trailing newline', () => {
      check('---\ntext\n\ntext\n', conf, RULE_ID, { problem1: [3, 1] });
    });
  });

  describe('10 empty lines', () => {
    const conf = 'empty-lines: {max: 10, max-start: 0, max-end: 0}';

    it('should allow 10 empty lines', () => {
      check('---\nintro\n\n\n\n\n\n\n\n\n\n\nconclusion\n', conf, RULE_ID, {});
    });

    it('should detect 11 empty lines', () => {
      check('---\nintro\n\n\n\n\n\n\n\n\n\n\n\nconclusion\n', conf, RULE_ID, {
        problem1: [13, 1],
      });
    });
  });

  describe('spaces', () => {
    const conf =
      'empty-lines: {max: 1, max-start: 0, max-end: 0}\n' +
      'trailing-spaces: disable';

    it('should allow line with only space as non-empty', () => {
      check('---\nintro\n\n \n\nconclusion\n', conf, RULE_ID, {});
    });

    it('should detect too many empty lines around space-only line', () => {
      check('---\nintro\n\n \n\n\nconclusion\n', conf, RULE_ID, {
        problem1: [6, 1],
      });
    });
  });

  describe('empty lines at start', () => {
    it('should allow 4 empty lines at start when max-start is 4', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 4, max-end: 0}\n' +
        'document-start: disable';
      check('\n\n\n\nnon empty\n', conf, RULE_ID, {});
    });

    it('should detect 5 empty lines at start when max-start is 4', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 4, max-end: 0}\n' +
        'document-start: disable';
      check('\n\n\n\n\nnon empty\n', conf, RULE_ID, { problem1: [5, 1] });
    });

    it('should allow no empty lines at start when max-start is 0', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 0}\n' +
        'document-start: disable';
      check('non empty\n', conf, RULE_ID, {});
    });

    it('should detect 1 empty line at start when max-start is 0', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 0}\n' +
        'document-start: disable';
      check('\nnon empty\n', conf, RULE_ID, { problem1: [1, 1] });
    });
  });

  describe('empty lines at end', () => {
    it('should allow 4 empty lines at end when max-end is 4', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 4}\n' +
        'document-start: disable';
      check('non empty\n\n\n\n\n', conf, RULE_ID, {});
    });

    it('should detect 5 empty lines at end when max-end is 4', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 4}\n' +
        'document-start: disable';
      check('non empty\n\n\n\n\n\n', conf, RULE_ID, { problem1: [6, 1] });
    });

    it('should allow no empty lines at end when max-end is 0', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 0}\n' +
        'document-start: disable';
      check('non empty\n', conf, RULE_ID, {});
    });

    it('should detect 1 empty line at end when max-end is 0', () => {
      const conf =
        'empty-lines: {max: 2, max-start: 0, max-end: 0}\n' +
        'document-start: disable';
      check('non empty\n\n', conf, RULE_ID, { problem1: [2, 1] });
    });
  });

  describe('with dos newlines', () => {
    const conf =
      'empty-lines: {max: 2, max-start: 0, max-end: 0}\n' +
      'new-lines: {type: dos}\n' +
      'document-start: disable';

    it('should allow document start with dos newlines', () => {
      check('---\r\n', conf, RULE_ID, {});
    });

    it('should allow one empty line with dos newlines', () => {
      check('---\r\ntext\r\n\r\ntext\r\n', conf, RULE_ID, {});
    });

    it('should detect 1 empty line at start with dos newlines', () => {
      check('\r\n---\r\ntext\r\n\r\ntext\r\n', conf, RULE_ID, {
        problem1: [1, 1],
      });
    });

    it('should detect 3 empty lines at start with dos newlines', () => {
      check('\r\n\r\n\r\n---\r\ntext\r\n\r\ntext\r\n', conf, RULE_ID, {
        problem1: [3, 1],
      });
    });

    it('should detect 3 empty lines in middle with dos newlines', () => {
      check('---\r\ntext\r\n\r\n\r\n\r\ntext\r\n', conf, RULE_ID, {
        problem1: [5, 1],
      });
    });

    it('should detect 6 empty lines in middle with dos newlines', () => {
      check('---\r\ntext\r\n\r\n\r\n\r\n\r\n\r\n\r\ntext\r\n', conf, RULE_ID, {
        problem1: [8, 1],
      });
    });

    it('should detect 1 empty line at end with dos newlines', () => {
      check('---\r\ntext\r\n\r\ntext\r\n\r\n', conf, RULE_ID, {
        problem1: [5, 1],
      });
    });

    it('should detect 3 empty lines at end with dos newlines', () => {
      check('---\r\ntext\r\n\r\ntext\r\n\r\n\r\n\r\n', conf, RULE_ID, {
        problem1: [7, 1],
      });
    });
  });
});
