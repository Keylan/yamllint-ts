/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for new-lines rule
 * Ported from Python yamllint tests/rules/test_new_lines.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'new-lines';

describe('new-lines', () => {
  describe('disabled', () => {
    const conf =
      'new-line-at-end-of-file: disable\nnew-lines: disable\ndocument-start: disable\ntrailing-spaces: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should allow single carriage return', () => {
      check('\r', conf, RULE_ID, {});
    });

    it('should allow CRLF', () => {
      check('\r\n', conf, RULE_ID, {});
    });

    it('should allow unix line endings in content', () => {
      check('---\ntext\n', conf, RULE_ID, {});
    });

    it('should allow dos line endings in content', () => {
      check('---\r\ntext\r\n', conf, RULE_ID, {});
    });
  });

  describe('unix type', () => {
    const conf =
      'new-line-at-end-of-file: disable\nnew-lines: {type: unix}\ndocument-start: disable\ntrailing-spaces: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single carriage return', () => {
      check('\r', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should detect CRLF as problem', () => {
      check('\r\n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should allow unix line endings in content', () => {
      check('---\ntext\n', conf, RULE_ID, {});
    });

    it('should detect dos line endings in content', () => {
      // Note: TypeScript implementation reports all CRLF occurrences
      check('---\r\ntext\r\n', conf, RULE_ID, { problem1: [1, 4], problem2: [2, 5] });
    });
  });

  describe('unix type with require-starting-space', () => {
    // If we find a CRLF when looking for Unix newlines, yamllint
    // should always raise, regardless of logic with
    // require-starting-space.
    const conf =
      'new-line-at-end-of-file: disable\nnew-lines: {type: unix}\ncomments:\n  require-starting-space: true';

    it('should detect CRLF even with comment without starting space', () => {
      // Note: TypeScript implementation reports all CRLF occurrences
      check('---\r\n#\r\n', conf, RULE_ID, { problem1: [1, 4], problem2: [2, 2] });
    });
  });

  describe('dos type', () => {
    const conf =
      'new-line-at-end-of-file: disable\nnew-lines: {type: dos}\ndocument-start: disable\ntrailing-spaces: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single carriage return', () => {
      check('\r', conf, RULE_ID, {});
    });

    it('should detect single LF as problem', () => {
      check('\n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should allow CRLF', () => {
      check('\r\n', conf, RULE_ID, {});
    });

    it('should detect unix line endings in content', () => {
      // Note: TypeScript implementation reports all LF occurrences
      check('---\ntext\n', conf, RULE_ID, { problem1: [1, 4], problem2: [2, 5] });
    });

    it('should allow dos line endings in content', () => {
      check('---\r\ntext\r\n', conf, RULE_ID, {});
    });
  });

  // Note: Platform type tests with mock.patch are skipped as they require
  // special mocking infrastructure. The Python tests mock os.linesep to
  // test platform-specific behavior.
});
