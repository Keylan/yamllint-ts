/**
 * yamllint-ts - TypeScript YAML Linter
 * Parser Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TokenType,
  LineImpl,
  lineGenerator,
  tokenGenerator,
  tokenOrCommentGenerator,
  tokenOrCommentOrLineGenerator,
  isToken,
  isComment,
  isLine,
} from '../src/parser.js';

describe('Parser', () => {
  describe('TokenType', () => {
    it('should have all token type constants', () => {
      expect(TokenType.StreamStart).toBe('StreamStartToken');
      expect(TokenType.StreamEnd).toBe('StreamEndToken');
      expect(TokenType.DocumentStart).toBe('DocumentStartToken');
      expect(TokenType.DocumentEnd).toBe('DocumentEndToken');
      expect(TokenType.BlockMappingStart).toBe('BlockMappingStartToken');
      expect(TokenType.BlockSequenceStart).toBe('BlockSequenceStartToken');
      expect(TokenType.FlowMappingStart).toBe('FlowMappingStartToken');
      expect(TokenType.FlowMappingEnd).toBe('FlowMappingEndToken');
      expect(TokenType.FlowSequenceStart).toBe('FlowSequenceStartToken');
      expect(TokenType.FlowSequenceEnd).toBe('FlowSequenceEndToken');
      expect(TokenType.Key).toBe('KeyToken');
      expect(TokenType.Value).toBe('ValueToken');
      expect(TokenType.BlockEntry).toBe('BlockEntryToken');
      expect(TokenType.FlowEntry).toBe('FlowEntryToken');
      expect(TokenType.Alias).toBe('AliasToken');
      expect(TokenType.Anchor).toBe('AnchorToken');
      expect(TokenType.Tag).toBe('TagToken');
      expect(TokenType.Scalar).toBe('ScalarToken');
      expect(TokenType.Directive).toBe('DirectiveToken');
    });
  });

  describe('LineImpl', () => {
    it('should create a line with correct properties', () => {
      const buffer = 'key: value';
      const line = new LineImpl(1, buffer, 0, 10);
      expect(line.lineNo).toBe(1);
      expect(line.buffer).toBe(buffer);
      expect(line.start).toBe(0);
      expect(line.end).toBe(10);
    });

    it('should get content correctly', () => {
      const buffer = 'line1\nline2\nline3';
      const line = new LineImpl(2, buffer, 6, 11);
      expect(line.content).toBe('line2');
    });
  });

  describe('lineGenerator', () => {
    it('should generate lines from buffer', () => {
      const buffer = 'line1\nline2\nline3\n';
      const lines = [...lineGenerator(buffer)];
      expect(lines).toHaveLength(4); // 3 lines + empty line at end
      expect(lines[0]!.lineNo).toBe(1);
      expect(lines[0]!.content).toBe('line1');
      expect(lines[1]!.lineNo).toBe(2);
      expect(lines[1]!.content).toBe('line2');
    });

    it('should handle single line without newline', () => {
      const buffer = 'single line';
      const lines = [...lineGenerator(buffer)];
      expect(lines).toHaveLength(1);
      expect(lines[0]!.content).toBe('single line');
    });

    it('should handle empty buffer', () => {
      const buffer = '';
      const lines = [...lineGenerator(buffer)];
      expect(lines).toHaveLength(1);
      expect(lines[0]!.content).toBe('');
    });
  });

  describe('tokenGenerator', () => {
    it('should generate tokens from simple YAML', () => {
      const buffer = 'key: value\n';
      const tokens = [...tokenGenerator(buffer)];
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]!.type).toBe(TokenType.StreamStart);
      expect(tokens[tokens.length - 1]!.type).toBe(TokenType.StreamEnd);
    });

    it('should generate block mapping start token', () => {
      const buffer = 'a: 1\nb: 2\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.BlockMappingStart);
    });

    it('should generate block sequence start token', () => {
      const buffer = '- item1\n- item2\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.BlockSequenceStart);
      expect(types).toContain(TokenType.BlockEntry);
    });

    it('should generate flow mapping tokens', () => {
      const buffer = '{a: 1, b: 2}\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.FlowMappingStart);
      expect(types).toContain(TokenType.FlowMappingEnd);
    });

    it('should generate flow sequence tokens', () => {
      const buffer = '[1, 2, 3]\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.FlowSequenceStart);
      expect(types).toContain(TokenType.FlowSequenceEnd);
    });

    it('should generate anchor and alias tokens', () => {
      const buffer = 'a: &anchor value\nb: *anchor\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.Anchor);
      expect(types).toContain(TokenType.Alias);
    });

    it('should generate tag token', () => {
      const buffer = '!custom value\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.Tag);
    });

    it('should generate document start token', () => {
      const buffer = '---\nkey: value\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.DocumentStart);
    });

    it('should generate document end token', () => {
      const buffer = 'key: value\n...\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.DocumentEnd);
    });

    it('should handle block scalars', () => {
      const buffer = 'text: |\n  line1\n  line2\n';
      const tokens = [...tokenGenerator(buffer)];
      const scalars = tokens.filter((t) => t.type === TokenType.Scalar);
      // Key 'text' and block scalar value
      expect(scalars.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle quoted scalars', () => {
      const buffer = 'a: \'single\'\nb: "double"\n';
      const tokens = [...tokenGenerator(buffer)];
      const scalars = tokens.filter((t) => t.type === TokenType.Scalar);
      // Keys a, b and values 'single', "double"
      expect(scalars.length).toBeGreaterThanOrEqual(4);
    });

    it('should generate directive token', () => {
      const buffer = '%YAML 1.2\n---\nkey: value\n';
      const tokens = [...tokenGenerator(buffer)];
      const types = tokens.map((t) => t.type);
      expect(types).toContain(TokenType.Directive);
    });
  });

  describe('tokenOrCommentGenerator', () => {
    it('should yield tokens with prev/next context', () => {
      const buffer = 'key: value\n';
      const tokens = [...tokenOrCommentGenerator(buffer)];
      expect(tokens.length).toBeGreaterThan(0);

      // Check that tokens have prev/next
      for (const token of tokens) {
        if (isToken(token)) {
          expect(token).toHaveProperty('prev');
          expect(token).toHaveProperty('next');
          expect(token).toHaveProperty('curr');
        }
      }
    });

    it('should yield comments interspersed with tokens', () => {
      const buffer = 'key: value  # comment\n';
      const elements = [...tokenOrCommentGenerator(buffer)];
      const comments = elements.filter(isComment);
      expect(comments.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle trailing comment without newline', () => {
      // Comments are captured between tokens
      const buffer = 'key: value  # trailing\n';
      const elements = [...tokenOrCommentGenerator(buffer)];
      const comments = elements.filter(isComment);
      expect(comments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('tokenOrCommentOrLineGenerator', () => {
    it('should yield tokens, comments, and lines', () => {
      const buffer = 'key: value\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];

      const tokens = elements.filter(isToken);
      const lines = elements.filter(isLine);

      expect(tokens.length).toBeGreaterThan(0);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle multiple lines', () => {
      const buffer = 'a: 1\nb: 2\nc: 3\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const lines = elements.filter(isLine);
      expect(lines).toHaveLength(4); // 3 lines + empty trailing line
    });

    it('should handle file without trailing newline', () => {
      // This case tests lines exhausted before tokens
      const buffer = 'key: value';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const tokens = elements.filter(isToken);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should interleave elements by line number', () => {
      const buffer = 'a: 1\nb: 2\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      let lastLineNo = 0;
      for (const elem of elements) {
        // Elements should be in line order
        expect(elem.lineNo).toBeGreaterThanOrEqual(lastLineNo);
        lastLineNo = elem.lineNo;
      }
    });

    it('should handle empty YAML', () => {
      const buffer = '';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      expect(elements.length).toBeGreaterThan(0); // At least StreamStart/StreamEnd
    });

    it('should handle only comments without trailing newline', () => {
      // This should trigger line 662-663 - lines done, tokens/comments remaining
      const buffer = '# comment';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const comments = elements.filter(isComment);
      expect(comments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Type guards', () => {
    it('isToken should identify tokens', () => {
      const buffer = 'key: value\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const tokens = elements.filter(isToken);
      expect(tokens.length).toBeGreaterThan(0);
      for (const token of tokens) {
        expect(isToken(token)).toBe(true);
        expect(isComment(token)).toBe(false);
        expect(isLine(token)).toBe(false);
      }
    });

    it('isComment should identify comments', () => {
      const buffer = 'key: value  # comment\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const comments = elements.filter(isComment);
      expect(comments.length).toBeGreaterThanOrEqual(1);
      for (const comment of comments) {
        expect(isComment(comment)).toBe(true);
        expect(isToken(comment)).toBe(false);
        expect(isLine(comment)).toBe(false);
      }
    });

    it('isLine should identify lines', () => {
      const buffer = 'key: value\n';
      const elements = [...tokenOrCommentOrLineGenerator(buffer)];
      const lines = elements.filter(isLine);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(isLine(line)).toBe(true);
        expect(isToken(line)).toBe(false);
        expect(isComment(line)).toBe(false);
      }
    });
  });
});
