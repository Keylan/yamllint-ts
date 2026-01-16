/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: empty-values
 *
 * Prevent nodes with empty content, that implicitly result in null values.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'empty-values';
export const TYPE = 'token' as const;

export const CONF = {
  'forbid-in-block-mappings': Boolean,
  'forbid-in-flow-mappings': Boolean,
  'forbid-in-block-sequences': Boolean,
};

export const DEFAULT = {
  'forbid-in-block-mappings': true,
  'forbid-in-flow-mappings': true,
  'forbid-in-block-sequences': true,
};

export function* check(
  conf: RuleConfig,
  token: TokenWithMarks,
  _prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  _context: Record<string, unknown>
): Generator<LintProblem> {
  if (conf['forbid-in-block-mappings']) {
    // Empty value in block mapping: value followed by key or block end
    if (
      token.type === TokenType.Value &&
      (next?.type === TokenType.Key || next?.type === TokenType.BlockEnd)
    ) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.endMark.column + 1,
        'empty value in block mapping'
      );
    }
  }

  if (conf['forbid-in-flow-mappings']) {
    // Empty value in flow mapping: value followed by flow entry or flow mapping end
    // Note: Our parser sometimes emits an empty ScalarToken between ValueToken and
    // FlowEntryToken/FlowMappingEndToken, so we need to check for that too.
    // Also: For multi-line flow mappings, our parser may emit BlockEndToken before
    // FlowMappingEndToken, so we check for that pattern as well.
    if (token.type === TokenType.Value) {
      if (next?.type === TokenType.FlowEntry || next?.type === TokenType.FlowMappingEnd) {
        yield new LintProblem(
          token.startMark.line + 1,
          token.endMark.column + 1,
          'empty value in flow mapping'
        );
      } else if (
        next?.type === TokenType.Scalar &&
        next.value === '' &&
        (nextnext?.type === TokenType.FlowEntry || nextnext?.type === TokenType.FlowMappingEnd)
      ) {
        // Empty scalar followed by FlowEntry or FlowMappingEnd is also an empty value
        yield new LintProblem(
          token.startMark.line + 1,
          token.endMark.column + 1,
          'empty value in flow mapping'
        );
      } else if (next?.type === TokenType.BlockEnd && nextnext?.type === TokenType.FlowMappingEnd) {
        // Multi-line flow mapping: BlockEnd followed by FlowMappingEnd indicates empty value
        yield new LintProblem(
          token.startMark.line + 1,
          token.endMark.column + 1,
          'empty value in flow mapping'
        );
      }
    }
  }

  if (conf['forbid-in-block-sequences']) {
    // Empty value in block sequence: block entry followed by key, block end, or another block entry
    if (
      token.type === TokenType.BlockEntry &&
      (next?.type === TokenType.Key ||
        next?.type === TokenType.BlockEnd ||
        next?.type === TokenType.BlockEntry)
    ) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.endMark.column + 1,
        'empty value in block sequence'
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
