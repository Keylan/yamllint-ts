/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: brackets
 *
 * Control the use of flow sequences or number of spaces inside brackets.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenRule, type BaseRuleConfig, type BaseRuleContext, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';
import { spacesAfter, spacesBefore } from './common.js';

export const ID = 'brackets';
export const TYPE = 'token' as const;

export const CONF = {
  forbid: [false, true, 'non-empty'],
  'min-spaces-inside': Number,
  'max-spaces-inside': Number,
  'min-spaces-inside-empty': Number,
  'max-spaces-inside-empty': Number,
};

export const DEFAULT = {
  forbid: false,
  'min-spaces-inside': 0,
  'max-spaces-inside': 0,
  'min-spaces-inside-empty': -1,
  'max-spaces-inside-empty': -1,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the brackets rule */
export interface BracketsConfig extends BaseRuleConfig {
  forbid: boolean | 'non-empty';
  'min-spaces-inside': number;
  'max-spaces-inside': number;
  'min-spaces-inside-empty': number;
  'max-spaces-inside-empty': number;
}

/** Typed context for the brackets rule (stateless) */
export type BracketsContext = BaseRuleContext;

/**
 * Check if the next meaningful token after a FlowSequenceStart is FlowSequenceEnd.
 * This skips over BlockEnd tokens which can appear between [ and ] when brackets span multiple lines.
 */
function isEmptyFlowSequence(next: TokenWithMarks | null, nextnext: TokenWithMarks | null): boolean {
  if (next?.type === TokenType.FlowSequenceEnd) {
    return true;
  }
  // When brackets span multiple lines, a BlockEnd token may appear between [ and ]
  if (next?.type === TokenType.BlockEnd && nextnext?.type === TokenType.FlowSequenceEnd) {
    return true;
  }
  return false;
}

export function* check(
  conf: BracketsConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  _context: BracketsContext
): Generator<LintProblem> {
  const forbid = conf['forbid'];
  const minSpacesInside = conf['min-spaces-inside'];
  const maxSpacesInside = conf['max-spaces-inside'];
  const minSpacesInsideEmpty = conf['min-spaces-inside-empty'];
  const maxSpacesInsideEmpty = conf['max-spaces-inside-empty'];

  if (forbid === true && token.type === TokenType.FlowSequenceStart) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.endMark.column + 1,
      'forbidden flow sequence'
    );
  } else if (
    forbid === 'non-empty' &&
    token.type === TokenType.FlowSequenceStart &&
    !isEmptyFlowSequence(next, nextnext)
  ) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.endMark.column + 1,
      'forbidden flow sequence'
    );
  } else if (
    token.type === TokenType.FlowSequenceStart &&
    isEmptyFlowSequence(next, nextnext)
  ) {
    // Empty brackets - find the actual FlowSequenceEnd token for spacing check
    const endToken = next?.type === TokenType.FlowSequenceEnd ? next : nextnext;
    const problem = spacesAfter(token, prev, endToken, {
      min: minSpacesInsideEmpty !== -1 ? minSpacesInsideEmpty : minSpacesInside,
      max: maxSpacesInsideEmpty !== -1 ? maxSpacesInsideEmpty : maxSpacesInside,
      minDesc: 'too few spaces inside empty brackets',
      maxDesc: 'too many spaces inside empty brackets',
    });
    if (problem) yield problem;
  } else if (token.type === TokenType.FlowSequenceStart) {
    const problem = spacesAfter(token, prev, next, {
      min: minSpacesInside,
      max: maxSpacesInside,
      minDesc: 'too few spaces inside brackets',
      maxDesc: 'too many spaces inside brackets',
    });
    if (problem) yield problem;
  } else if (
    token.type === TokenType.FlowSequenceEnd &&
    prev?.type !== TokenType.FlowSequenceStart
  ) {
    const problem = spacesBefore(token, prev, next, {
      min: minSpacesInside,
      max: maxSpacesInside,
      minDesc: 'too few spaces inside brackets',
      maxDesc: 'too many spaces inside brackets',
    });
    if (problem) yield problem;
  }
}

const rule: TokenRule<BracketsConfig, BracketsContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
};

export default rule;
