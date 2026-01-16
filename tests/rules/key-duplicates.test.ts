import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'key-duplicates';

describe('key-duplicates', () => {
  describe('disabled', () => {
    it('should allow duplicate keys in block mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'block mapping:\n' +
          '  key: a\n' +
          '  otherkey: b\n' +
          '  key: c\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicate keys in flow mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'flow mapping:\n' +
          '  {key: a, otherkey: b, key: c}\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicated twice in block mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'duplicated twice:\n' +
          '  - k: a\n' +
          '    ok: b\n' +
          '    k: c\n' +
          '    k: d\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicated twice in flow mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'duplicated twice:\n' +
          '  - {k: a, ok: b, k: c, k: d}\n',
        conf,
        RULE_ID
      );
    });

    it('should allow multiple duplicates in block mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'multiple duplicates:\n' +
          '  a: 1\n' +
          '  b: 2\n' +
          '  c: 3\n' +
          '  d: 4\n' +
          '  d: 5\n' +
          '  b: 6\n',
        conf,
        RULE_ID
      );
    });

    it('should allow multiple duplicates in flow mapping when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'multiple duplicates:\n' +
          '  {a: 1, b: 2, c: 3, d: 4, d: 5, b: 6}\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicates at root when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'at: root\n' +
          'multiple: times\n' +
          'at: root\n',
        conf,
        RULE_ID
      );
    });

    it('should allow nested but OK when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'nested but OK:\n' +
          '  a: {a: {a: 1}}\n' +
          '  b:\n' +
          '    b: 2\n' +
          '    c: 3\n',
        conf,
        RULE_ID
      );
    });

    it('should allow nested duplicates when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'nested duplicates:\n' +
          '  a: {a: 1, a: 1}\n' +
          '  b:\n' +
          '    c: 3\n' +
          '    d: 4\n' +
          '    d: 4\n' +
          '  b: 2\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicates with many styles when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'duplicates with many styles: 1\n' +
          '"duplicates with many styles": 1\n' +
          "'duplicates with many styles': 1\n" +
          '? duplicates with many styles\n' +
          ': 1\n' +
          '? >-\n' +
          '    duplicates with\n' +
          '    many styles\n' +
          ': 1\n',
        conf,
        RULE_ID
      );
    });

    it('should allow merge keys when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          'Merge Keys are OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_reference:\n' +
          '  <<: *anchor_one\n' +
          '  <<: *anchor_two\n',
        conf,
        RULE_ID
      );
    });

    it('should report syntax error for extra closing brace when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          '{a: 1, b: 2}}\n',
        conf,
        RULE_ID,
        { problem1: [2, 13, 'syntax'] }
      );
    });

    it('should report syntax error for extra closing bracket when disabled', () => {
      const conf = 'key-duplicates: disable';
      check(
        '---\n' +
          '[a, b, c]]\n',
        conf,
        RULE_ID,
        { problem1: [2, 10, 'syntax'] }
      );
    });
  });

  describe('enabled', () => {
    it('should detect duplicate keys in block mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'block mapping:\n' +
          '  key: a\n' +
          '  otherkey: b\n' +
          '  key: c\n',
        conf,
        RULE_ID,
        { problem1: [5, 3] }
      );
    });

    it('should detect duplicate keys in flow mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'flow mapping:\n' +
          '  {key: a, otherkey: b, key: c}\n',
        conf,
        RULE_ID,
        { problem1: [3, 25] }
      );
    });

    it('should detect duplicated twice in block mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'duplicated twice:\n' +
          '  - k: a\n' +
          '    ok: b\n' +
          '    k: c\n' +
          '    k: d\n',
        conf,
        RULE_ID,
        { problem1: [5, 5], problem2: [6, 5] }
      );
    });

    it('should detect duplicated twice in flow mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'duplicated twice:\n' +
          '  - {k: a, ok: b, k: c, k: d}\n',
        conf,
        RULE_ID,
        { problem1: [3, 19], problem2: [3, 25] }
      );
    });

    it('should detect multiple duplicates in block mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'multiple duplicates:\n' +
          '  a: 1\n' +
          '  b: 2\n' +
          '  c: 3\n' +
          '  d: 4\n' +
          '  d: 5\n' +
          '  b: 6\n',
        conf,
        RULE_ID,
        { problem1: [7, 3], problem2: [8, 3] }
      );
    });

    it('should detect multiple duplicates in flow mapping', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'multiple duplicates:\n' +
          '  {a: 1, b: 2, c: 3, d: 4, d: 5, b: 6}\n',
        conf,
        RULE_ID,
        { problem1: [3, 28], problem2: [3, 34] }
      );
    });

    it('should detect duplicates at root', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'at: root\n' +
          'multiple: times\n' +
          'at: root\n',
        conf,
        RULE_ID,
        { problem1: [4, 1] }
      );
    });

    it('should allow nested but OK', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'nested but OK:\n' +
          '  a: {a: {a: 1}}\n' +
          '  b:\n' +
          '    b: 2\n' +
          '    c: 3\n',
        conf,
        RULE_ID
      );
    });

    it('should detect nested duplicates', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'nested duplicates:\n' +
          '  a: {a: 1, a: 1}\n' +
          '  b:\n' +
          '    c: 3\n' +
          '    d: 4\n' +
          '    d: 4\n' +
          '  b: 2\n',
        conf,
        RULE_ID,
        { problem1: [3, 13], problem2: [7, 5], problem3: [8, 3] }
      );
    });

    it('should detect duplicates with many styles', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'duplicates with many styles: 1\n' +
          '"duplicates with many styles": 1\n' +
          "'duplicates with many styles': 1\n" +
          '? duplicates with many styles\n' +
          ': 1\n' +
          '? >-\n' +
          '    duplicates with\n' +
          '    many styles\n' +
          ': 1\n',
        conf,
        RULE_ID,
        { problem1: [3, 1], problem2: [4, 1], problem3: [5, 3], problem4: [7, 3] }
      );
    });

    it('should allow merge keys when enabled', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          'Merge Keys are OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_reference:\n' +
          '  <<: *anchor_one\n' +
          '  <<: *anchor_two\n',
        conf,
        RULE_ID
      );
    });

    it('should report syntax error for extra closing brace when enabled', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          '{a: 1, b: 2}}\n',
        conf,
        RULE_ID,
        { problem1: [2, 13, 'syntax'] }
      );
    });

    it('should report syntax error for extra closing bracket when enabled', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          '[a, b, c]]\n',
        conf,
        RULE_ID,
        { problem1: [2, 10, 'syntax'] }
      );
    });
  });

  describe('key-tokens-in-flow-sequences', () => {
    it('should allow key tokens in flow sequences', () => {
      const conf = 'key-duplicates: enable';
      check(
        '---\n' +
          '[\n' +
          '  flow: sequence, with, key: value, mappings\n' +
          ']\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('forbid-duplicated-merge-keys', () => {
    it('should detect multiple merge keys with two anchors', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'Multiple Merge Keys are NOT OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_reference:\n' +
          '  <<: *anchor_one\n' +
          '  <<: *anchor_two\n',
        conf,
        RULE_ID,
        { problem1: [9, 3] }
      );
    });

    it('should detect multiple merge keys with three anchors', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'Multiple Merge Keys are NOT OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_three: &anchor_three\n' +
          '  two: three\n' +
          'anchor_reference:\n' +
          '  <<: *anchor_one\n' +
          '  <<: *anchor_two\n' +
          '  <<: *anchor_three\n',
        conf,
        RULE_ID,
        { problem1: [11, 3], problem2: [12, 3] }
      );
    });

    it('should detect multiple merge keys with other keys between them', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'Multiple Merge Keys are NOT OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_reference:\n' +
          '  a: 1\n' +
          '  <<: *anchor_one\n' +
          '  b: 2\n' +
          '  <<: *anchor_two\n',
        conf,
        RULE_ID,
        { problem1: [11, 3] }
      );
    });

    it('should allow single merge key with array', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'Single Merge Key is OK:\n' +
          'anchor_one: &anchor_one\n' +
          '  one: one\n' +
          'anchor_two: &anchor_two\n' +
          '  two: two\n' +
          'anchor_reference:\n' +
          '  <<: [*anchor_one, *anchor_two]\n',
        conf,
        RULE_ID
      );
    });

    it('should still detect duplicate keys without merge keys', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'Duplicate keys without Merge Keys:\n' +
          '  key: a\n' +
          '  otherkey: b\n' +
          '  key: c\n',
        conf,
        RULE_ID,
        { problem1: [5, 3] }
      );
    });

    it('should allow no merge keys', () => {
      const conf = 'key-duplicates: {forbid-duplicated-merge-keys: true}';
      check(
        '---\n' +
          'No Merge Keys:\n' +
          '  key: a\n' +
          '  otherkey: b\n',
        conf,
        RULE_ID
      );
    });
  });
});
