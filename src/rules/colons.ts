/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: colons
 *
 * Control the number of spaces before and after colons.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';
import { spacesAfter, spacesBefore, isExplicitKey } from './common.js';

export const ID = 'colons';
export const TYPE = 'token' as const;

export const CONF = {
  'max-spaces-before': Number,
  'max-spaces-after': Number,
};

export const DEFAULT = {
  'max-spaces-before': 0,
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
  const maxSpacesBefore = conf['max-spaces-before'] as number;
  const maxSpacesAfter = conf['max-spaces-after'] as number;

  // Check ValueToken (the colon after a key)
  if (token.type === TokenType.Value) {
    // Exception: don't check if preceded by alias token with no space
    // (e.g., *alias: value)
    const isAfterAlias =
      prev?.type === TokenType.Alias &&
      token.startMark.pointer - prev.endMark.pointer === 1;

    if (!isAfterAlias) {
      const problem = spacesBefore(token, prev, next, {
        max: maxSpacesBefore,
        maxDesc: 'too many spaces before colon',
      });
      if (problem) yield problem;

      const problemAfter = spacesAfter(token, prev, next, {
        max: maxSpacesAfter,
        maxDesc: 'too many spaces after colon',
      });
      if (problemAfter) yield problemAfter;
    }
  }

  // Check explicit key (question mark)
  if (token.type === TokenType.Key && isExplicitKey(token)) {
    const problem = spacesAfter(token, prev, next, {
      max: maxSpacesAfter,
      maxDesc: 'too many spaces after question mark',
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
