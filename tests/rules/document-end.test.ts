import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'document-end';

describe('document-end', () => {
  describe('disabled', () => {
    it('should allow any document end markers when disabled', () => {
      const conf = 'document-end: disable';
      check('---\n' + 'with:\n' + '  document: end\n' + '...\n', conf, RULE_ID);
      check('---\n' + 'without:\n' + '  document: end\n', conf, RULE_ID);
    });
  });

  describe('required', () => {
    it('should allow empty documents', () => {
      const conf = 'document-end: {present: true}';
      check('', conf, RULE_ID);
      check('\n', conf, RULE_ID);
    });

    it('should allow document with end marker', () => {
      const conf = 'document-end: {present: true}';
      check('---\n' + 'with:\n' + '  document: end\n' + '...\n', conf, RULE_ID);
    });

    it('should report missing document end marker', () => {
      const conf = 'document-end: {present: true}';
      check('---\n' + 'without:\n' + '  document: end\n', conf, RULE_ID, { problem1: [3, 1] });
    });
  });

  describe('forbidden', () => {
    it('should report forbidden document end marker', () => {
      const conf = 'document-end: {present: false}';
      check('---\n' + 'with:\n' + '  document: end\n' + '...\n', conf, RULE_ID, {
        problem1: [4, 1],
      });
    });

    it('should allow document without end marker', () => {
      const conf = 'document-end: {present: false}';
      check('---\n' + 'without:\n' + '  document: end\n', conf, RULE_ID);
    });
  });

  describe('multiple-documents', () => {
    it('should allow multiple documents all with end markers', () => {
      const conf = 'document-end: {present: true}\n' + 'document-start: disable\n';
      check(
        '---\n' +
          'first: document\n' +
          '...\n' +
          '---\n' +
          'second: document\n' +
          '...\n' +
          '---\n' +
          'third: document\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });

    it('should report missing end marker in middle document', () => {
      const conf = 'document-end: {present: true}\n' + 'document-start: disable\n';
      check(
        '---\n' +
          'first: document\n' +
          '...\n' +
          '---\n' +
          'second: document\n' +
          '---\n' +
          'third: document\n' +
          '...\n',
        conf,
        RULE_ID,
        { problem1: [6, 1] }
      );
    });
  });

  describe('directives', () => {
    it('should allow document with YAML directive and end marker', () => {
      const conf = 'document-end: {present: true}';
      check('%YAML 1.2\n' + '---\n' + 'document: end\n' + '...\n', conf, RULE_ID);
    });

    it('should allow document with YAML and TAG directives and end marker', () => {
      const conf = 'document-end: {present: true}';
      check(
        '%YAML 1.2\n' + '%TAG ! tag:clarkevans.com,2002:\n' + '---\n' + 'document: end\n' + '...\n',
        conf,
        RULE_ID
      );
    });

    it('should allow multiple documents with directives and end markers', () => {
      const conf = 'document-end: {present: true}';
      check(
        '---\n' +
          'first: document\n' +
          '...\n' +
          '%YAML 1.2\n' +
          '---\n' +
          'second: document\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });
  });
});
