/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: quoted-strings
 *
 * Forbid any string values that are not quoted, or to prevent quoted strings
 * without needing it.
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

export const ID = 'quoted-strings';
export const TYPE = 'token' as const;

export const CONF = {
  'quote-type': ['any', 'single', 'double', 'consistent'],
  required: [true, false, 'only-when-needed'],
  'extra-required': [String],
  'extra-allowed': [String],
  'allow-quoted-quotes': Boolean,
  'check-keys': Boolean,
};

export const DEFAULT = {
  'quote-type': 'any',
  required: true,
  'extra-required': [] as string[],
  'extra-allowed': [] as string[],
  'allow-quoted-quotes': false,
  'check-keys': false,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the quoted-strings rule */
export interface QuotedStringsConfig extends BaseRuleConfig {
  'quote-type': 'any' | 'single' | 'double' | 'consistent';
  required: boolean | 'only-when-needed';
  'extra-required': string[];
  'extra-allowed': string[];
  'allow-quoted-quotes': boolean;
  'check-keys': boolean;
}

/** Typed context for the quoted-strings rule */
export interface QuotedStringsContext extends BaseRuleContext {
  flow_nest_count: number;
  pending_tag: string | null;
  quoted_strings_consistent_token_style?: string;
}

/** Factory to create initial context */
export function createContext(): QuotedStringsContext {
  return { flow_nest_count: 0, pending_tag: null };
}

/**
 * Check if a token style matches the required quote type.
 */
function quoteMatch(
  quoteType: string,
  tokenStyle: string | null,
  context: QuotedStringsContext
): boolean {
  if (quoteType === 'consistent' && tokenStyle !== null) {
    // The canonical token style is assumed to be the first one found
    if (!context.quoted_strings_consistent_token_style) {
      context.quoted_strings_consistent_token_style = tokenStyle;
    }
    return context.quoted_strings_consistent_token_style === tokenStyle;
  }

  return (
    quoteType === 'any' ||
    (quoteType === 'single' && tokenStyle === "'") ||
    (quoteType === 'double' && tokenStyle === '"')
  );
}

/**
 * Check if the token has quoted quotes (e.g., single-quoted string containing double quotes).
 */
function hasQuotedQuotes(value: string, style: string | null): boolean {
  if (!style) return false;
  return (style === "'" && value.includes('"')) || (style === '"' && value.includes("'"));
}

/**
 * Get the quote style from a token value.
 */
function getQuoteStyle(value: string): string | null {
  if (value.startsWith("'")) return "'";
  if (value.startsWith('"')) return '"';
  return null;
}

/**
 * Get the inner value of a quoted string.
 */
function getInnerValue(value: string, style: string | null): string {
  if (!style) return value;
  if (value.length < 2) return value;
  return value.slice(1, -1);
}

/**
 * Check if a double-quoted string has backslash line continuation.
 * This is only meaningful for double-quoted strings (escape sequences).
 */
function hasBackslashLineContinuation(tokenValue: string, quoteStyle: string | null): boolean {
  if (quoteStyle !== '"') return false;
  // Check if there's a backslash followed by a newline in the content
  // The tokenValue includes the quotes, so check inner content
  const inner = tokenValue.slice(1, -1);
  return /\\\n|\\\r\n/.test(inner);
}

/**
 * Check if value would need quotes to be valid YAML.
 * This is a simplified version - the Python yamllint uses the actual YAML parser
 * to check if unquoted value would parse correctly.
 */
function quotesAreNeeded(value: string, isInsideFlow: boolean): boolean {
  // Empty string needs quotes
  if (value === '') return true;

  // Values that start with special characters need quotes
  // Note: % is reserved for directives
  if (/^[&*!|>%@`]/.test(value)) return true;

  // Values that start with flow indicators need quotes (would be interpreted as flow collection)
  if (/^[[{]/.test(value)) return true;

  // Values containing flow indicators inside a flow context need quotes
  if (isInsideFlow && /[,[\]{}]/.test(value)) return true;

  // Values that start with quotes need quotes
  if (/^['"]/.test(value)) return true;

  // Values containing colons followed by space need quotes (mapping indicator)
  if (/: /.test(value) || value.endsWith(':')) return true;

  // Values containing hash preceded by space (comment indicator) need quotes
  if (/ #/.test(value)) return true;

  // Values that look like numbers, booleans, etc. need quotes to preserve string type
  if (/^(true|false|yes|no|on|off|null|~)$/i.test(value)) return true;
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(value)) return true;

  // Values starting with block entry indicator need quotes
  // "- item" needs quotes because "- " at start is block entry
  if (/^- /.test(value) || value === '-') return true;

  // Values starting with explicit key indicator need quotes
  if (/^\? /.test(value) || value === '?') return true;

  return false;
}

export function* check(
  conf: QuotedStringsConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  context: QuotedStringsContext
): Generator<LintProblem> {
  if (token.type === TokenType.FlowMappingStart || token.type === TokenType.FlowSequenceStart) {
    context.flow_nest_count++;
  } else if (token.type === TokenType.FlowMappingEnd || token.type === TokenType.FlowSequenceEnd) {
    context.flow_nest_count--;
  }

  // Track the most recent tag for each key/value context
  // Our parser emits tags BEFORE the BlockMappingStartToken/KeyToken, while Python emits AFTER
  // So we need to track tags and apply them to the next scalar
  if (token.type === TokenType.Tag) {
    context.pending_tag = token.value ?? null;
    return;
  }

  // Only check scalar tokens
  if (token.type !== TokenType.Scalar) {
    // Clear pending tag if we see a non-scalar, non-key structure token
    // (except for BlockMappingStart and KeyToken which come between tag and scalar)
    if (
      token.type !== TokenType.BlockMappingStart &&
      token.type !== TokenType.Key &&
      token.type !== TokenType.FlowMappingStart
    ) {
      context.pending_tag = null;
    }
    return;
  }

  // Check if previous token is a valid context
  const validPrevTypes: string[] = [
    TokenType.BlockEntry,
    TokenType.FlowEntry,
    TokenType.FlowSequenceStart,
    TokenType.Tag,
    TokenType.Value,
    TokenType.Key,
  ];

  if (!prev || !validPrevTypes.includes(prev.type)) {
    context.pending_tag = null;
    return;
  }

  // Determine if this is a key or value
  const node = prev.type === TokenType.Key ? 'key' : 'value';
  if (node === 'key' && !conf['check-keys']) {
    context.pending_tag = null;
    return;
  }

  // Ignore explicit types (!!str, !!int, etc.)
  // Check both prev (for Python-style token order) and pending_tag (for our parser's order)
  const pendingTag = context.pending_tag;
  if (prev.type === TokenType.Tag && prev.value?.startsWith('!!')) {
    context.pending_tag = null;
    return;
  }
  if (pendingTag && pendingTag.startsWith('!!')) {
    context.pending_tag = null;
    return;
  }
  context.pending_tag = null;

  const tokenValue = token.value ?? '';
  const quoteStyle = getQuoteStyle(tokenValue);
  const innerValue = getInnerValue(tokenValue, quoteStyle);

  // Ignore block scalars (| or >) - they have style 'block'
  // Block scalars are always unquoted but should not trigger quoted-strings errors
  if (token.style === 'block') {
    return;
  }

  // Skip unquoted values that are non-string types (number, boolean, null)
  // These are not "strings" so the quoted-strings rule doesn't apply
  if (!quoteStyle) {
    // Check if it's a boolean, null, or special value
    if (/^(true|false|yes|no|on|off|null|~)$/i.test(tokenValue)) {
      return;
    }
    // Check if it's a valid number
    // Regular integers (including 0)
    if (/^[-+]?[0-9]+$/.test(tokenValue)) {
      // Check if it looks like an octal (starts with 0 followed by more digits)
      if (/^[-+]?0[0-9]+$/.test(tokenValue)) {
        // In YAML 1.1 style (which yamllint uses), 0-prefixed numbers are octal
        // Valid octal: only digits 0-7
        // If it contains 8 or 9, it's a string that needs quotes
        if (/[89]/.test(tokenValue)) {
          // Not a valid octal, treat as string - don't return, continue checking
        } else {
          return; // Valid YAML 1.1 octal number
        }
      } else {
        return; // Valid integer (no leading zeros issue)
      }
    }
    // Check floats
    if (/^[-+]?(\d+\.\d*|\d*\.\d+)([eE][-+]?\d+)?$/.test(tokenValue)) {
      return; // Valid float
    }
    if (/^[-+]?\d+[eE][-+]?\d+$/.test(tokenValue)) {
      return; // Scientific notation
    }
    // Check for valid hex (0x prefix)
    if (/^0x[0-9a-fA-F]+$/.test(tokenValue)) {
      return;
    }
    // Check for valid explicit octal (0o prefix with valid octal digits 0-7 only)
    if (/^0o[0-7]+$/.test(tokenValue)) {
      return;
    }
    // 0o with invalid digits (8, 9) is a string
    // Check for infinity, NaN
    if (/^[-+]?(\.inf|\.nan)$/i.test(tokenValue)) {
      return;
    }
  }

  const quoteType = conf['quote-type'];
  const required = conf['required'];
  const extraRequired = conf['extra-required'];
  const extraAllowed = conf['extra-allowed'];
  const allowQuotedQuotes = conf['allow-quoted-quotes'];

  let msg: string | null = null;

  if (required === true) {
    // Quotes are mandatory and need to match config
    if (
      quoteStyle === null ||
      !(
        quoteMatch(quoteType, quoteStyle, context) ||
        (allowQuotedQuotes && hasQuotedQuotes(innerValue, quoteStyle))
      )
    ) {
      msg = `string ${node} is not quoted with ${quoteType} quotes`;
    }
  } else if (required === false) {
    // Quotes are not mandatory but when used need to match config
    if (
      quoteStyle &&
      !quoteMatch(quoteType, quoteStyle, context) &&
      !(allowQuotedQuotes && hasQuotedQuotes(innerValue, quoteStyle))
    ) {
      msg = `string ${node} is not quoted with ${quoteType} quotes`;
    } else if (!quoteStyle) {
      // Check extra-required patterns
      const isExtraRequired = extraRequired.some((pattern) => {
        try {
          return new RegExp(pattern).test(tokenValue);
        } catch {
          return false;
        }
      });
      if (isExtraRequired) {
        msg = `string ${node} is not quoted`;
      }
    }
  } else if (required === 'only-when-needed') {
    // Quotes are not strictly needed
    const isInsideFlow = context.flow_nest_count > 0;
    // Double-quoted strings with backslash line continuation need quotes
    const needsBackslashEscape = hasBackslashLineContinuation(tokenValue, quoteStyle);
    if (
      quoteStyle &&
      innerValue &&
      !quotesAreNeeded(innerValue, isInsideFlow) &&
      !needsBackslashEscape
    ) {
      const isExtraRequired = extraRequired.some((pattern) => {
        try {
          return new RegExp(pattern).test(innerValue);
        } catch {
          return false;
        }
      });
      const isExtraAllowed = extraAllowed.some((pattern) => {
        try {
          return new RegExp(pattern).test(innerValue);
        } catch {
          return false;
        }
      });
      if (!isExtraRequired && !isExtraAllowed) {
        msg = `string ${node} is redundantly quoted with ${quoteType} quotes`;
      }
    } else if (
      quoteStyle &&
      !quoteMatch(quoteType, quoteStyle, context) &&
      !(allowQuotedQuotes && hasQuotedQuotes(innerValue, quoteStyle))
    ) {
      // When used, quotes need to match config
      msg = `string ${node} is not quoted with ${quoteType} quotes`;
    } else if (!quoteStyle && extraRequired.length > 0) {
      const isExtraRequired = extraRequired.some((pattern) => {
        try {
          return new RegExp(pattern).test(tokenValue);
        } catch {
          return false;
        }
      });
      if (isExtraRequired) {
        msg = `string ${node} is not quoted`;
      }
    }
  }

  if (msg !== null) {
    yield new LintProblem(token.startMark.line + 1, token.startMark.column + 1, msg);
  }
}

const rule: TokenRule<QuotedStringsConfig, QuotedStringsContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
