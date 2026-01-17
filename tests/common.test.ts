/**
 * yamllint-ts - TypeScript YAML Linter
 * Common Utilities Tests
 */

import { describe, it, expect } from 'vitest';

import {
  spacesAfter,
  spacesBefore,
  getLineIndent,
  getRealEndLine,
  isExplicitKey,
  isFlowStart,
  isFlowEnd,
  isInFlowContext,
  updateFlowLevel,
} from '../src/rules/common.js';
import { TokenType } from '../src/parser.js';
import type { TokenWithMarks, TokenMark } from '../src/types.js';

/**
 * Helper to create a mock token with marks
 */
function createToken(options: {
  type?: string;
  startLine?: number;
  startColumn?: number;
  startPointer?: number;
  endLine?: number;
  endColumn?: number;
  endPointer?: number;
  buffer?: string;
}): TokenWithMarks {
  const buffer = options.buffer || 'test buffer content';
  const startMark: TokenMark = {
    line: options.startLine ?? 0,
    column: options.startColumn ?? 0,
    pointer: options.startPointer ?? 0,
    buffer,
  };
  const endMark: TokenMark = {
    line: options.endLine ?? options.startLine ?? 0,
    column: options.endColumn ?? options.startColumn ?? 0,
    pointer: options.endPointer ?? options.startPointer ?? 0,
    buffer,
  };

  return {
    type: options.type ?? TokenType.Scalar,
    startMark,
    endMark,
  };
}

describe('common utilities', () => {
  describe('spacesAfter', () => {
    it('should return null when next token is on different line', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 1, startPointer: 0 });

      const result = spacesAfter(token, null, next, { min: 1 });
      expect(result).toBeNull();
    });

    it('should return null when next token is null', () => {
      const token = createToken({ startLine: 0, endPointer: 5 });

      const result = spacesAfter(token, null, null, { min: 1 });
      expect(result).toBeNull();
    });

    it('should return null when spaces are within limits', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 0, startPointer: 6, startColumn: 6 });

      const result = spacesAfter(token, null, next, { min: 1, max: 2 });
      expect(result).toBeNull();
    });

    it('should return problem for too many spaces after', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 0, startPointer: 10, startColumn: 10 });

      const result = spacesAfter(token, null, next, { max: 2, maxDesc: 'too many spaces' });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too many spaces');
    });

    it('should return problem for too few spaces after', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 0, startPointer: 5, startColumn: 5 });

      const result = spacesAfter(token, null, next, { min: 1, minDesc: 'need more spaces' });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('need more spaces');
    });

    it('should use default messages when not provided', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 0, startPointer: 10, startColumn: 10 });

      const result = spacesAfter(token, null, next, { max: 2 });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too many spaces after');
    });

    it('should use default min message when not provided', () => {
      const token = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const next = createToken({ startLine: 0, startPointer: 5, startColumn: 5 });

      const result = spacesAfter(token, null, next, { min: 1 });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too few spaces after');
    });
  });

  describe('spacesBefore', () => {
    it('should return null when prev token is on different line', () => {
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 5 });
      const token = createToken({ startLine: 1, startPointer: 0 });

      const result = spacesBefore(token, prev, null, { min: 1 });
      expect(result).toBeNull();
    });

    it('should return null when prev token is null', () => {
      const token = createToken({ startLine: 0, startPointer: 0 });

      const result = spacesBefore(token, null, null, { min: 1 });
      expect(result).toBeNull();
    });

    it('should return null when spaces are within limits', () => {
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 5, buffer: 'key: ' });
      const token = createToken({
        startLine: 0,
        startPointer: 6,
        startColumn: 6,
        buffer: 'key: v',
      });

      const result = spacesBefore(token, prev, null, { min: 1, max: 2 });
      expect(result).toBeNull();
    });

    it('should return problem for too many spaces before', () => {
      const buffer = 'key:     value';
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 4, buffer });
      const token = createToken({ startLine: 0, startPointer: 9, startColumn: 9, buffer });

      const result = spacesBefore(token, prev, null, { max: 2, maxDesc: 'too many spaces before' });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too many spaces before');
    });

    it('should return problem for too few spaces before', () => {
      const buffer = 'key:value';
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 4, buffer });
      const token = createToken({ startLine: 0, startPointer: 4, startColumn: 4, buffer });

      const result = spacesBefore(token, prev, null, { min: 1, minDesc: 'need space before' });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('need space before');
    });

    it('should use default messages when not provided', () => {
      const buffer = 'key:     value';
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 4, buffer });
      const token = createToken({ startLine: 0, startPointer: 9, startColumn: 9, buffer });

      const result = spacesBefore(token, prev, null, { max: 2 });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too many spaces before');
    });

    it('should use default min message when not provided', () => {
      const buffer = 'key:value';
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 4, buffer });
      const token = createToken({ startLine: 0, startPointer: 4, startColumn: 4, buffer });

      const result = spacesBefore(token, prev, null, { min: 1 });
      expect(result).not.toBeNull();
      expect(result!.message).toBe('too few spaces before');
    });

    it('should ignore tokens that end with newline', () => {
      const buffer = 'key:\nvalue';
      const prev = createToken({ startLine: 0, endLine: 0, endPointer: 5, buffer }); // endPointer at '\n'
      const token = createToken({ startLine: 1, startPointer: 5, startColumn: 0, buffer });

      const result = spacesBefore(token, prev, null, { min: 1 });
      expect(result).toBeNull();
    });
  });

  describe('getLineIndent', () => {
    it('should return 0 for content at start of line with no indent', () => {
      const buffer = 'key: value';
      const token = createToken({ startPointer: 0, buffer });

      expect(getLineIndent(token)).toBe(0);
    });

    it('should return correct indent for content with spaces', () => {
      const buffer = '  key: value';
      const token = createToken({ startPointer: 2, buffer });

      expect(getLineIndent(token)).toBe(2);
    });

    it('should return indent from line start after newline', () => {
      const buffer = 'first:\n    second: value';
      const token = createToken({ startPointer: 11, buffer }); // points to 'second'

      expect(getLineIndent(token)).toBe(4);
    });

    it('should handle multiple levels of indentation', () => {
      const buffer = 'root:\n  level1:\n        level2: value';
      const token = createToken({ startPointer: 24, buffer }); // points to 'level2'

      expect(getLineIndent(token)).toBe(8);
    });
  });

  describe('getRealEndLine', () => {
    it('should return end line for non-scalar tokens', () => {
      const token = createToken({
        type: TokenType.BlockMappingStart,
        endLine: 5,
      });

      expect(getRealEndLine(token)).toBe(6); // 1-based
    });

    it('should return adjusted end line for scalar tokens with trailing whitespace', () => {
      const buffer = 'value  \n  ';
      const token = createToken({
        type: TokenType.Scalar,
        startPointer: 0,
        endLine: 1,
        endPointer: buffer.length,
        buffer,
      });

      // Should go back through whitespace and newlines
      expect(getRealEndLine(token)).toBe(1);
    });

    it('should return same line for scalar without trailing newline', () => {
      const buffer = 'value';
      const token = createToken({
        type: TokenType.Scalar,
        startPointer: 0,
        endLine: 0,
        endPointer: 5,
        buffer,
      });

      expect(getRealEndLine(token)).toBe(1);
    });

    it('should handle multiline scalar with trailing whitespace', () => {
      const buffer = 'line1\nline2\n   \n';
      const token = createToken({
        type: TokenType.Scalar,
        startPointer: 0,
        endLine: 3,
        endPointer: buffer.length,
        buffer,
      });

      // Should strip trailing blank lines
      expect(getRealEndLine(token)).toBeLessThanOrEqual(2);
    });
  });

  describe('isExplicitKey', () => {
    it('should return true for token starting with ?', () => {
      const buffer = '? explicit key';
      const token = createToken({
        startPointer: 0,
        endPointer: 14,
        buffer,
      });

      expect(isExplicitKey(token)).toBe(true);
    });

    it('should return false for regular token', () => {
      const buffer = 'regular key';
      const token = createToken({
        startPointer: 0,
        endPointer: 11,
        buffer,
      });

      expect(isExplicitKey(token)).toBe(false);
    });

    it('should return false for empty token (start >= end)', () => {
      const token = createToken({
        startPointer: 5,
        endPointer: 5,
      });

      expect(isExplicitKey(token)).toBe(false);
    });
  });

  describe('isFlowStart', () => {
    it('should return true for FlowMappingStart', () => {
      const token = createToken({ type: TokenType.FlowMappingStart });
      expect(isFlowStart(token)).toBe(true);
    });

    it('should return true for FlowSequenceStart', () => {
      const token = createToken({ type: TokenType.FlowSequenceStart });
      expect(isFlowStart(token)).toBe(true);
    });

    it('should return false for other token types', () => {
      const token = createToken({ type: TokenType.Scalar });
      expect(isFlowStart(token)).toBe(false);
    });

    it('should return false for BlockMappingStart', () => {
      const token = createToken({ type: TokenType.BlockMappingStart });
      expect(isFlowStart(token)).toBe(false);
    });
  });

  describe('isFlowEnd', () => {
    it('should return true for FlowMappingEnd', () => {
      const token = createToken({ type: TokenType.FlowMappingEnd });
      expect(isFlowEnd(token)).toBe(true);
    });

    it('should return true for FlowSequenceEnd', () => {
      const token = createToken({ type: TokenType.FlowSequenceEnd });
      expect(isFlowEnd(token)).toBe(true);
    });

    it('should return false for other token types', () => {
      const token = createToken({ type: TokenType.Scalar });
      expect(isFlowEnd(token)).toBe(false);
    });
  });

  describe('isInFlowContext', () => {
    it('should return true when flowLevel > 0', () => {
      expect(isInFlowContext({ flowLevel: 1 })).toBe(true);
      expect(isInFlowContext({ flowLevel: 5 })).toBe(true);
    });

    it('should return false when flowLevel is 0', () => {
      expect(isInFlowContext({ flowLevel: 0 })).toBe(false);
    });

    it('should return false when flowLevel is undefined', () => {
      expect(isInFlowContext({})).toBe(false);
    });
  });

  describe('updateFlowLevel', () => {
    it('should increment flowLevel for FlowMappingStart', () => {
      const ctx = { flowLevel: 0 };
      const token = createToken({ type: TokenType.FlowMappingStart });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(1);
    });

    it('should increment flowLevel for FlowSequenceStart', () => {
      const ctx = { flowLevel: 1 };
      const token = createToken({ type: TokenType.FlowSequenceStart });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(2);
    });

    it('should decrement flowLevel for FlowMappingEnd', () => {
      const ctx = { flowLevel: 2 };
      const token = createToken({ type: TokenType.FlowMappingEnd });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(1);
    });

    it('should decrement flowLevel for FlowSequenceEnd', () => {
      const ctx = { flowLevel: 1 };
      const token = createToken({ type: TokenType.FlowSequenceEnd });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(0);
    });

    it('should not go below 0', () => {
      const ctx = { flowLevel: 0 };
      const token = createToken({ type: TokenType.FlowMappingEnd });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(0);
    });

    it('should initialize flowLevel if undefined', () => {
      const ctx: { flowLevel?: number } = {};
      const token = createToken({ type: TokenType.FlowMappingStart });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(1);
    });

    it('should not change flowLevel for non-flow tokens', () => {
      const ctx = { flowLevel: 1 };
      const token = createToken({ type: TokenType.Scalar });

      updateFlowLevel(token, ctx);
      expect(ctx.flowLevel).toBe(1);
    });
  });
});
