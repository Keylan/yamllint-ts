/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: key-duplicates
 *
 * Prevent multiple entries with the same key in mappings.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenRule, type BaseRuleConfig, type BaseRuleContext, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'key-duplicates';
export const TYPE = 'token' as const;

export const CONF = {
  'forbid-duplicated-merge-keys': Boolean,
};

export const DEFAULT = {
  'forbid-duplicated-merge-keys': false,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the key-duplicates rule */
export interface KeyDuplicatesConfig extends BaseRuleConfig {
  'forbid-duplicated-merge-keys': boolean;
}

// Type constants for tracking context
const MAP = 0;
const SEQ = 1;

interface Parent {
  type: number;
  keys: string[];
}

/** Typed context for the key-duplicates rule */
export interface KeyDuplicatesContext extends BaseRuleContext {
  stack: Parent[];
}

/** Factory to create initial context */
export function createContext(): KeyDuplicatesContext {
  return { stack: [] };
}

/**
 * Normalize a key value for comparison.
 * - Remove surrounding quotes from single/double quoted strings
 * - Normalize whitespace in block scalars
 */
function normalizeKeyValue(value: string | undefined): string {
  if (!value) return '';

  // Check for double quoted strings
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  // Check for single quoted strings
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  // Normalize block scalar content (remove leading indentation and collapse lines)
  // Block scalars start with leading whitespace on continuation lines
  if (value.includes('\n')) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(' ');
  }

  return value;
}

export function* check(
  conf: KeyDuplicatesConfig,
  token: TokenWithMarks,
  _prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  context: KeyDuplicatesContext
): Generator<LintProblem> {
  const stack = context.stack;

  // Track mapping and sequence starts
  if (
    token.type === TokenType.BlockMappingStart ||
    token.type === TokenType.FlowMappingStart
  ) {
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
  } else if (token.type === TokenType.Key) {
    // Key token - check for duplicates
    // This check is done because KeyTokens can be found inside flow
    // sequences... strange, but allowed.
    //
    // Patterns to handle:
    // 1. KeyToken + ScalarToken (normal key)
    // 2. KeyToken("?") + KeyToken + ScalarToken (explicit key with block scalar)
    
    let keyScalar: TokenWithMarks | null = null;
    
    if (next?.type === TokenType.Scalar) {
      // Normal key: KeyToken + ScalarToken
      keyScalar = next;
    } else if (next?.type === TokenType.Key && nextnext?.type === TokenType.Scalar) {
      // Explicit key pattern: KeyToken("?") + KeyToken + ScalarToken
      // Skip this first KeyToken("?") - we'll handle it when we see the second KeyToken
      return;
    }
    
    if (keyScalar && stack.length > 0 && stack[stack.length - 1]!.type === MAP) {
      const parent = stack[stack.length - 1]!;
      const keyValue = normalizeKeyValue(keyScalar.value);

      // Check if key already exists
      // `<<` is "merge key", see http://yaml.org/type/merge.html
      if (
        parent.keys.includes(keyValue) &&
        (keyValue !== '<<' || conf['forbid-duplicated-merge-keys'])
      ) {
        yield new LintProblem(
          keyScalar.startMark.line + 1,
          keyScalar.startMark.column + 1,
          `duplication of key "${keyValue}" in mapping`
        );
      } else {
        parent.keys.push(keyValue);
      }
    }
  }
}

const rule: TokenRule<KeyDuplicatesConfig, KeyDuplicatesContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
