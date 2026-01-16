/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: document-start
 *
 * Require or forbid the use of document start marker (---).
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'document-start';
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
    // Document start is required
    const prevIsStreamStartOrDocEnd =
      prev?.type === TokenType.StreamStart ||
      prev?.type === TokenType.DocumentEnd ||
      prev?.type === TokenType.Directive;

    const tokenIsDocStartOrDirectiveOrStreamEnd =
      token.type === TokenType.DocumentStart ||
      token.type === TokenType.Directive ||
      token.type === TokenType.StreamEnd;

    if (prevIsStreamStartOrDocEnd && !tokenIsDocStartOrDirectiveOrStreamEnd) {
      yield new LintProblem(token.startMark.line + 1, 1, 'missing document start "---"');
    }
  } else {
    // Document start is forbidden
    if (token.type === TokenType.DocumentStart) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.startMark.column + 1,
        'found forbidden document start "---"'
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
