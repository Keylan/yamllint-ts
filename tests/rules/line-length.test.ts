import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'line-length';

describe('line-length', () => {
  describe('test_disabled', () => {
    const conf =
      'line-length: disable\n' +
      'empty-lines: disable\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID);
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID);
    });

    it('should allow document start', () => {
      check('---\n', conf, RULE_ID);
    });

    it('should allow 81 character line', () => {
      check('a'.repeat(81), conf, RULE_ID);
    });

    it('should allow 81 character line with document start', () => {
      check('---\n' + 'a'.repeat(81) + '\n', conf, RULE_ID);
    });

    it('should allow 1000 character line', () => {
      check('b'.repeat(1000), conf, RULE_ID);
    });

    it('should allow 1000 character line with document start', () => {
      check('---\n' + 'b'.repeat(1000) + '\n', conf, RULE_ID);
    });

    it('should allow long template line in literal block', () => {
      check(
        'content: |\n' + '  {% this line is' + ' really'.repeat(99) + ' long %}\n',
        conf,
        RULE_ID
      );
    });
  });

  describe('test_default', () => {
    const conf =
      'line-length: {max: 80}\n' +
      'empty-lines: disable\n' +
      'new-line-at-end-of-file: disable\n' +
      'document-start: disable';

    it('should allow empty string', () => {
      check('', conf, RULE_ID);
    });

    it('should allow single newline', () => {
      check('\n', conf, RULE_ID);
    });

    it('should allow document start', () => {
      check('---\n', conf, RULE_ID);
    });

    it('should allow exactly 80 characters', () => {
      check('a'.repeat(80), conf, RULE_ID);
    });

    it('should allow exactly 80 characters with document start', () => {
      check('---\n' + 'a'.repeat(80) + '\n', conf, RULE_ID);
    });

    it('should report line exceeding 80 characters', () => {
      check('aaaa '.repeat(16) + 'z', conf, RULE_ID, { problem1: [1, 81] });
    });

    it('should report line exceeding 80 characters with document start', () => {
      check('---\n' + 'aaaa '.repeat(16) + 'z' + '\n', conf, RULE_ID, { problem1: [2, 81] });
    });

    it('should report very long line', () => {
      check('word '.repeat(1000) + 'end', conf, RULE_ID, { problem1: [1, 81] });
    });

    it('should report very long line with document start', () => {
      check('---\n' + 'word '.repeat(1000) + 'end\n', conf, RULE_ID, { problem1: [2, 81] });
    });
  });

  describe('test_max_length_10', () => {
    const conf = 'line-length: {max: 10}\n' + 'new-line-at-end-of-file: disable';

    it('should allow exactly 10 characters', () => {
      check('---\nABCD EFGHI', conf, RULE_ID);
    });

    it('should report line exceeding 10 characters', () => {
      check('---\nABCD EFGHIJ', conf, RULE_ID, { problem1: [2, 11] });
    });

    it('should report line exceeding 10 characters with newline', () => {
      check('---\nABCD EFGHIJ\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });

  describe('test_spaces', () => {
    const conf =
      'line-length: {max: 80}\n' +
      'new-line-at-end-of-file: disable\n' +
      'trailing-spaces: disable';

    it('should report line of 81 spaces', () => {
      check('---\n' + ' '.repeat(81), conf, RULE_ID, { problem1: [2, 81] });
    });

    it('should report line of 81 spaces with newline', () => {
      check('---\n' + ' '.repeat(81) + '\n', conf, RULE_ID, { problem1: [2, 81] });
    });
  });

  describe('test_non_breakable_word', () => {
    describe('with allow-non-breakable-words: true', () => {
      const conf = 'line-length: {max: 20, allow-non-breakable-words: true}';

      it('should allow long non-breakable word', () => {
        check('---\n' + 'A'.repeat(30) + '\n', conf, RULE_ID);
      });

      it('should allow long URL in nested structure', () => {
        check(
          '---\n' +
            'this:\n' +
            '  is:\n' +
            '    - a:\n' +
            '        http://localhost/very/long/url\n' +
            '...\n',
          conf,
          RULE_ID
        );
      });

      it('should allow long URL in comment', () => {
        check(
          '---\n' +
            'this:\n' +
            '  is:\n' +
            '    - a:\n' +
            '        # http://localhost/very/long/url\n' +
            '        comment\n' +
            '...\n',
          conf,
          RULE_ID
        );
      });

      it('should allow long URL in list item', () => {
        check(
          '---\n' +
            'this:\n' +
            'is:\n' +
            'another:\n' +
            '  - https://localhost/very/very/long/url\n' +
            '...\n',
          conf,
          RULE_ID
        );
      });

      it('should report long line with breakable content before URL', () => {
        check('---\n' + 'long_line: http://localhost/very/very/long/url\n', conf, RULE_ID, {
          problem1: [2, 21],
        });
      });
    });

    describe('with allow-non-breakable-words: false', () => {
      const conf = 'line-length: {max: 20, allow-non-breakable-words: false}';

      it('should report long non-breakable word', () => {
        check('---\n' + 'A'.repeat(30) + '\n', conf, RULE_ID, { problem1: [2, 21] });
      });

      it('should report long URL in nested structure', () => {
        check(
          '---\n' +
            'this:\n' +
            '  is:\n' +
            '    - a:\n' +
            '        http://localhost/very/long/url\n' +
            '...\n',
          conf,
          RULE_ID,
          { problem1: [5, 21] }
        );
      });

      it('should report long URL in comment', () => {
        check(
          '---\n' +
            'this:\n' +
            '  is:\n' +
            '    - a:\n' +
            '        # http://localhost/very/long/url\n' +
            '        comment\n' +
            '...\n',
          conf,
          RULE_ID,
          { problem1: [5, 21] }
        );
      });

      it('should report long URL in list item', () => {
        check(
          '---\n' +
            'this:\n' +
            'is:\n' +
            'another:\n' +
            '  - https://localhost/very/very/long/url\n' +
            '...\n',
          conf,
          RULE_ID,
          { problem1: [5, 21] }
        );
      });

      it('should report long line with URL in value', () => {
        check(
          '---\n' + 'long_line: http://localhost/very/very/long/url\n' + '...\n',
          conf,
          RULE_ID,
          { problem1: [2, 21] }
        );
      });
    });

    describe('comments with allow-non-breakable-words: true', () => {
      const conf = 'line-length: {max: 20, allow-non-breakable-words: true}';

      it('should allow long URL in single hash comment', () => {
        check(
          '---\n' +
            '# http://www.verylongurlurlurlurlurlurlurlurl.com\n' +
            'key:\n' +
            '  subkey: value\n',
          conf,
          RULE_ID
        );
      });

      it('should allow long URL in double hash comment', () => {
        check(
          '---\n' +
            '## http://www.verylongurlurlurlurlurlurlurlurl.com\n' +
            'key:\n' +
            '  subkey: value\n',
          conf,
          RULE_ID
        );
      });

      it('should report hash space hash comment with long URL', () => {
        check(
          '---\n' +
            '# # http://www.verylongurlurlurlurlurlurlurlurl.com\n' +
            'key:\n' +
            '  subkey: value\n',
          conf,
          RULE_ID,
          { problem1: [2, 21] }
        );
      });

      it('should report comment without space after hash with long URL', () => {
        check(
          '---\n' +
            '#A http://www.verylongurlurlurlurlurlurlurlurl.com\n' +
            'key:\n' +
            '  subkey: value\n',
          conf,
          RULE_ID,
          { problem1: [2, 2, 'comments'], problem2: [2, 21, 'line-length'] }
        );
      });
    });

    describe('trailing spaces with allow-non-breakable-words: true', () => {
      const conf =
        'line-length: {max: 20, allow-non-breakable-words: true}\n' + 'trailing-spaces: disable';

      it('should report long word followed by trailing spaces', () => {
        check('---\n' + 'loooooooooong+word+and+some+space+at+the+end       \n', conf, RULE_ID, {
          problem1: [2, 21],
        });
      });
    });
  });

  describe('test_non_breakable_inline_mappings', () => {
    describe('basic inline mappings', () => {
      const conf = 'line-length: {max: 20, allow-non-breakable-inline-mappings: true}';

      it('should allow long inline mappings', () => {
        check(
          '---\n' +
            'long_line: http://localhost/very/very/long/url\n' +
            'long line: http://localhost/very/very/long/url\n',
          conf,
          RULE_ID
        );
      });

      it('should allow long inline mapping in list', () => {
        check('---\n' + '- long line: http://localhost/very/very/long/url\n', conf, RULE_ID);
      });

      it('should report breakable inline mappings', () => {
        check(
          '---\n' +
            'long_line: http://localhost/short/url + word\n' +
            'long line: http://localhost/short/url + word\n',
          conf,
          RULE_ID,
          { problem1: [2, 21], problem2: [3, 21] }
        );
      });
    });

    describe('with trailing spaces', () => {
      const conf =
        'line-length: {max: 20, allow-non-breakable-inline-mappings: true}\n' +
        'trailing-spaces: disable';

      it('should report inline mapping with trailing spaces (underscore key)', () => {
        check('---\n' + 'long_line: and+some+space+at+the+end       \n', conf, RULE_ID, {
          problem1: [2, 21],
        });
      });

      it('should report inline mapping with trailing spaces (space key)', () => {
        check('---\n' + 'long line: and+some+space+at+the+end       \n', conf, RULE_ID, {
          problem1: [2, 21],
        });
      });

      it('should report inline mapping in list with trailing spaces', () => {
        check('---\n' + '- long line: and+some+space+at+the+end       \n', conf, RULE_ID, {
          problem1: [2, 21],
        });
      });
    });

    describe('issue 21 - literal block scalar', () => {
      const conf = 'line-length: {allow-non-breakable-inline-mappings: true}';

      it('should report long line in literal block', () => {
        check(
          '---\n' + 'content: |\n' + '  {% this line is' + ' really'.repeat(99) + ' long %}\n',
          conf,
          RULE_ID,
          { problem1: [3, 81] }
        );
      });
    });
  });

  describe('test_unicode', () => {
    it('should handle unicode characters correctly at max length', () => {
      const conf = 'line-length: {max: 53}';
      check(
        '---\n' +
          '# This is a test to check if "line-length" works nice\n' +
          'with: \u201cunicode characters\u201d that span across bytes! \u21ba\n',
        conf,
        RULE_ID
      );
    });

    it('should report unicode lines exceeding max length', () => {
      const conf = 'line-length: {max: 51}';
      check(
        '---\n' +
          '# This is a test to check if "line-length" works nice\n' +
          'with: \u201cunicode characters\u201d that span across bytes! \u21ba\n',
        conf,
        RULE_ID,
        { problem1: [2, 52], problem2: [3, 52] }
      );
    });
  });

  describe('test_with_dos_newlines', () => {
    const conf =
      'line-length: {max: 10}\n' + 'new-lines: {type: dos}\n' + 'new-line-at-end-of-file: disable';

    it('should allow line within limit with DOS newlines', () => {
      check('---\r\nABCD EFGHI', conf, RULE_ID);
    });

    it('should allow line within limit with DOS newlines and ending', () => {
      check('---\r\nABCD EFGHI\r\n', conf, RULE_ID);
    });

    it('should report line exceeding limit with DOS newlines', () => {
      check('---\r\nABCD EFGHIJ', conf, RULE_ID, { problem1: [2, 11] });
    });

    it('should report line exceeding limit with DOS newlines and ending', () => {
      check('---\r\nABCD EFGHIJ\r\n', conf, RULE_ID, { problem1: [2, 11] });
    });
  });
});
