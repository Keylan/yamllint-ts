/**
 * yamllint-ts - TypeScript YAML Linter
 * Common utilities for rules
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

/**
 * Check spacing after a token.
 *
 * @param token - The token to check spacing after
 * @param prev - Previous token
 * @param next - Next token
 * @param options - Spacing options
 * @returns LintProblem if spacing is incorrect, null otherwise
 */
export function spacesAfter(
  token: TokenWithMarks,
  _prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  options: {
    min?: number;
    max?: number;
    minDesc?: string;
    maxDesc?: string;
  }
): LintProblem | null {
  const { min = -1, max = -1, minDesc, maxDesc } = options;

  if (next !== null && token.endMark.line === next.startMark.line) {
    const spaces = next.startMark.pointer - token.endMark.pointer;

    if (max !== -1 && spaces > max) {
      return new LintProblem(
        token.startMark.line + 1,
        next.startMark.column,
        maxDesc || `too many spaces after`
      );
    } else if (min !== -1 && spaces < min) {
      return new LintProblem(
        token.startMark.line + 1,
        next.startMark.column + 1,
        minDesc || `too few spaces after`
      );
    }
  }

  return null;
}

/**
 * Check spacing before a token.
 *
 * @param token - The token to check spacing before
 * @param prev - Previous token
 * @param next - Next token
 * @param options - Spacing options
 * @returns LintProblem if spacing is incorrect, null otherwise
 */
export function spacesBefore(
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  options: {
    min?: number;
    max?: number;
    minDesc?: string;
    maxDesc?: string;
  }
): LintProblem | null {
  const { min = -1, max = -1, minDesc, maxDesc } = options;

  if (
    prev !== null &&
    prev.endMark.line === token.startMark.line &&
    // Discard tokens that end at the start of next line
    (prev.endMark.pointer === 0 ||
      prev.endMark.buffer[prev.endMark.pointer - 1] !== '\n')
  ) {
    const spaces = token.startMark.pointer - prev.endMark.pointer;

    if (max !== -1 && spaces > max) {
      return new LintProblem(
        token.startMark.line + 1,
        token.startMark.column,
        maxDesc || `too many spaces before`
      );
    } else if (min !== -1 && spaces < min) {
      return new LintProblem(
        token.startMark.line + 1,
        token.startMark.column + 1,
        minDesc || `too few spaces before`
      );
    }
  }

  return null;
}

/**
 * Find the indent of the line the token starts on.
 *
 * @param token - Token to find line indent for
 * @returns Number of spaces at the start of the line
 */
export function getLineIndent(token: TokenWithMarks): number {
  const buffer = token.startMark.buffer;
  const pointer = token.startMark.pointer;

  // Find the start of the line
  let start = buffer.lastIndexOf('\n', pointer - 1) + 1;
  let content = start;

  // Count spaces
  while (content < buffer.length && buffer[content] === ' ') {
    content++;
  }

  return content - start;
}

/**
 * Find the line on which the token really ends.
 * With some parsers, scalar tokens often end on the next line.
 *
 * @param token - Token to check
 * @returns Actual end line number (1-based)
 */
export function getRealEndLine(token: TokenWithMarks): number {
  let endLine = token.endMark.line + 1;

  if (token.type !== TokenType.Scalar) {
    return endLine;
  }

  const buffer = token.endMark.buffer;
  let pos = token.endMark.pointer - 1;

  while (pos >= token.startMark.pointer - 1) {
    const char = buffer[pos];
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      if (char === '\n') {
        endLine--;
      }
      pos--;
    } else {
      break;
    }
  }

  return endLine;
}

/**
 * Check if a token is an explicit key (starts with ?).
 *
 * @param token - Token to check
 * @returns true if this is an explicit key
 */
export function isExplicitKey(token: TokenWithMarks): boolean {
  if (token.startMark.pointer >= token.endMark.pointer) {
    return false;
  }
  return token.startMark.buffer[token.startMark.pointer] === '?';
}

/**
 * Check if a token is a flow context opening bracket.
 *
 * @param token - Token to check
 * @returns true if this starts a flow context
 */
export function isFlowStart(token: TokenWithMarks): boolean {
  return (
    token.type === TokenType.FlowMappingStart ||
    token.type === TokenType.FlowSequenceStart
  );
}

/**
 * Check if a token is a flow context closing bracket.
 *
 * @param token - Token to check
 * @returns true if this ends a flow context
 */
export function isFlowEnd(token: TokenWithMarks): boolean {
  return (
    token.type === TokenType.FlowMappingEnd ||
    token.type === TokenType.FlowSequenceEnd
  );
}

/**
 * Check if we're currently in a flow context.
 *
 * @param context - Rule context with flowLevel
 * @returns true if in flow context
 */
export function isInFlowContext(context: { flowLevel?: number }): boolean {
  return (context.flowLevel ?? 0) > 0;
}

/**
 * Update flow context level based on token.
 *
 * @param token - Current token
 * @param context - Rule context to update
 */
export function updateFlowLevel(
  token: TokenWithMarks,
  context: { flowLevel?: number }
): void {
  if (isFlowStart(token)) {
    context.flowLevel = (context.flowLevel ?? 0) + 1;
  } else if (isFlowEnd(token)) {
    context.flowLevel = Math.max(0, (context.flowLevel ?? 0) - 1);
  }
}
