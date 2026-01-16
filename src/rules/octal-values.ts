/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: octal-values
 *
 * Prevent values with octal numbers.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'octal-values';
export const TYPE = 'token' as const;

export const CONF = {
  'forbid-implicit-octal': Boolean,
  'forbid-explicit-octal': Boolean,
};

export const DEFAULT = {
  'forbid-implicit-octal': true,
  'forbid-explicit-octal': true,
};

// Pattern to match octal digits (0-7)
const IS_OCTAL_NUMBER_PATTERN = /^[0-7]+$/;

/**
 * Check if a scalar is unquoted (plain style).
 */
function isUnquotedScalar(token: TokenWithMarks): boolean {
  if (token.type !== TokenType.Scalar) {
    return false;
  }
  const value = token.value ?? '';
  // Plain scalars don't start with quotes or literal/folded indicators
  if (value.startsWith("'") || value.startsWith('"') ||
      value.startsWith('|') || value.startsWith('>')) {
    return false;
  }
  return true;
}

export function* check(
  conf: RuleConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  _context: Record<string, unknown>
): Generator<LintProblem> {
  // Skip if previous token is a tag (explicit typing)
  if (prev?.type === TokenType.Tag) {
    return;
  }

  // Only check unquoted scalars
  if (!isUnquotedScalar(token)) {
    return;
  }

  const val = token.value ?? '';

  if (conf['forbid-implicit-octal']) {
    // Implicit octal: starts with 0, followed by digits, all octal (0-7)
    // Must be at least 2 characters (e.g., "00", "01", "010")
    if (
      val.length > 1 &&
      val[0] === '0' &&
      /^\d+$/.test(val) &&
      IS_OCTAL_NUMBER_PATTERN.test(val.slice(1))
    ) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.endMark.column + 1,
        `forbidden implicit octal value "${val}"`
      );
    }
  }

  if (conf['forbid-explicit-octal']) {
    // Explicit octal: starts with 0o followed by octal digits
    if (
      val.length > 2 &&
      val.slice(0, 2) === '0o' &&
      IS_OCTAL_NUMBER_PATTERN.test(val.slice(2))
    ) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.endMark.column + 1,
        `forbidden explicit octal value "${val}"`
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
