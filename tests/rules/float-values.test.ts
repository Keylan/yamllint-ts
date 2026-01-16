import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'float-values';

describe('float-values', () => {
  describe('disabled', () => {
    it('should allow all float values when disabled', () => {
      const conf = 'float-values: disable';
      check('---\n' + '- 0.0\n' + '- .NaN\n' + '- .INF\n' + '- .1\n' + '- 10e-6\n', conf, RULE_ID);
    });
  });

  describe('require-numeral-before-decimal', () => {
    it('should require numeral before decimal point', () => {
      const conf =
        'float-values:\n' +
        '  require-numeral-before-decimal: true\n' +
        '  forbid-scientific-notation: false\n' +
        '  forbid-nan: false\n' +
        '  forbid-inf: false';
      check(
        '---\n' +
          '- 0.0\n' +
          '- .1\n' +
          "- '.1'\n" +
          '- string.1\n' +
          '- .1string\n' +
          '- !custom_tag .2\n' +
          '- &angle1 0.0\n' +
          '- *angle1\n' +
          '- &angle2 .3\n' +
          '- *angle2\n',
        conf,
        RULE_ID,
        { problem1: [3, 3], problem2: [10, 11] }
      );
    });
  });

  describe('forbid-scientific-notation', () => {
    it('should forbid scientific notation', () => {
      const conf =
        'float-values:\n' +
        '  require-numeral-before-decimal: false\n' +
        '  forbid-scientific-notation: true\n' +
        '  forbid-nan: false\n' +
        '  forbid-inf: false';
      check(
        '---\n' +
          '- 10e6\n' +
          '- 10e-6\n' +
          '- 0.00001\n' +
          "- '10e-6'\n" +
          '- string10e-6\n' +
          '- 10e-6string\n' +
          '- !custom_tag 10e-6\n' +
          '- &angle1 0.000001\n' +
          '- *angle1\n' +
          '- &angle2 10e-6\n' +
          '- *angle2\n' +
          '- &angle3 10e6\n' +
          '- *angle3\n',
        conf,
        RULE_ID,
        { problem1: [2, 3], problem2: [3, 3], problem3: [11, 11], problem4: [13, 11] }
      );
    });
  });

  describe('forbid-nan', () => {
    it('should forbid NaN values', () => {
      const conf =
        'float-values:\n' +
        '  require-numeral-before-decimal: false\n' +
        '  forbid-scientific-notation: false\n' +
        '  forbid-nan: true\n' +
        '  forbid-inf: false';
      check(
        '---\n' +
          '- .NaN\n' +
          '- .NAN\n' +
          "- '.NaN'\n" +
          '- a.NaN\n' +
          '- .NaNa\n' +
          '- !custom_tag .NaN\n' +
          '- &angle .nan\n' +
          '- *angle\n',
        conf,
        RULE_ID,
        { problem1: [2, 3], problem2: [3, 3], problem3: [8, 10] }
      );
    });
  });

  describe('forbid-inf', () => {
    it('should forbid infinity values', () => {
      const conf =
        'float-values:\n' +
        '  require-numeral-before-decimal: false\n' +
        '  forbid-scientific-notation: false\n' +
        '  forbid-nan: false\n' +
        '  forbid-inf: true';
      check(
        '---\n' +
          '- .inf\n' +
          '- .INF\n' +
          '- -.inf\n' +
          '- -.INF\n' +
          "- '.inf'\n" +
          '- \u221e.infinity\n' +
          '- .infinity\u221e\n' +
          '- !custom_tag .inf\n' +
          '- &angle .inf\n' +
          '- *angle\n' +
          '- &angle -.inf\n' +
          '- *angle\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 3],
          problem2: [3, 3],
          problem3: [4, 3],
          problem4: [5, 3],
          problem5: [10, 10],
          problem6: [12, 10],
        }
      );
    });
  });
});
