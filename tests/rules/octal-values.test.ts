import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'octal-values';

describe('octal-values', () => {
  describe('disabled', () => {
    it('should allow octal values when disabled', () => {
      const conf =
        'octal-values: disable\n' +
        'new-line-at-end-of-file: disable\n' +
        'document-start: disable\n';
      check('user-city: 010', conf, RULE_ID);
      check('user-city: 0o10', conf, RULE_ID);
    });
  });

  describe('implicit-octal-values', () => {
    const conf =
      'octal-values:\n' +
      '  forbid-implicit-octal: true\n' +
      '  forbid-explicit-octal: false\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable\n';

    it('should allow after custom tag', () => {
      check('after-tag: !custom_tag 010', conf, RULE_ID);
    });

    it('should detect implicit octal in value', () => {
      check('user-city: 010', conf, RULE_ID, { problem1: [1, 15] });
    });

    it('should allow non-octal values', () => {
      check('user-city: abc', conf, RULE_ID);
    });

    it('should allow octal-like strings with commas', () => {
      check('user-city: 010,0571', conf, RULE_ID);
    });

    it('should allow single-quoted octal strings', () => {
      check("user-city: '010'", conf, RULE_ID);
    });

    it('should allow double-quoted octal strings', () => {
      check('user-city: "010"', conf, RULE_ID);
    });

    it('should detect implicit octal in list', () => {
      check('user-city:\n' + '  - 010', conf, RULE_ID, { problem1: [2, 8] });
    });

    it('should detect implicit octal in flow sequence', () => {
      check('user-city: [010]', conf, RULE_ID, { problem1: [1, 16] });
    });

    it('should detect implicit octal in flow mapping', () => {
      check('user-city: {beijing: 010}', conf, RULE_ID, { problem1: [1, 25] });
    });

    it('should allow explicit octal', () => {
      check('explicit-octal: 0o10', conf, RULE_ID);
    });

    it('should allow non-numeric starting with 0', () => {
      check('not-number: 0abc', conf, RULE_ID);
    });

    it('should allow zero', () => {
      check('zero: 0', conf, RULE_ID);
    });

    it('should allow hex values', () => {
      check('hex-value: 0x10', conf, RULE_ID);
    });

    it('should allow decimal and scientific notation', () => {
      check('number-values:\n' + '  - 0.10\n' + '  - .01\n' + '  - 0e3\n', conf, RULE_ID);
    });

    it('should allow numbers with decimal digits 8', () => {
      check('with-decimal-digits: 012345678', conf, RULE_ID);
    });

    it('should allow numbers with decimal digits 9', () => {
      check('with-decimal-digits: 012345679', conf, RULE_ID);
    });
  });

  describe('explicit-octal-values', () => {
    const conf =
      'octal-values:\n' +
      '  forbid-implicit-octal: false\n' +
      '  forbid-explicit-octal: true\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable\n';

    it('should detect explicit octal in value', () => {
      check('user-city: 0o10', conf, RULE_ID, { problem1: [1, 16] });
    });

    it('should allow non-octal values', () => {
      check('user-city: abc', conf, RULE_ID);
    });

    it('should allow explicit octal-like strings with commas', () => {
      check('user-city: 0o10,0571', conf, RULE_ID);
    });

    it('should allow single-quoted explicit octal strings', () => {
      check("user-city: '0o10'", conf, RULE_ID);
    });

    it('should detect explicit octal in list', () => {
      check('user-city:\n' + '  - 0o10', conf, RULE_ID, { problem1: [2, 9] });
    });

    it('should detect explicit octal in flow sequence', () => {
      check('user-city: [0o10]', conf, RULE_ID, { problem1: [1, 17] });
    });

    it('should detect explicit octal in flow mapping', () => {
      check('user-city: {beijing: 0o10}', conf, RULE_ID, { problem1: [1, 26] });
    });

    it('should allow implicit octal', () => {
      check('implicit-octal: 010', conf, RULE_ID);
    });

    it('should allow non-numeric starting with 0o', () => {
      check('not-number: 0oabc', conf, RULE_ID);
    });

    it('should allow zero', () => {
      check('zero: 0', conf, RULE_ID);
    });

    it('should allow hex values', () => {
      check('hex-value: 0x10', conf, RULE_ID);
    });

    it('should allow decimal and scientific notation', () => {
      check('number-values:\n' + '  - 0.10\n' + '  - .01\n' + '  - 0e3\n', conf, RULE_ID);
    });

    it('should allow double-quoted octal strings', () => {
      check('user-city: "010"', conf, RULE_ID);
    });

    it('should allow explicit octal with decimal digits 8', () => {
      check('with-decimal-digits: 0o012345678', conf, RULE_ID);
    });

    it('should allow explicit octal with decimal digits 9', () => {
      check('with-decimal-digits: 0o012345679', conf, RULE_ID);
    });
  });
});
