/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for new-line-at-end-of-file rule
 * Ported from Python yamllint tests/rules/test_new_line_at_end_of_file.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'new-line-at-end-of-file';

describe('new-line-at-end-of-file', () => {
  describe('disabled', () => {
    const conf =
      'new-line-at-end-of-file: disable\n' + 'empty-lines: disable\n' + 'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should allow word without newline', () => {
      check('word', conf, RULE_ID, {});
    });

    it('should allow sentence with newline', () => {
      check('Sentence.\n', conf, RULE_ID, {});
    });
  });

  describe('enabled', () => {
    const conf =
      'new-line-at-end-of-file: enable\n' + 'empty-lines: disable\n' + 'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should detect missing newline at end of word', () => {
      check('word', conf, RULE_ID, { problem1: [1, 5] });
    });

    it('should allow sentence with newline', () => {
      check('Sentence.\n', conf, RULE_ID, {});
    });

    it('should detect missing newline at end of yaml document', () => {
      check('---\nyaml: document\n...', conf, RULE_ID, { problem1: [3, 4] });
    });
  });
});
