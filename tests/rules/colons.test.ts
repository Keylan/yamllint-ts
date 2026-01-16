/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for colons rule
 * Ported from Python yamllint tests/rules/test_colons.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'colons';

describe('colons', () => {
  describe('disabled', () => {
    const conf = 'colons: disable';

    it('should allow spaces before colons when disabled', () => {
      check(
        '---\n' +
          'object:\n' +
          '  k1 : v1\n' +
          'obj2:\n' +
          '  k2     :\n' +
          '    - 8\n' +
          '  k3:\n' +
          '    val\n' +
          '  property   : value\n' +
          '  prop2      : val2\n' +
          '  propriété  : [valeur]\n' +
          '  o:\n' +
          '    k1: [v1, v2]\n' +
          '  p:\n' +
          '    - k3: >\n' +
          '        val\n' +
          '    - o: {k1: v1}\n' +
          '    - p: kdjf\n' +
          '    - q: val0\n' +
          '    - q2:\n' +
          '        - val1\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow extra spaces after colons when disabled', () => {
      check(
        '---\n' +
          'object:\n' +
          '  k1:   v1\n' +
          'obj2:\n' +
          '  k2:\n' +
          '    - 8\n' +
          '  k3:\n' +
          '    val\n' +
          '  property:     value\n' +
          '  prop2:        val2\n' +
          '  propriété:    [valeur]\n' +
          '  o:\n' +
          '    k1:  [v1, v2]\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow mixed spacing issues when disabled', () => {
      check(
        '---\n' +
          'obj:\n' +
          '  p:\n' +
          '    - k1: >\n' +
          '        val\n' +
          '    - k3:  >\n' +
          '        val\n' +
          '    - o: {k1: v1}\n' +
          '    - o:  {k1: v1}\n' +
          '    - q2:\n' +
          '        - val1\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow flow mapping spacing issues when disabled', () => {
      check('---\n' + 'a: {b: {c:  d, e : f}}\n', conf, RULE_ID, {});
    });
  });

  describe('before enabled', () => {
    const conf = 'colons: {max-spaces-before: 0, max-spaces-after: -1}';

    it('should allow no space before colons', () => {
      check(
        '---\n' + 'object:\n' + '  k1:\n' + '    - a\n' + '    - b\n' + '  k2: v2\n' + '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect space before colon in mapping', () => {
      check(
        '---\n' + 'object:\n' + '  k1 :\n' + '    - a\n' + '    - b\n' + '  k2: v2\n' + '...\n',
        conf,
        RULE_ID,
        { problem1: [3, 5] }
      );
    });

    it('should detect space before colon at root', () => {
      check('---\n' + 'lib :\n' + '  - var\n' + '...\n', conf, RULE_ID, { problem1: [2, 4] });
    });

    it('should detect space before colon in list item', () => {
      check('---\n' + '- lib :\n' + '    - var\n' + '...\n', conf, RULE_ID, { problem1: [2, 6] });
    });

    it('should detect multiple spaces before colons in flow mapping', () => {
      check('---\n' + 'a: {b: {c : d, e : f}}\n', conf, RULE_ID, {
        problem1: [2, 10],
        problem2: [2, 17],
      });
    });
  });

  describe('before max', () => {
    const conf = 'colons: {max-spaces-before: 3, max-spaces-after: -1}';

    it('should allow up to max spaces before colons', () => {
      check(
        '---\n' +
          'object :\n' +
          '  k1   :\n' +
          '    - a\n' +
          '    - b\n' +
          '  k2  : v2\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect too many spaces before colon', () => {
      check(
        '---\n' +
          'object :\n' +
          '  k1    :\n' +
          '    - a\n' +
          '    - b\n' +
          '  k2  : v2\n' +
          '...\n',
        conf,
        RULE_ID,
        { problem1: [3, 8] }
      );
    });
  });

  describe('before with explicit block mappings', () => {
    const conf = 'colons: {max-spaces-before: 0, max-spaces-after: 1}\nindentation: disable';

    it('should allow explicit block mapping', () => {
      check('---\n' + 'object:\n' + '  ? key\n' + '  : value\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect space before colon with explicit block mapping', () => {
      check('---\n' + 'object :\n' + '  ? key\n' + '  : value\n' + '...\n', conf, RULE_ID, {
        problem1: [2, 7],
      });
    });

    it('should allow multi-line key at root', () => {
      check(
        '---\n' +
          '? >\n' +
          '    multi-line\n' +
          '    key\n' +
          ': >\n' +
          '    multi-line\n' +
          '    value\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow multi-line key in list', () => {
      check(
        '---\n' +
          '- ? >\n' +
          '      multi-line\n' +
          '      key\n' +
          '  : >\n' +
          '      multi-line\n' +
          '      value\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect extra space after colon in multi-line key value', () => {
      check(
        '---\n' +
          '- ? >\n' +
          '      multi-line\n' +
          '      key\n' +
          '  :  >\n' +
          '       multi-line\n' +
          '       value\n' +
          '...\n',
        conf,
        RULE_ID,
        { problem1: [5, 5] }
      );
    });
  });

  describe('after enabled', () => {
    const conf = 'colons: {max-spaces-before: -1, max-spaces-after: 1}';

    it('should allow single space after colon', () => {
      check('---\n' + 'key: value\n', conf, RULE_ID, {});
    });

    it('should detect extra space after colon', () => {
      check('---\n' + 'key:  value\n', conf, RULE_ID, { problem1: [2, 6] });
    });

    it('should detect extra space after colon in nested mapping with array', () => {
      check('---\n' + 'object:\n' + '  k1:  [a, b]\n' + '  k2: string\n', conf, RULE_ID, {
        problem1: [3, 7],
      });
    });

    it('should detect extra space after colon in nested mapping with string', () => {
      check('---\n' + 'object:\n' + '  k1: [a, b]\n' + '  k2:  string\n', conf, RULE_ID, {
        problem1: [4, 7],
      });
    });

    it('should detect extra space after colon in flow mapping', () => {
      check('---\n' + 'object:\n' + '  other: {key:  value}\n' + '...\n', conf, RULE_ID, {
        problem1: [3, 16],
      });
    });

    it('should detect multiple extra spaces after colons in nested flow mapping', () => {
      check('---\n' + 'a: {b: {c:  d, e :  f}}\n', conf, RULE_ID, {
        problem1: [2, 12],
        problem2: [2, 20],
      });
    });
  });

  describe('after enabled question mark', () => {
    const conf = 'colons: {max-spaces-before: -1, max-spaces-after: 1}';

    it('should allow explicit key with single space', () => {
      check('---\n' + '? key\n' + ': value\n', conf, RULE_ID, {});
    });

    it('should detect extra space after question mark', () => {
      check('---\n' + '?  key\n' + ': value\n', conf, RULE_ID, { problem1: [2, 3] });
    });

    it('should detect extra space after both question mark and colon', () => {
      check('---\n' + '?  key\n' + ':  value\n', conf, RULE_ID, {
        problem1: [2, 3],
        problem2: [3, 3],
      });
    });

    it('should detect extra spaces in list with explicit key', () => {
      check('---\n' + '- ?  key\n' + '  :  value\n', conf, RULE_ID, {
        problem1: [2, 5],
        problem2: [3, 5],
      });
    });
  });

  describe('after max', () => {
    const conf = 'colons: {max-spaces-before: -1, max-spaces-after: 3}';

    it('should allow up to max spaces after colon with array', () => {
      check('---\n' + 'object:\n' + '  k1:  [a, b]\n', conf, RULE_ID, {});
    });

    it('should detect too many spaces after colon with array', () => {
      check('---\n' + 'object:\n' + '  k1:    [a, b]\n', conf, RULE_ID, { problem1: [3, 9] });
    });

    it('should allow up to max spaces after colon with string', () => {
      check('---\n' + 'object:\n' + '  k2:  string\n', conf, RULE_ID, {});
    });

    it('should detect too many spaces after colon with string', () => {
      check('---\n' + 'object:\n' + '  k2:    string\n', conf, RULE_ID, { problem1: [3, 9] });
    });

    it('should allow up to max spaces in flow mapping', () => {
      check('---\n' + 'object:\n' + '  other: {key:  value}\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect too many spaces in flow mapping', () => {
      check('---\n' + 'object:\n' + '  other: {key:    value}\n' + '...\n', conf, RULE_ID, {
        problem1: [3, 18],
      });
    });
  });

  describe('after with explicit block mappings', () => {
    const conf = 'colons: {max-spaces-before: -1, max-spaces-after: 1}\nindentation: disable';

    it('should allow explicit block mapping with single space', () => {
      check('---\n' + 'object:\n' + '  ? key\n' + '  : value\n' + '...\n', conf, RULE_ID, {});
    });

    it('should detect extra space after colon in explicit block mapping', () => {
      check('---\n' + 'object:\n' + '  ? key\n' + '  :  value\n' + '...\n', conf, RULE_ID, {
        problem1: [4, 5],
      });
    });
  });

  describe('after do not confound with trailing space', () => {
    const conf = 'colons: {max-spaces-before: 1, max-spaces-after: 1}\ntrailing-spaces: disable';

    it('should not confuse trailing spaces with spaces after colon', () => {
      check('---\n' + 'trailing:     \n' + '  - spaces\n', conf, RULE_ID, {});
    });
  });

  describe('both before and after', () => {
    const conf = 'colons: {max-spaces-before: 0, max-spaces-after: 1}';

    it('should allow correct spacing', () => {
      check(
        '---\n' +
          'obj:\n' +
          '  string: text\n' +
          '  k:\n' +
          '    - 8\n' +
          '  k3:\n' +
          '    val\n' +
          '  property: [value]\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect both space before and extra space after colon', () => {
      check('---\n' + 'object:\n' + '  k1 :  v1\n', conf, RULE_ID, {
        problem1: [3, 5],
        problem2: [3, 8],
      });
    });

    it('should detect multiple spacing issues', () => {
      check(
        '---\n' +
          'obj:\n' +
          '  string:  text\n' +
          '  k :\n' +
          '    - 8\n' +
          '  k3:\n' +
          '    val\n' +
          '  property: {a: 1, b:  2, c : 3}\n',
        conf,
        RULE_ID,
        {
          problem1: [3, 11],
          problem2: [4, 4],
          problem3: [8, 23],
          problem4: [8, 28],
        }
      );
    });
  });

  describe('with alias as key', () => {
    // Although accepted by PyYAML, `{*x: 4}` is not valid YAML: it should be
    // noted `{*x : 4}`. The reason is that a colon can be part of an anchor
    // name. See commit message for more details.
    //
    // Note: The JavaScript yaml library is stricter than PyYAML - it produces
    // a syntax error for `*a: 42` because it interprets `a:` as the alias name.
    // We test with space before colon which works in both implementations.
    const conf = 'colons: {max-spaces-before: 0, max-spaces-after: 1}\nanchors: disable';

    it('should handle aliases as keys correctly', () => {
      check(
        '---\n' +
          '- anchor: &a key\n' +
          '- *a: 42\n' +
          '- {*a: 42}\n' +
          '- *a : 42\n' +
          '- {*a : 42}\n' +
          '- *a  : 42\n' +
          '- {*a  : 42}\n',
        conf,
        RULE_ID,
        {
          problem1: [3, 7, 'syntax'],
          problem2: [7, 6],
        }
      );
    });
  });
});
