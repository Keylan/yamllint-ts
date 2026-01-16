/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: document-end
 *
 * Require or forbid the use of document end marker (...).
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'document-end';
export const TYPE = 'token' as const;

export const CONF = {
  present: Boolean,
};

export const DEFAULT = {
  present: true,
};

export function* check(
  conf: RuleConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  _context: Record<string, unknown>
): Generator<LintProblem> {
  const present = conf['present'] as boolean;

  if (present) {
    // Document end is required
    const isStreamEnd = token.type === TokenType.StreamEnd;
    const isStart = token.type === TokenType.DocumentStart;
    const prevIsEndOrStreamStart =
      prev?.type === TokenType.DocumentEnd || prev?.type === TokenType.StreamStart;
    const prevIsDirective = prev?.type === TokenType.Directive;

    if (isStreamEnd && !prevIsEndOrStreamStart) {
      yield new LintProblem(token.startMark.line, 1, 'missing document end "..."');
    } else if (isStart && !prevIsEndOrStreamStart && !prevIsDirective) {
      yield new LintProblem(token.startMark.line + 1, 1, 'missing document end "..."');
    }
  } else {
    // Document end is forbidden
    if (token.type === TokenType.DocumentEnd) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.startMark.column + 1,
        'found forbidden document end "..."'
      );
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
