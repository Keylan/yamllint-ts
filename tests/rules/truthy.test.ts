import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'truthy';

describe('truthy', () => {
  describe('disabled', () => {
    it('should allow truthy values when disabled', () => {
      const conf = 'truthy: disable';
      check('---\n' + '1: True\n', conf, RULE_ID);
      check('---\n' + 'True: 1\n', conf, RULE_ID);
    });
  });

  describe('enabled', () => {
    it('should detect truthy values in keys and values', () => {
      const conf = 'truthy: enable\n' + 'document-start: disable\n';
      check('---\n' + '1: True\n' + 'True: 1\n', conf, RULE_ID, {
        problem1: [2, 4],
        problem2: [3, 1],
      });
      check('---\n' + '1: "True"\n' + '"True": 1\n', conf, RULE_ID);
      check(
        '%YAML 1.1\n' +
          '---\n' +
          '[\n' +
          '  true, false,\n' +
          '  "false", "FALSE",\n' +
          '  "true", "True",\n' +
          '  True, FALSE,\n' +
          '  on, OFF,\n' +
          '  NO, Yes\n' +
          ']\n',
        conf,
        RULE_ID,
        {
          problem1: [7, 3],
          problem2: [7, 9],
          problem3: [8, 3],
          problem4: [8, 7],
          problem5: [9, 3],
          problem6: [9, 7],
        }
      );
      check(
        'y: 1\n' +
          'yes: 2\n' +
          'on: 3\n' +
          'true: 4\n' +
          'True: 5\n' +
          '...\n' +
          '%YAML 1.2\n' +
          '---\n' +
          'y: 1\n' +
          'yes: 2\n' +
          'on: 3\n' +
          'true: 4\n' +
          'True: 5\n' +
          '...\n' +
          '%YAML 1.1\n' +
          '---\n' +
          'y: 1\n' +
          'yes: 2\n' +
          'on: 3\n' +
          'true: 4\n' +
          'True: 5\n' +
          '---\n' +
          'y: 1\n' +
          'yes: 2\n' +
          'on: 3\n' +
          'true: 4\n' +
          'True: 5\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 1],
          problem2: [3, 1],
          problem3: [5, 1],
          problem4: [13, 1],
          problem5: [18, 1],
          problem6: [19, 1],
          problem7: [21, 1],
          problem8: [24, 1],
          problem9: [25, 1],
          problem10: [27, 1],
        }
      );
    });
  });

  describe('different-allowed-values', () => {
    it('should allow custom allowed values', () => {
      const conf = 'truthy:\n' + '  allowed-values: ["yes", "no"]\n';
      check('---\n' + 'key1: foo\n' + 'key2: yes\n' + 'key3: bar\n' + 'key4: no\n', conf, RULE_ID);
      check(
        '%YAML 1.1\n' +
          '---\n' +
          'key1: true\n' +
          'key2: Yes\n' +
          'key3: false\n' +
          'key4: no\n' +
          'key5: yes\n',
        conf,
        RULE_ID,
        { problem1: [3, 7], problem2: [4, 7], problem3: [5, 7] }
      );
    });
  });

  describe('combined-allowed-values', () => {
    it('should allow combined allowed values', () => {
      const conf = 'truthy:\n' + '  allowed-values: ["yes", "no", "true", "false"]\n';
      check('---\n' + 'key1: foo\n' + 'key2: yes\n' + 'key3: bar\n' + 'key4: no\n', conf, RULE_ID);
      check(
        '---\n' + 'key1: true\n' + 'key2: Yes\n' + 'key3: false\n' + 'key4: no\n' + 'key5: yes\n',
        conf,
        RULE_ID,
        { problem1: [3, 7] }
      );
      check(
        '%YAML 1.1\n' +
          '---\n' +
          'key1: true\n' +
          'key2: Yes\n' +
          'key3: false\n' +
          'key4: no\n' +
          'key5: yes\n',
        conf,
        RULE_ID,
        { problem1: [4, 7] }
      );
      check(
        '%YAML 1.2\n' +
          '---\n' +
          'key1: true\n' +
          'key2: Yes\n' +
          'key3: false\n' +
          'key4: no\n' +
          'key5: yes\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('no-allowed-values', () => {
    it('should flag all truthy values when allowed-values is empty', () => {
      const conf = 'truthy:\n' + '  allowed-values: []\n';
      check('---\n' + 'key1: foo\n' + 'key2: bar\n', conf, RULE_ID);
      check(
        '---\n' + 'key1: true\n' + 'key2: yes\n' + 'key3: false\n' + 'key4: no\n',
        conf,
        RULE_ID,
        { problem1: [2, 7], problem2: [3, 7], problem3: [4, 7], problem4: [5, 7] }
      );
      check(
        '%YAML 1.1\n' + '---\n' + 'key1: true\n' + 'key2: yes\n' + 'key3: false\n' + 'key4: no\n',
        conf,
        RULE_ID,
        { problem1: [3, 7], problem2: [4, 7], problem3: [5, 7], problem4: [6, 7] }
      );
      check(
        '%YAML 1.2\n' + '---\n' + 'key1: true\n' + 'key2: yes\n' + 'key3: false\n' + 'key4: no\n',
        conf,
        RULE_ID,
        { problem1: [3, 7], problem2: [5, 7] }
      );
    });
  });

  describe('explicit-types', () => {
    it('should not flag explicitly typed values', () => {
      const conf = 'truthy: enable\n';
      check(
        '---\n' +
          'string1: !!str True\n' +
          'string2: !!str yes\n' +
          'string3: !!str off\n' +
          'encoded: !!binary |\n' +
          '           True\n' +
          '           OFF\n' +
          '           pad==\n' +
          'boolean1: !!bool true\n' +
          'boolean2: !!bool "false"\n' +
          'boolean3: !!bool FALSE\n' +
          'boolean4: !!bool True\n' +
          'boolean5: !!bool off\n' +
          'boolean6: !!bool NO\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('check-keys-disabled', () => {
    it('should not check keys when check-keys is false', () => {
      const conf =
        'truthy:\n' +
        '  allowed-values: []\n' +
        '  check-keys: false\n' +
        'key-duplicates: disable\n';
      check(
        '---\n' +
          'YES: 0\n' +
          'Yes: 0\n' +
          'yes: 0\n' +
          'No: 0\n' +
          'No: 0\n' +
          'no: 0\n' +
          'TRUE: 0\n' +
          'True: 0\n' +
          'true: 0\n' +
          'FALSE: 0\n' +
          'False: 0\n' +
          'false: 0\n' +
          'ON: 0\n' +
          'On: 0\n' +
          'on: 0\n' +
          'OFF: 0\n' +
          'Off: 0\n' +
          'off: 0\n' +
          'YES:\n' +
          '  Yes:\n' +
          '    yes:\n' +
          '      on: 0\n',
        conf,
        RULE_ID
      );
    });
  });
});
