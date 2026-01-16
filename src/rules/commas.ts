/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: commas
 *
 * Control the number of spaces before and after commas.
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

export const ID = 'commas';
export const TYPE = 'token' as const;

export const CONF = {
  'max-spaces-before': Number,
  'min-spaces-after': Number,
  'max-spaces-after': Number,
};

export const DEFAULT = {
  'max-spaces-before': 0,
  'min-spaces-after': 1,
  'max-spaces-after': 1,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the commas rule */
export interface CommasConfig extends BaseRuleConfig {
  'max-spaces-before': number;
  'min-spaces-after': number;
  'max-spaces-after': number;
}

/** Typed context for the commas rule */
export interface CommasContext extends BaseRuleContext {
  lastNonEmptyToken?: TokenWithMarks;
}

/** Factory to create initial context */
export function createContext(): CommasContext {
  return {};
}

export function* check(
  conf: CommasConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  context: CommasContext
): Generator<LintProblem> {
  const maxSpacesBefore = conf['max-spaces-before'];
  const minSpacesAfter = conf['min-spaces-after'];
  const maxSpacesAfter = conf['max-spaces-after'];

  // Track previous non-empty token for accurate space detection
  // Our parser sometimes emits empty ScalarTokens that Python's doesn't
  if (prev !== null && !(prev.type === TokenType.Scalar && prev.value === '')) {
    context.lastNonEmptyToken = prev;
  }

  if (token.type === TokenType.FlowEntry) {
    // Use the last non-empty token for space calculation if prev is empty scalar
    let effectivePrev = prev;
    if (prev?.type === TokenType.Scalar && prev.value === '' && context.lastNonEmptyToken) {
      effectivePrev = context.lastNonEmptyToken;
    }

    // Special case: comma on a different line than the previous token
    if (
      effectivePrev !== null &&
      maxSpacesBefore !== -1 &&
      effectivePrev.endMark.line < token.startMark.line
    ) {
      yield new LintProblem(
        token.startMark.line + 1,
        Math.max(1, token.startMark.column),
        'too many spaces before comma'
      );
    } else {
      const problem = spacesBefore(token, effectivePrev, next, {
        max: maxSpacesBefore,
        maxDesc: 'too many spaces before comma',
      });
      if (problem) yield problem;
    }

    const problemAfter = spacesAfter(token, prev, next, {
      min: minSpacesAfter,
      max: maxSpacesAfter,
      minDesc: 'too few spaces after comma',
      maxDesc: 'too many spaces after comma',
    });
    if (problemAfter) yield problemAfter;
  }
}

const rule: TokenRule<CommasConfig, CommasContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
