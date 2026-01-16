/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for comments rule
 * Ported from Python yamllint tests/rules/test_comments.py
 */

import { describe, it } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'comments';

describe('comments', () => {
  describe('disabled', () => {
    const conf = 'comments: disable\n' + 'comments-indentation: disable';

    it('should allow any comment format when disabled', () => {
      check(
        '---\n' +
          '#comment\n' +
          '\n' +
          'test: #    description\n' +
          '  - foo  # bar\n' +
          '  - hello #world\n' +
          '\n' +
          '# comment 2\n' +
          '#comment 3\n' +
          '  #comment 3 bis\n' +
          '  #  comment 3 ter\n' +
          '\n' +
          '################################\n' +
          '## comment 4\n' +
          '##comment 5\n' +
          '\n' +
          'string: "Une longue phrase." # this is French\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('starting space', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: -1\n' +
      'comments-indentation: disable';

    it('should allow comments with starting space', () => {
      check(
        '---\n' +
          '# comment\n' +
          '\n' +
          'test:  #     description\n' +
          '  - foo  #   bar\n' +
          '  - hello  # world\n' +
          '\n' +
          '# comment 2\n' +
          '# comment 3\n' +
          '  #  comment 3 bis\n' +
          '  #  comment 3 ter\n' +
          '\n' +
          '################################\n' +
          '## comment 4\n' +
          '##  comment 5\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect comments missing starting space', () => {
      check(
        '---\n' +
          '#comment\n' +
          '\n' +
          'test:  #    description\n' +
          '  - foo  #  bar\n' +
          '  - hello  #world\n' +
          '\n' +
          '# comment 2\n' +
          '#comment 3\n' +
          '  #comment 3 bis\n' +
          '  #  comment 3 ter\n' +
          '\n' +
          '################################\n' +
          '## comment 4\n' +
          '##comment 5\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 2],
          problem2: [6, 13],
          problem3: [9, 2],
          problem4: [10, 4],
          problem5: [15, 3],
        }
      );
    });
  });

  describe('shebang', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  ignore-shebangs: false\n' +
      'comments-indentation: disable\n' +
      'document-start: disable';

    it('should detect shebang as missing starting space', () => {
      check('#!/bin/env my-interpreter\n', conf, RULE_ID, { problem1: [1, 2] });
    });

    it('should detect shebang on second line as missing starting space', () => {
      check('# comment\n' + '#!/bin/env my-interpreter\n', conf, RULE_ID, { problem1: [2, 2] });
    });

    it('should detect shebang and other comments missing starting space', () => {
      check(
        '#!/bin/env my-interpreter\n' + '---\n' + '#comment\n' + '#!/bin/env my-interpreter\n',
        conf,
        RULE_ID,
        {
          problem1: [1, 2],
          problem2: [3, 2],
          problem3: [4, 2],
        }
      );
    });

    it('should detect #! as missing starting space', () => {
      check('#! is a valid shebang too\n', conf, RULE_ID, { problem1: [1, 2] });
    });

    it('should detect inline shebang-like comment as missing starting space', () => {
      check('key:  #!/not/a/shebang\n', conf, RULE_ID, { problem1: [1, 8] });
    });
  });

  describe('ignore shebang', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  ignore-shebangs: true\n' +
      'comments-indentation: disable\n' +
      'document-start: disable';

    it('should ignore shebang on first line', () => {
      check('#!/bin/env my-interpreter\n', conf, RULE_ID, {});
    });

    it('should detect shebang on second line as missing starting space', () => {
      check('# comment\n' + '#!/bin/env my-interpreter\n', conf, RULE_ID, { problem1: [2, 2] });
    });

    it('should ignore first line shebang but detect other comments', () => {
      check(
        '#!/bin/env my-interpreter\n' + '---\n' + '#comment\n' + '#!/bin/env my-interpreter\n',
        conf,
        RULE_ID,
        {
          problem2: [3, 2],
          problem3: [4, 2],
        }
      );
    });

    it('should ignore #! on first line', () => {
      check('#! is a valid shebang too\n', conf, RULE_ID, {});
    });

    it('should detect inline shebang-like comment as missing starting space', () => {
      check('key:  #!/not/a/shebang\n', conf, RULE_ID, { problem1: [1, 8] });
    });
  });

  describe('spaces from content', () => {
    const conf =
      'comments:\n' + '  require-starting-space: false\n' + '  min-spaces-from-content: 2';

    it('should allow correct spacing from content', () => {
      check(
        '---\n' +
          '# comment\n' +
          '\n' +
          'test:  #    description\n' +
          '  - foo  #  bar\n' +
          '  - hello  #world\n' +
          '\n' +
          'string: "Une longue phrase."  # this is French\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should detect insufficient spacing from content', () => {
      check(
        '---\n' +
          '# comment\n' +
          '\n' +
          'test: #    description\n' +
          '  - foo  # bar\n' +
          '  - hello #world\n' +
          '\n' +
          'string: "Une longue phrase." # this is French\n',
        conf,
        RULE_ID,
        {
          problem1: [4, 7],
          problem2: [6, 11],
          problem3: [8, 30],
        }
      );
    });
  });

  describe('both', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: 2\n' +
      'comments-indentation: disable';

    it('should detect both starting space and spacing from content issues', () => {
      check(
        '---\n' +
          '#comment\n' +
          '\n' +
          'test: #    description\n' +
          '  - foo  # bar\n' +
          '  - hello #world\n' +
          '\n' +
          '# comment 2\n' +
          '#comment 3\n' +
          '  #comment 3 bis\n' +
          '  #  comment 3 ter\n' +
          '\n' +
          '################################\n' +
          '## comment 4\n' +
          '##comment 5\n' +
          '\n' +
          'string: "Une longue phrase." # this is French\n',
        conf,
        RULE_ID,
        {
          problem1: [2, 2],
          problem2: [4, 7],
          problem3: [6, 11],
          problem4: [6, 12],
          problem5: [9, 2],
          problem6: [10, 4],
          problem7: [15, 3],
          problem8: [17, 30],
        }
      );
    });
  });

  describe('empty comment', () => {
    const conf =
      'comments:\n' + '  require-starting-space: true\n' + '  min-spaces-from-content: 2';

    it('should allow empty comments in paragraphs', () => {
      check(
        '---\n' + '# This is paragraph 1.\n' + '#\n' + '# This is paragraph 2.\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow inline empty comment', () => {
      check('---\n' + 'inline: comment  #\n' + 'foo: bar\n', conf, RULE_ID, {});
    });
  });

  describe('empty comment crlf dos newlines', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: 2\n' +
      'new-lines:\n' +
      '  type: dos';

    it('should allow empty comments with CRLF newlines', () => {
      check(
        '---\r\n' + '# This is paragraph 1.\r\n' + '#\r\n' + '# This is paragraph 2.\r\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('empty comment crlf disabled newlines', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: 2\n' +
      'new-lines: disable';

    it('should allow empty comments with CRLF newlines when new-lines disabled', () => {
      check(
        '---\r\n' + '# This is paragraph 1.\r\n' + '#\r\n' + '# This is paragraph 2.\r\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });

  describe('first line', () => {
    const conf =
      'comments:\n' + '  require-starting-space: true\n' + '  min-spaces-from-content: 2';

    it('should allow comment on first line', () => {
      check('# comment\n', conf, RULE_ID, {});
    });
  });

  describe('last line', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: 2\n' +
      'new-line-at-end-of-file: disable';

    it('should allow comment on last line without trailing newline', () => {
      check('# comment with no newline char:\n' + '#', conf, RULE_ID, {});
    });
  });

  describe('multi line scalar', () => {
    const conf =
      'comments:\n' +
      '  require-starting-space: true\n' +
      '  min-spaces-from-content: 2\n' +
      'trailing-spaces: disable\n' +
      'comments-indentation: disable';

    it('should allow comment after multi-line scalar', () => {
      check(
        '---\n' + 'string: >\n' + '  this is plain text\n' + '\n' + '# comment\n',
        conf,
        RULE_ID,
        {}
      );
    });

    it('should allow comment after multi-line scalar in list', () => {
      check(
        '---\n' + '- string: >\n' + '    this is plain text\n' + '  \n' + '  # comment\n',
        conf,
        RULE_ID,
        {}
      );
    });
  });
});
