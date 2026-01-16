/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: anchors
 *
 * Report duplicated anchors and aliases referencing undeclared anchors.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenRule, type BaseRuleConfig, type BaseRuleContext, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'anchors';
export const TYPE = 'token' as const;

export const CONF = {
  'forbid-undeclared-aliases': Boolean,
  'forbid-duplicated-anchors': Boolean,
  'forbid-unused-anchors': Boolean,
};

export const DEFAULT = {
  'forbid-undeclared-aliases': true,
  'forbid-duplicated-anchors': false,
  'forbid-unused-anchors': false,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the anchors rule */
export interface AnchorsConfig extends BaseRuleConfig {
  'forbid-undeclared-aliases': boolean;
  'forbid-duplicated-anchors': boolean;
  'forbid-unused-anchors': boolean;
}

/** Information about a declared anchor */
interface AnchorInfo {
  line: number;
  column: number;
  used: boolean;
}

/** Typed context for the anchors rule */
export interface AnchorsContext extends BaseRuleContext {
  anchors: Record<string, AnchorInfo>;
}

/** Factory to create initial context */
export function createContext(): AnchorsContext {
  return { anchors: {} };
}

// =============================================================================
// Rule Implementation
// =============================================================================

/**
 * Get the anchor/alias name from token value.
 * Anchor tokens start with &, alias tokens start with *
 */
function getAnchorName(token: TokenWithMarks): string {
  const value = token.value ?? '';
  if (value.startsWith('&') || value.startsWith('*')) {
    return value.slice(1);
  }
  return value;
}

export function* check(
  conf: AnchorsConfig,
  token: TokenWithMarks,
  _prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  context: AnchorsContext
): Generator<LintProblem> {
  const forbidUndeclared = conf['forbid-undeclared-aliases'];
  const forbidDuplicated = conf['forbid-duplicated-anchors'];
  const forbidUnused = conf['forbid-unused-anchors'];

  // Reset anchors at document boundaries
  if (forbidUndeclared || forbidDuplicated || forbidUnused) {
    if (
      token.type === TokenType.StreamStart ||
      token.type === TokenType.DocumentStart ||
      token.type === TokenType.DocumentEnd
    ) {
      context.anchors = {};
    }
  }

  const anchors = context.anchors;

  // Check for undeclared aliases
  if (forbidUndeclared && token.type === TokenType.Alias) {
    const aliasName = getAnchorName(token);
    if (!(aliasName in anchors)) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.startMark.column + 1,
        `found undeclared alias "${aliasName}"`
      );
    }
  }

  // Check for duplicated anchors
  if (forbidDuplicated && token.type === TokenType.Anchor) {
    const anchorName = getAnchorName(token);
    if (anchorName in anchors) {
      yield new LintProblem(
        token.startMark.line + 1,
        token.startMark.column + 1,
        `found duplicated anchor "${anchorName}"`
      );
    }
  }

  // Check for unused anchors
  if (forbidUnused) {
    // Unused anchors can only be detected at the end of Document.
    // End of document can be either:
    //   - end of stream
    //   - end of document sign '...'
    //   - start of a new document sign '---'
    if (
      next?.type === TokenType.StreamEnd ||
      next?.type === TokenType.DocumentStart ||
      next?.type === TokenType.DocumentEnd
    ) {
      for (const [anchor, info] of Object.entries(anchors)) {
        if (!info.used) {
          yield new LintProblem(
            info.line + 1,
            info.column + 1,
            `found unused anchor "${anchor}"`
          );
        }
      }
    } else if (token.type === TokenType.Alias) {
      // Mark anchor as used when alias references it
      const aliasName = getAnchorName(token);
      if (aliasName in anchors) {
        anchors[aliasName]!.used = true;
      }
    }
  }

  // Register anchors
  if (forbidUndeclared || forbidDuplicated || forbidUnused) {
    if (token.type === TokenType.Anchor) {
      const anchorName = getAnchorName(token);
      anchors[anchorName] = {
        line: token.startMark.line,
        column: token.startMark.column,
        used: false,
      };
    }
  }
}

const rule: TokenRule<AnchorsConfig, AnchorsContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
