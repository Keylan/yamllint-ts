/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: braces
 *
 * Control the use of flow mappings or number of spaces inside braces.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import {
  LintProblem,
  type TokenRule,
  type BaseRuleConfig,
  type BaseRuleContext,
  type TokenWithMarks,
} from '../types.js';
import { TokenType } from '../parser.js';
import { spacesAfter, spacesBefore } from './common.js';

export const ID = 'braces';
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

/** Typed configuration for the braces rule */
export interface BracesConfig extends BaseRuleConfig {
  forbid: boolean | 'non-empty';
  'min-spaces-inside': number;
  'max-spaces-inside': number;
  'min-spaces-inside-empty': number;
  'max-spaces-inside-empty': number;
}

/** Typed context for the braces rule (stateless) */
export type BracesContext = BaseRuleContext;

/**
 * Check if the next meaningful token after a FlowMappingStart is FlowMappingEnd.
 * This skips over BlockEnd tokens which can appear between { and } when braces span multiple lines.
 */
function isEmptyFlowMapping(next: TokenWithMarks | null, nextnext: TokenWithMarks | null): boolean {
  if (next?.type === TokenType.FlowMappingEnd) {
    return true;
  }
  // When braces span multiple lines, a BlockEnd token may appear between { and }
  if (next?.type === TokenType.BlockEnd && nextnext?.type === TokenType.FlowMappingEnd) {
    return true;
  }
  return false;
}

export function* check(
  conf: BracesConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  _context: BracesContext
): Generator<LintProblem> {
  const forbid = conf['forbid'];
  const minSpacesInside = conf['min-spaces-inside'];
  const maxSpacesInside = conf['max-spaces-inside'];
  const minSpacesInsideEmpty = conf['min-spaces-inside-empty'];
  const maxSpacesInsideEmpty = conf['max-spaces-inside-empty'];

  if (forbid === true && token.type === TokenType.FlowMappingStart) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.endMark.column + 1,
      'forbidden flow mapping'
    );
  } else if (
    forbid === 'non-empty' &&
    token.type === TokenType.FlowMappingStart &&
    !isEmptyFlowMapping(next, nextnext)
  ) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.endMark.column + 1,
      'forbidden flow mapping'
    );
  } else if (token.type === TokenType.FlowMappingStart && isEmptyFlowMapping(next, nextnext)) {
    // Empty braces - find the actual FlowMappingEnd token for spacing check
    const endToken = next?.type === TokenType.FlowMappingEnd ? next : nextnext;
    const problem = spacesAfter(token, prev, endToken, {
      min: minSpacesInsideEmpty !== -1 ? minSpacesInsideEmpty : minSpacesInside,
      max: maxSpacesInsideEmpty !== -1 ? maxSpacesInsideEmpty : maxSpacesInside,
      minDesc: 'too few spaces inside empty braces',
      maxDesc: 'too many spaces inside empty braces',
    });
    if (problem) yield problem;
  } else if (token.type === TokenType.FlowMappingStart) {
    const problem = spacesAfter(token, prev, next, {
      min: minSpacesInside,
      max: maxSpacesInside,
      minDesc: 'too few spaces inside braces',
      maxDesc: 'too many spaces inside braces',
    });
    if (problem) yield problem;
  } else if (token.type === TokenType.FlowMappingEnd && prev?.type !== TokenType.FlowMappingStart) {
    const problem = spacesBefore(token, prev, next, {
      min: minSpacesInside,
      max: maxSpacesInside,
      minDesc: 'too few spaces inside braces',
      maxDesc: 'too many spaces inside braces',
    });
    if (problem) yield problem;
  }
}

const rule: TokenRule<BracesConfig, BracesContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
};

export default rule;
