import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'anchors';

describe('anchors', () => {
  describe('disabled', () => {
    it('should allow any anchors and aliases when disabled', () => {
      const conf = 'anchors: disable';
      check(
        '---\n' +
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- &f_m {k: v}\n' +
          '- &f_s [1, 2]\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '- *f_m\n' +
          '- *f_s\n' +
          '---\n' + // redeclare anchors in a new document
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &y 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });

    it('should allow duplicated anchors, undeclared aliases, and unused anchors when disabled', () => {
      const conf = 'anchors: disable';
      check(
        '---\n' +
          '- &i 42\n' +
          '---\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' + // declared in a previous document
          '- *f_m\n' + // never declared
          '- *f_m\n' +
          '- *f_m\n' +
          '- *f_s\n' + // declared after
          '- &f_s [1, 2]\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          '---\n' +
          'block mapping 1: &b_m_bis\n' +
          '  key: value\n' +
          'block mapping 2: &b_m_bis\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &x 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('forbid-undeclared-aliases', () => {
    it('should allow valid anchors and aliases when forbid-undeclared-aliases is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: true\n' +
        '  forbid-duplicated-anchors: false\n' +
        '  forbid-unused-anchors: false\n';
      check(
        '---\n' +
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- &f_m {k: v}\n' +
          '- &f_s [1, 2]\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '- *f_m\n' +
          '- *f_s\n' +
          '---\n' + // redeclare anchors in a new document
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &y 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });

    it('should report undeclared aliases when forbid-undeclared-aliases is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: true\n' +
        '  forbid-duplicated-anchors: false\n' +
        '  forbid-unused-anchors: false\n';
      check(
        '---\n' +
          '- &i 42\n' +
          '---\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' + // declared in a previous document
          '- *f_m\n' + // never declared
          '- *f_m\n' +
          '- *f_m\n' +
          '- *f_s\n' + // declared after
          '- &f_s [1, 2]\n' +
          '...\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          '---\n' +
          'block mapping 1: &b_m_bis\n' +
          '  key: value\n' +
          'block mapping 2: &b_m_bis\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &x 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID,
        {
          problem1: [9, 3],
          problem2: [10, 3],
          problem3: [11, 3],
          problem4: [12, 3],
          problem5: [13, 3],
          problem6: [25, 7],
          problem7: [28, 37],
        }
      );
    });
  });

  describe('forbid-duplicated-anchors', () => {
    it('should allow valid anchors and aliases when forbid-duplicated-anchors is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: false\n' +
        '  forbid-duplicated-anchors: true\n' +
        '  forbid-unused-anchors: false\n';
      check(
        '---\n' +
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- &f_m {k: v}\n' +
          '- &f_s [1, 2]\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '- *f_m\n' +
          '- *f_s\n' +
          '---\n' + // redeclare anchors in a new document
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &y 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });

    it('should report duplicated anchors when forbid-duplicated-anchors is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: false\n' +
        '  forbid-duplicated-anchors: true\n' +
        '  forbid-unused-anchors: false\n';
      check(
        '---\n' +
          '- &i 42\n' +
          '---\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' + // declared in a previous document
          '- *f_m\n' + // never declared
          '- *f_m\n' +
          '- *f_m\n' +
          '- *f_s\n' + // declared after
          '- &f_s [1, 2]\n' +
          '...\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          '---\n' +
          'block mapping 1: &b_m_bis\n' +
          '  key: value\n' +
          'block mapping 2: &b_m_bis\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &x 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID,
        {
          problem1: [5, 3],
          problem2: [6, 3],
          problem3: [22, 18],
          problem4: [28, 20],
        }
      );
    });
  });

  describe('forbid-unused-anchors', () => {
    it('should allow valid anchors and aliases when forbid-unused-anchors is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: false\n' +
        '  forbid-duplicated-anchors: false\n' +
        '  forbid-unused-anchors: true\n';
      check(
        '---\n' +
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- &f_m {k: v}\n' +
          '- &f_s [1, 2]\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '- *f_m\n' +
          '- *f_s\n' +
          '---\n' + // redeclare anchors in a new document
          '- &b true\n' +
          '- &i 42\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' +
          '- *s\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &y 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID
      );
    });

    it('should report unused anchors when forbid-unused-anchors is true', () => {
      const conf =
        'anchors:\n' +
        '  forbid-undeclared-aliases: false\n' +
        '  forbid-duplicated-anchors: false\n' +
        '  forbid-unused-anchors: true\n';
      check(
        '---\n' +
          '- &i 42\n' +
          '---\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &b true\n' +
          '- &s hello\n' +
          '- *b\n' +
          '- *i\n' + // declared in a previous document
          '- *f_m\n' + // never declared
          '- *f_m\n' +
          '- *f_m\n' +
          '- *f_s\n' + // declared after
          '- &f_s [1, 2]\n' +
          '...\n' +
          '---\n' +
          'block mapping: &b_m\n' +
          '  key: value\n' +
          '---\n' +
          'block mapping 1: &b_m_bis\n' +
          '  key: value\n' +
          'block mapping 2: &b_m_bis\n' +
          '  key: value\n' +
          'extended:\n' +
          '  <<: *b_m\n' +
          '  foo: bar\n' +
          '---\n' +
          '{a: 1, &x b: 2, c: &x 3, *x : 4, e: *y}\n' +
          '...\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 3],
          problem2: [7, 3],
          problem3: [14, 3],
          problem4: [17, 16],
          problem5: [22, 18],
        }
      );
    });
  });
});
