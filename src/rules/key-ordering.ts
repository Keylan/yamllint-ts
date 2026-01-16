/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: key-ordering
 *
 * Enforce alphabetical ordering of keys in mappings.
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

export const ID = 'key-ordering';
export const TYPE = 'token' as const;

export const CONF = {
  'ignored-keys': [String],
};

export const DEFAULT = {
  'ignored-keys': [] as string[],
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the key-ordering rule */
export interface KeyOrderingConfig extends BaseRuleConfig {
  'ignored-keys': string[];
}

// Type constants for tracking context
const MAP = 0;
const SEQ = 1;

interface Parent {
  type: number;
  keys: string[];
}

/** Typed context for the key-ordering rule */
export interface KeyOrderingContext extends BaseRuleContext {
  stack: Parent[];
}

/** Factory to create initial context */
export function createContext(): KeyOrderingContext {
  return { stack: [] };
}

/**
 * Compare two strings for sorting order.
 * Uses simple byte-order (ASCII/Unicode code point) comparison to match Python's
 * string comparison behavior. This means uppercase letters come before lowercase.
 */
function stringCompare(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function* check(
  conf: KeyOrderingConfig,
  token: TokenWithMarks,
  _prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  context: KeyOrderingContext
): Generator<LintProblem> {
  const stack = context.stack;
  const ignoredKeys = conf['ignored-keys'];

  // Track mapping and sequence starts
  if (token.type === TokenType.BlockMappingStart || token.type === TokenType.FlowMappingStart) {
    stack.push({ type: MAP, keys: [] });
  } else if (
    token.type === TokenType.BlockSequenceStart ||
    token.type === TokenType.FlowSequenceStart
  ) {
    stack.push({ type: SEQ, keys: [] });
  } else if (
    token.type === TokenType.BlockEnd ||
    token.type === TokenType.FlowMappingEnd ||
    token.type === TokenType.FlowSequenceEnd
  ) {
    // Pop from stack
    if (stack.length > 0) {
      stack.pop();
    }
  } else if (token.type === TokenType.Key && next?.type === TokenType.Scalar) {
    // Key token followed by scalar - check ordering
    // This check is done because KeyTokens can be found inside flow
    // sequences... strange, but allowed.
    if (stack.length > 0 && stack[stack.length - 1]!.type === MAP) {
      const keyValue = next.value ?? '';

      // Check if key matches any ignored pattern
      const isIgnored = ignoredKeys.some((pattern) => {
        try {
          return new RegExp(pattern).test(keyValue);
        } catch {
          return false;
        }
      });

      if (!isIgnored) {
        const parent = stack[stack.length - 1]!;

        // Check if any existing key should come after this one
        const isOutOfOrder = parent.keys.some(
          (existingKey) => stringCompare(keyValue, existingKey) < 0
        );

        if (isOutOfOrder) {
          yield new LintProblem(
            next.startMark.line + 1,
            next.startMark.column + 1,
            `wrong ordering of key "${keyValue}" in mapping`
          );
        } else {
          parent.keys.push(keyValue);
        }
      }
    }
  }
}

const rule: TokenRule<KeyOrderingConfig, KeyOrderingContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
