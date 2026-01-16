/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for document-start rule
 * Ported from Python yamllint tests/rules/test_document_start.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'document-start';

describe('document-start', () => {
  describe('disabled', () => {
    const conf = 'document-start: disable';

    it('should allow empty file', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow content without document start', () => {
      check('key: val\n', conf, RULE_ID, {});
    });

    it('should allow content with document start', () => {
      check('---\n' + 'key: val\n', conf, RULE_ID, {});
    });
  });

  describe('required (present: true)', () => {
    const conf = 'document-start: {present: true}\n' + 'empty-lines: disable';

    it('should allow empty file', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID, {});
    });

    it('should detect missing document start', () => {
      check('key: val\n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should detect missing document start after empty lines', () => {
      check('\n' + '\n' + 'key: val\n', conf, RULE_ID, { problem1: [3, 1] });
    });

    it('should allow document with start marker', () => {
      check('---\n' + 'key: val\n', conf, RULE_ID, {});
    });

    it('should allow document start after empty lines', () => {
      check('\n' + '\n' + '---\n' + 'key: val\n', conf, RULE_ID, {});
    });
  });

  describe('forbidden (present: false)', () => {
    const conf = 'document-start: {present: false}\n' + 'empty-lines: disable';

    it('should allow empty file', () => {
      check('', conf, RULE_ID, {});
    });

    it('should allow content without document start', () => {
      check('key: val\n', conf, RULE_ID, {});
    });

    it('should allow content after empty lines without document start', () => {
      check('\n' + '\n' + 'key: val\n', conf, RULE_ID, {});
    });

    it('should detect forbidden document start at beginning', () => {
      check('---\n' + 'key: val\n', conf, RULE_ID, { problem1: [1, 1] });
    });

    it('should detect forbidden document start after empty lines', () => {
      check('\n' + '\n' + '---\n' + 'key: val\n', conf, RULE_ID, { problem1: [3, 1] });
    });

    it('should detect forbidden document start between documents', () => {
      check('first: document\n' + '---\n' + 'key: val\n', conf, RULE_ID, { problem1: [2, 1] });
    });
  });

  describe('multiple documents', () => {
    const conf = 'document-start: {present: true}';

    it('should allow multiple documents with start and end markers', () => {
      check(
        '---\n' +
          'first: document\n' +
          '...\n' +
          '---\n' +
          'second: document\n' +
          '...\n' +
          '---\n' +
          'third: document\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow multiple documents with only start markers', () => {
      check(
        '---\n' +
          'first: document\n' +
          '---\n' +
          'second: document\n' +
          '---\n' +
          'third: document\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect missing document start after end marker', () => {
      // Note: Python yamllint reports this as a syntax error from the parser,
      // but our parser is more lenient, so we catch it with the document-start rule.
      check(
        '---\n' +
          'first: document\n' +
          '...\n' +
          'second: document\n' +
          '---\n' +
          'third: document\n',
        conf,
        RULE_ID,
        { problem1: [4, 1] }
      );
    });
  });

  describe('directives', () => {
    const conf = 'document-start: {present: true}';

    it('should allow YAML directive before document start', () => {
      check('%YAML 1.2\n' + '---\n' + 'doc: ument\n' + '...\n', conf, RULE_ID, {});
    });

    it('should allow multiple directives before document start', () => {
      check(
        '%YAML 1.2\n' + '%TAG ! tag:clarkevans.com,2002:\n' + '---\n' + 'doc: ument\n' + '...\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow directives between documents', () => {
      check(
        '---\n' +
          'doc: 1\n' +
          '...\n' +
          '%YAML 1.2\n' +
          '---\n' +
          'doc: 2\n' +
          '...\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });
});
