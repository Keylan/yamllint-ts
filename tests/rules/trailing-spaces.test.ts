/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for trailing-spaces rule
 * Ported from Python yamllint tests/rules/test_trailing_spaces.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'trailing-spaces';

describe('trailing-spaces', () => {
  describe('disabled', () => {
    const conf = 'trailing-spaces: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should allow trailing spaces when disabled', () => {
      check('    \n', conf, RULE_ID, {});
    });

    it('should allow trailing space in content when disabled', () => {
      check('---\nsome: text \n', conf, RULE_ID, {});
    });
  });

  describe('enabled', () => {
    const conf = 'trailing-spaces: enable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should detect trailing spaces on empty line', () => {
      check('    \n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should detect tabs as trailing spaces', () => {
      // Note: Python yamllint reports tabs as syntax errors from the parser,
      // but our parser doesn't throw on tabs, so we report them as trailing-spaces.
      check('\t\t\t\n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should detect trailing space after text', () => {
      check('---\nsome: text \n', conf, RULE_ID, { problem1: [2, 11] });
    });

    it('should detect trailing tab as trailing spaces', () => {
      // Note: Python yamllint reports tabs as syntax errors from the parser,
      // but our parser doesn't throw on tabs, so we report them as trailing-spaces.
      check('---\nsome: text\t\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });

  describe('with dos new lines', () => {
    const conf = 'trailing-spaces: enable\nnew-lines: {type: dos}';

    it('should allow dos line endings without trailing spaces', () => {
      check('---\r\nsome: text\r\n', conf, RULE_ID, {});
    });

    it('should detect trailing space with dos line endings', () => {
      check('---\r\nsome: text \r\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });
});
