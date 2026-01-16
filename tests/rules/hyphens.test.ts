/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for hyphens rule
 * Ported from Python yamllint tests/rules/test_hyphens.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'hyphens';

describe('hyphens', () => {
  describe('disabled', () => {
    const conf = 'hyphens: disable';

    it('should allow single space after hyphen', () => {
      check('---\n- elem1\n- elem2\n', conf, RULE_ID, {});
    });

    it('should allow mixed spaces after hyphen (1)', () => {
      check('---\n- elem1\n-  elem2\n', conf, RULE_ID, {});
    });

    it('should allow double space after all hyphens', () => {
      check('---\n-  elem1\n-  elem2\n', conf, RULE_ID, {});
    });

    it('should allow mixed spaces after hyphen (2)', () => {
      check('---\n-  elem1\n- elem2\n', conf, RULE_ID, {});
    });

    it('should allow mixed spaces in nested object (1)', () => {
      check('---\nobject:\n  - elem1\n  -  elem2\n', conf, RULE_ID, {});
    });

    it('should allow double space in nested object', () => {
      check('---\nobject:\n  -  elem1\n  -  elem2\n', conf, RULE_ID, {});
    });

    it('should allow mixed spaces in deeply nested object (1)', () => {
      check('---\nobject:\n  subobject:\n    - elem1\n    -  elem2\n', conf, RULE_ID, {});
    });

    it('should allow double space in deeply nested object', () => {
      check('---\nobject:\n  subobject:\n    -  elem1\n    -  elem2\n', conf, RULE_ID, {});
    });
  });

  describe('enabled (max-spaces-after: 1)', () => {
    const conf = 'hyphens: {max-spaces-after: 1}';

    it('should allow single space after hyphen', () => {
      check('---\n- elem1\n- elem2\n', conf, RULE_ID, {});
    });

    it('should detect extra space on second element', () => {
      check('---\n- elem1\n-  elem2\n', conf, RULE_ID, { problem1: [3, 3] });
    });

    it('should detect extra spaces on both elements', () => {
      check('---\n-  elem1\n-  elem2\n', conf, RULE_ID, {
        problem1: [2, 3],
        problem2: [3, 3],
      });
    });

    it('should detect extra space on first element only', () => {
      check('---\n-  elem1\n- elem2\n', conf, RULE_ID, { problem1: [2, 3] });
    });

    it('should detect extra space in nested object', () => {
      check('---\nobject:\n  - elem1\n  -  elem2\n', conf, RULE_ID, { problem1: [4, 5] });
    });

    it('should detect extra spaces on both nested elements', () => {
      check('---\nobject:\n  -  elem1\n  -  elem2\n', conf, RULE_ID, {
        problem1: [3, 5],
        problem2: [4, 5],
      });
    });

    it('should detect extra space in deeply nested object', () => {
      check('---\nobject:\n  subobject:\n    - elem1\n    -  elem2\n', conf, RULE_ID, {
        problem1: [5, 7],
      });
    });

    it('should detect extra spaces on both deeply nested elements', () => {
      check('---\nobject:\n  subobject:\n    -  elem1\n    -  elem2\n', conf, RULE_ID, {
        problem1: [4, 7],
        problem2: [5, 7],
      });
    });
  });

  describe('max-spaces-after: 3', () => {
    const conf = 'hyphens: {max-spaces-after: 3}';

    it('should allow 3 spaces after hyphen', () => {
      check('---\n-   elem1\n-   elem2\n', conf, RULE_ID, {});
    });

    it('should detect 4 spaces after hyphen on first element', () => {
      check('---\n-    elem1\n-   elem2\n', conf, RULE_ID, { problem1: [2, 5] });
    });

    it('should allow 3 spaces in deeply nested object', () => {
      check('---\na:\n  b:\n    -   elem1\n    -   elem2\n', conf, RULE_ID, {});
    });

    it('should detect 4 spaces on both deeply nested elements', () => {
      check('---\na:\n  b:\n    -    elem1\n    -    elem2\n', conf, RULE_ID, {
        problem1: [4, 9],
        problem2: [5, 9],
      });
    });
  });
});
