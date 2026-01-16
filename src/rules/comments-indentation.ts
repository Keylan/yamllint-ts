/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: comments-indentation
 *
 * Force comments to be indented like content.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Comment } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'comments-indentation';
export const TYPE = 'comment' as const;

export const CONF = {};
export const DEFAULT = {};

/**
 * Get the indentation of the line containing a token.
 */
function getLineIndent(token: { startMark: { buffer: string; pointer: number } }): number {
  const buffer = token.startMark.buffer;
  const pointer = token.startMark.pointer;

  // Find the start of the line
  let lineStart = buffer.lastIndexOf('\n', pointer - 1);
  lineStart = lineStart === -1 ? 0 : lineStart + 1;

  // Count spaces at start of line
  let indent = 0;
  while (lineStart + indent < buffer.length && buffer[lineStart + indent] === ' ') {
    indent++;
  }

  return indent;
}

export function* check(_conf: RuleConfig, comment: Comment): Generator<LintProblem> {
  // Only check block comments (not inline comments)
  // An inline comment is on the same line as the token before it
  if (comment.tokenBefore && comment.tokenBefore.type !== TokenType.StreamStart) {
    // Check if comment is on the same line as the token before
    if (comment.tokenBefore.endMark.line + 1 === comment.lineNo) {
      return; // This is an inline comment, skip
    }
  }

  // Determine valid indents
  let nextLineIndent = 0;
  if (comment.tokenAfter) {
    if (comment.tokenAfter.type === TokenType.StreamEnd) {
      nextLineIndent = 0;
    } else {
      nextLineIndent = comment.tokenAfter.startMark.column;
    }
  }

  let prevLineIndent = 0;
  if (comment.tokenBefore && comment.tokenBefore.type !== TokenType.StreamStart) {
    prevLineIndent = getLineIndent(comment.tokenBefore);
  }

  // In some cases only the next line indent is valid:
  //     list:
  //         # comment
  //         - 1
  //         - 2
  prevLineIndent = Math.max(prevLineIndent, nextLineIndent);

  // If a previous comment went back to normal indent, subsequent comments should too
  // This avoids:
  //     list:
  //         - 1
  //     # comment on valid indent (0)
  //         # comment on valid indent (4)  <- this should be invalid
  //     other-list:
  //         - 2
  if (comment.commentBefore && !comment.commentBefore.isInline()) {
    prevLineIndent = comment.commentBefore.columnNo - 1;
  }

  const commentIndent = comment.columnNo - 1;

  if (commentIndent !== prevLineIndent && commentIndent !== nextLineIndent) {
    yield new LintProblem(comment.lineNo, comment.columnNo, 'comment not indented like content');
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
