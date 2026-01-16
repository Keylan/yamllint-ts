/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: comments
 *
 * Control the position and formatting of comments.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Comment } from '../types.js';

export const ID = 'comments';
export const TYPE = 'comment' as const;

export const CONF = {
  'require-starting-space': Boolean,
  'ignore-shebangs': Boolean,
  'min-spaces-from-content': Number,
};

export const DEFAULT = {
  'require-starting-space': true,
  'ignore-shebangs': true,
  'min-spaces-from-content': 2,
};

export function* check(conf: RuleConfig, comment: Comment): Generator<LintProblem> {
  const requireStartingSpace = conf['require-starting-space'] as boolean;
  const ignoreShebangs = conf['ignore-shebangs'] as boolean;
  const minSpacesFromContent = conf['min-spaces-from-content'] as number;

  // Check min-spaces-from-content for inline comments
  if (minSpacesFromContent !== -1 && comment.isInline() && comment.tokenBefore) {
    const spacesBeforeComment = comment.pointer - comment.tokenBefore.endMark.pointer;
    if (spacesBeforeComment < minSpacesFromContent) {
      yield new LintProblem(
        comment.lineNo,
        comment.columnNo,
        `too few spaces before comment: expected ${minSpacesFromContent}`
      );
    }
  }

  // Check require-starting-space
  if (requireStartingSpace) {
    const buffer = comment.buffer;
    let textStart = comment.pointer + 1;

    // Skip multiple # characters (like ######)
    while (textStart < buffer.length && buffer[textStart] === '#') {
      textStart++;
    }

    if (textStart < buffer.length) {
      const charAfterHash = buffer[textStart];

      // Check for shebang exception
      if (
        ignoreShebangs &&
        comment.lineNo === 1 &&
        comment.columnNo === 1 &&
        charAfterHash === '!'
      ) {
        return;
      }

      // Check if there's a space (or newline/end) after the #
      if (charAfterHash !== ' ' && charAfterHash !== '\n' && charAfterHash !== '\r' && charAfterHash !== '\0') {
        const column = comment.columnNo + (textStart - comment.pointer);
        yield new LintProblem(
          comment.lineNo,
          column,
          'missing starting space in comment'
        );
      }
    }
  }
}

const rule: Rule = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check: check as Rule['check'],
};

export default rule;
