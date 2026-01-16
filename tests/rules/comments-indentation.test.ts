/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for comments-indentation rule
 * Ported from Python yamllint tests/rules/test_comments_indentation.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'comments-indentation';

describe('comments-indentation', () => {
  describe('disabled', () => {
    const conf = 'comments-indentation: disable';

    it('should allow any comment indentation when disabled', () => {
      check(
        '---\n' +
          ' # line 1\n' +
          '# line 2\n' +
          '  # line 3\n' +
          '  # line 4\n' +
          '\n' +
          'obj:\n' +
          ' # these\n' +
          '   # are\n' +
          '  # [good]\n' +
          '# bad\n' +
          '      # comments\n' +
          '  a: b\n' +
          '\n' +
          'obj1:\n' +
          '  a: 1\n' +
          '  # comments\n' +
          '\n' +
          'obj2:\n' +
          '  b: 2\n' +
          '\n' +
          '# empty\n' +
          '#\n' +
          '# comment\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('enabled', () => {
    const conf = 'comments-indentation: enable';

    it('should allow correctly indented comments', () => {
      check('---\n' + '# line 1\n' + '# line 2\n', conf, RULE_ID, {});
    });

    it('should detect single space indent at start', () => {
      check('---\n' + ' # line 1\n' + '# line 2\n', conf, RULE_ID, { problem1: [2, 2] });
    });

    it('should detect double space indent for consecutive comments', () => {
      check('---\n' + '  # line 1\n' + '  # line 2\n', conf, RULE_ID, { problem1: [2, 3] });
    });

    it('should allow correctly indented comment in mapping', () => {
      check('---\n' + 'obj:\n' + '  # normal\n' + '  a: b\n', conf, RULE_ID, {});
    });

    it('should detect under-indented comment in mapping (1 space)', () => {
      check('---\n' + 'obj:\n' + ' # bad\n' + '  a: b\n', conf, RULE_ID, { problem1: [3, 2] });
    });

    it('should detect under-indented comment in mapping (0 spaces)', () => {
      check('---\n' + 'obj:\n' + '# bad\n' + '  a: b\n', conf, RULE_ID, { problem1: [3, 1] });
    });

    it('should detect over-indented comment in mapping', () => {
      check('---\n' + 'obj:\n' + '   # bad\n' + '  a: b\n', conf, RULE_ID, { problem1: [3, 4] });
    });

    it('should detect multiple indentation errors', () => {
      check(
        '---\n' +
          'obj:\n' +
          ' # these\n' +
          '   # are\n' +
          '  # [good]\n' +
          '# bad\n' +
          '      # comments\n' +
          '  a: b\n',
        conf,
        RULE_ID,
        {
          problem1: [3, 2],
          problem2: [4, 4],
          problem3: [6, 1],
          problem4: [7, 7],
        }
      );
    });

    it('should allow comment before disabled line', () => {
      check(
        '---\n' + 'obj1:\n' + '  a: 1\n' + '  # the following line is disabled\n' + '  # b: 2\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow comment followed by blank line and new object', () => {
      check(
        '---\n' + 'obj1:\n' + '  a: 1\n' + '  # b: 2\n' + '\n' + 'obj2:\n' + '  b: 2\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow comment between objects with different indentation', () => {
      check(
        '---\n' +
          'obj1:\n' +
          '  a: 1\n' +
          '  # b: 2\n' +
          '# this object is useless\n' +
          'obj2: "no"\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect wrong indentation between object comments', () => {
      check(
        '---\n' +
          'obj1:\n' +
          '  a: 1\n' +
          '# this object is useless\n' +
          '  # b: 2\n' +
          'obj2: "no"\n',
        conf,
        RULE_ID,
        { problem1: [5, 3] }
      );
    });

    it('should allow inline comment in mapping', () => {
      check('---\n' + 'obj1:\n' + '  a: 1\n' + '  # comments\n' + '  b: 2\n', conf, RULE_ID, {});
    });

    it('should allow correctly indented comments in list', () => {
      check(
        '---\n' +
          'my list for today:\n' +
          '  - todo 1\n' +
          '  - todo 2\n' +
          '  # commented for now\n' +
          '  # - todo 3\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('first line', () => {
    const conf = 'comments-indentation: enable';

    it('should allow comment at start of file', () => {
      check('# comment\n', conf, RULE_ID, {});
    });

    it('should detect indented comment at start of file', () => {
      check('  # comment\n', conf, RULE_ID, { problem1: [1, 3] });
    });
  });

  describe('no newline at end', () => {
    const conf = 'comments-indentation: enable\nnew-line-at-end-of-file: disable';

    it('should allow comment without trailing newline', () => {
      check('# comment', conf, RULE_ID, {});
    });

    it('should detect indented comment without trailing newline', () => {
      check('  # comment', conf, RULE_ID, { problem1: [1, 3] });
    });
  });

  describe('empty comment', () => {
    const conf = 'comments-indentation: enable';

    it('should allow empty comment with correct indentation', () => {
      check('---\n' + '# hey\n' + '# normal\n' + '#\n', conf, RULE_ID, {});
    });

    it('should detect indented empty comment', () => {
      check('---\n' + '# hey\n' + '# normal\n' + ' #\n', conf, RULE_ID, { problem1: [4, 2] });
    });
  });

  describe('inline comment', () => {
    const conf = 'comments-indentation: enable';

    it('should allow comment after inline comment', () => {
      check('---\n' + '- a  # inline\n' + '# ok\n', conf, RULE_ID, {});
    });

    it('should detect indented comment after inline comment', () => {
      check('---\n' + '- a  # inline\n' + ' # not ok\n', conf, RULE_ID, { problem1: [3, 2] });
    });

    it('should detect indented comment before inline comment', () => {
      check('---\n' + ' # not ok\n' + '- a  # inline\n', conf, RULE_ID, { problem1: [2, 2] });
    });
  });
});
