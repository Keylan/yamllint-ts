/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: hyphens
 *
 * Control the number of spaces after hyphens.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';
import { spacesAfter } from './common.js';

export const ID = 'hyphens';
export const TYPE = 'token' as const;

export const CONF = {
  'max-spaces-after': Number,
};

export const DEFAULT = {
  'max-spaces-after': 1,
};

export function* check(
  conf: RuleConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  _context: Record<string, unknown>
): Generator<LintProblem> {
  const maxSpacesAfter = conf['max-spaces-after'] as number;

  if (token.type === TokenType.BlockEntry) {
    const problem = spacesAfter(token, prev, next, {
      max: maxSpacesAfter,
      maxDesc: 'too many spaces after hyphen',
    });
    if (problem) yield problem;
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
