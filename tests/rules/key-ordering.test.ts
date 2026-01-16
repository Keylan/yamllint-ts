import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'key-ordering';

describe('key-ordering', () => {
  describe('disabled', () => {
    it('should allow unordered keys in block mapping when disabled', () => {
      const conf = 'key-ordering: disable';
      check('---\n' + 'block mapping:\n' + '  secondkey: a\n' + '  firstkey: b\n', conf, RULE_ID);
    });

    it('should allow unordered keys in flow mapping when disabled', () => {
      const conf = 'key-ordering: disable';
      check('---\n' + 'flow mapping:\n' + '  {secondkey: a, firstkey: b}\n', conf, RULE_ID);
    });

    it('should allow unordered keys at root when disabled', () => {
      const conf = 'key-ordering: disable';
      check('---\n' + 'second: before_first\n' + 'at: root\n', conf, RULE_ID);
    });

    it('should allow nested but OK when disabled', () => {
      const conf = 'key-ordering: disable';
      check(
        '---\n' + 'nested but OK:\n' + '  second: {first: 1}\n' + '  third:\n' + '    second: 2\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('enabled', () => {
    it('should detect unordered keys in block mapping', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'block mapping:\n' + '  secondkey: a\n' + '  firstkey: b\n', conf, RULE_ID, {
        problem1: [4, 3],
      });
    });

    it('should detect unordered keys in flow mapping', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'flow mapping:\n' + '  {secondkey: a, firstkey: b}\n', conf, RULE_ID, {
        problem1: [3, 18],
      });
    });

    it('should detect unordered keys at root', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'second: before_first\n' + 'at: root\n', conf, RULE_ID, { problem1: [3, 1] });
    });

    it('should allow nested but OK when enabled', () => {
      const conf = 'key-ordering: enable';
      check(
        '---\n' + 'nested but OK:\n' + '  second: {first: 1}\n' + '  third:\n' + '    second: 2\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('word-length', () => {
    it('should allow properly ordered keys by length', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'a: 1\n' + 'ab: 1\n' + 'abc: 1\n', conf, RULE_ID);
    });

    it('should detect unordered keys by word length', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'a: 1\n' + 'abc: 1\n' + 'ab: 1\n', conf, RULE_ID, { problem1: [4, 1] });
    });
  });

  describe('key-duplicates', () => {
    it('should allow duplicate keys when key-duplicates is disabled', () => {
      const conf = 'key-duplicates: disable\n' + 'key-ordering: enable';
      check('---\n' + 'key: 1\n' + 'key: 2\n', conf, RULE_ID);
    });
  });

  describe('case', () => {
    it('should allow properly ordered case-sensitive keys', () => {
      const conf = 'key-ordering: enable';
      check(
        '---\n' + 'T-shirt: 1\n' + 'T-shirts: 2\n' + 't-shirt: 3\n' + 't-shirts: 4\n',
        conf,
        RULE_ID
      );
    });

    it('should detect unordered case-sensitive keys', () => {
      const conf = 'key-ordering: enable';
      check(
        '---\n' + 'T-shirt: 1\n' + 't-shirt: 2\n' + 'T-shirts: 3\n' + 't-shirts: 4\n',
        conf,
        RULE_ID,
        { problem1: [4, 1] }
      );
    });
  });

  describe('accents', () => {
    it('should allow properly ordered accented keys', () => {
      const conf = 'key-ordering: enable';
      check(
        '---\n' + 'hair: true\n' + 'hais: true\n' + 'haïr: true\n' + 'haïssable: true\n',
        conf,
        RULE_ID
      );
    });

    it('should detect unordered accented keys', () => {
      const conf = 'key-ordering: enable';
      check('---\n' + 'haïr: true\n' + 'hais: true\n', conf, RULE_ID, { problem1: [3, 1] });
    });
  });

  describe('key-tokens-in-flow-sequences', () => {
    it('should allow key tokens in flow sequences', () => {
      const conf = 'key-ordering: enable';
      check(
        '---\n' + '[\n' + '  key: value, mappings, in, flow: sequence\n' + ']\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('ignored-keys', () => {
    it('should ignore keys matching regex patterns', () => {
      const conf = 'key-ordering:\n' + '  ignored-keys: ["n(a|o)me", "^b"]';
      check(
        '---\n' +
          'a:\n' +
          'b:\n' +
          'c:\n' +
          'name: ignored\n' +
          'first-name: ignored\n' +
          'nome: ignored\n' +
          'gnomes: ignored\n' +
          'd:\n' +
          'e:\n' +
          'boat: ignored\n' +
          '.boat: ERROR\n' +
          'call: ERROR\n' +
          'f:\n' +
          'g:\n',
        conf,
        RULE_ID,
        { problem1: [12, 1], problem2: [13, 1] }
      );
    });
  });
});
