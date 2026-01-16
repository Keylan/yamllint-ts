/**
 * yamllint-ts - TypeScript YAML Linter
 * YAML Parser - wraps yaml.js to provide token/comment/line streams
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { Parser, LineCounter, CST } from 'yaml';
import type { Line, Token, Comment, TokenWithMarks, ParsedElement } from './types.js';

// =============================================================================
// Token Type Constants (matching PyYAML token names)
// =============================================================================

export const TokenType = {
  StreamStart: 'StreamStartToken',
  StreamEnd: 'StreamEndToken',
  DocumentStart: 'DocumentStartToken',
  DocumentEnd: 'DocumentEndToken',
  BlockMappingStart: 'BlockMappingStartToken',
  BlockSequenceStart: 'BlockSequenceStartToken',
  BlockEnd: 'BlockEndToken',
  FlowMappingStart: 'FlowMappingStartToken',
  FlowMappingEnd: 'FlowMappingEndToken',
  FlowSequenceStart: 'FlowSequenceStartToken',
  FlowSequenceEnd: 'FlowSequenceEndToken',
  Key: 'KeyToken',
  Value: 'ValueToken',
  BlockEntry: 'BlockEntryToken',
  FlowEntry: 'FlowEntryToken',
  Alias: 'AliasToken',
  Anchor: 'AnchorToken',
  Tag: 'TagToken',
  Scalar: 'ScalarToken',
  Directive: 'DirectiveToken',
} as const;

// =============================================================================
// Line Class
// =============================================================================

export class LineImpl implements Line {
  lineNo: number;
  start: number;
  end: number;
  buffer: string;

  constructor(lineNo: number, buffer: string, start: number, end: number) {
    this.lineNo = lineNo;
    this.buffer = buffer;
    this.start = start;
    this.end = end;
  }

  get content(): string {
    return this.buffer.slice(this.start, this.end);
  }
}

// =============================================================================
// Comment Class
// =============================================================================

export class CommentImpl implements Comment {
  lineNo: number;
  columnNo: number;
  buffer: string;
  pointer: number;
  tokenBefore: TokenWithMarks | null;
  tokenAfter: TokenWithMarks | null;
  commentBefore: Comment | null;

  constructor(
    lineNo: number,
    columnNo: number,
    buffer: string,
    pointer: number,
    tokenBefore: TokenWithMarks | null = null,
    tokenAfter: TokenWithMarks | null = null,
    commentBefore: Comment | null = null
  ) {
    this.lineNo = lineNo;
    this.columnNo = columnNo;
    this.buffer = buffer;
    this.pointer = pointer;
    this.tokenBefore = tokenBefore;
    this.tokenAfter = tokenAfter;
    this.commentBefore = commentBefore;
  }

  get content(): string {
    let end = this.buffer.indexOf('\n', this.pointer);
    if (end === -1) {
      end = this.buffer.indexOf('\0', this.pointer);
    }
    if (end !== -1) {
      return this.buffer.slice(this.pointer, end);
    }
    return this.buffer.slice(this.pointer);
  }

  toString(): string {
    return this.content;
  }

  isInline(): boolean {
    if (!this.tokenBefore) {
      return false;
    }
    if (this.tokenBefore.type === TokenType.StreamStart) {
      return false;
    }
    // Check if comment is on the same line as the token before
    if (this.lineNo !== this.tokenBefore.endMark.line + 1) {
      return false;
    }
    // Check that the token doesn't actually end with a newline
    const endPointer = this.tokenBefore.endMark.pointer;
    if (endPointer > 0 && this.buffer[endPointer - 1] === '\n') {
      return false;
    }
    return true;
  }
}

// =============================================================================
// Token Wrapper
// =============================================================================

export class TokenImpl implements Token {
  lineNo: number;
  curr: TokenWithMarks;
  prev: TokenWithMarks | null;
  next: TokenWithMarks | null;
  nextnext: TokenWithMarks | null;

  constructor(
    lineNo: number,
    curr: TokenWithMarks,
    prev: TokenWithMarks | null,
    next: TokenWithMarks | null,
    nextnext: TokenWithMarks | null
  ) {
    this.lineNo = lineNo;
    this.curr = curr;
    this.prev = prev;
    this.next = next;
    this.nextnext = nextnext;
  }
}

// =============================================================================
// Line Generator
// =============================================================================

/**
 * Generate Line objects from a buffer.
 */
export function* lineGenerator(buffer: string): Generator<Line> {
  let lineNo = 1;
  let cur = 0;
  let next = buffer.indexOf('\n');

  while (next !== -1) {
    // Handle CRLF line endings
    if (next > 0 && buffer[next - 1] === '\r') {
      yield new LineImpl(lineNo, buffer, cur, next - 1);
    } else {
      yield new LineImpl(lineNo, buffer, cur, next);
    }
    cur = next + 1;
    next = buffer.indexOf('\n', cur);
    lineNo++;
  }

  // Yield the last line (or only line if no newlines)
  yield new LineImpl(lineNo, buffer, cur, buffer.length);
}

// =============================================================================
// Token Parsing using yaml.js Parser CST
// =============================================================================

// CST node types from yaml library
interface CSTNode {
  type?: string;
  offset?: number;
  indent?: number;
  source?: string;
  start?: CSTNode[];
  key?: CSTNode;
  sep?: CSTNode[];
  value?: CSTNode;
  end?: CSTNode[];
  items?: CSTNode[];
}

/**
 * Map CST node types to our token types.
 */
function mapCSTType(cstType: string): string | null {
  switch (cstType) {
    case 'document':
      return null; // Container, not a token
    case 'doc-start':
      return TokenType.DocumentStart;
    case 'doc-end':
      return TokenType.DocumentEnd;
    case 'directive':
      return TokenType.Directive;
    case 'block-map':
      return TokenType.BlockMappingStart;
    case 'block-seq':
      return TokenType.BlockSequenceStart;
    case 'flow-collection':
      return null; // Will be handled by { } [ ] tokens
    case 'scalar':
    case 'block-scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
      return TokenType.Scalar;
    case 'map-value-ind':
      return TokenType.Value;
    case 'seq-item-ind':
      return TokenType.BlockEntry;
    case 'explicit-key-ind':
      return TokenType.Key;
    case 'anchor':
      return TokenType.Anchor;
    case 'tag':
      return TokenType.Tag;
    case 'alias':
      return TokenType.Alias;
    case 'comment':
      return 'Comment';
    case 'space':
    case 'newline':
    case 'newline+indent':
      return null; // Skip whitespace
    case 'flow-map-start':
      return TokenType.FlowMappingStart;
    case 'flow-map-end':
      return TokenType.FlowMappingEnd;
    case 'flow-seq-start':
      return TokenType.FlowSequenceStart;
    case 'flow-seq-end':
      return TokenType.FlowSequenceEnd;
    case 'comma':
      return TokenType.FlowEntry;
    case 'error':
    case 'byte-order-mark':
      return null;
    default:
      return null;
  }
}

/**
 * Get normalized position (0-indexed line and column) from LineCounter.
 * LineCounter quirk: line 0 columns are 0-indexed, line 1+ columns are 1-indexed.
 */
function getNormalizedPos(lineCounter: LineCounter, offset: number): { line: number; col: number } {
  const pos = lineCounter.linePos(offset);
  return {
    line: pos.line,
    col: pos.line === 0 ? pos.col : pos.col - 1,
  };
}

/**
 * Create a TokenWithMarks object from offset and source.
 */
function createTokenFromCST(
  type: string,
  buffer: string,
  offset: number,
  source: string,
  lineCounter: LineCounter,
  scalarStyle?: ScalarStyle,
  resolvedValue?: string
): TokenWithMarks {
  const endOffset = offset + (source?.length || 0);
  const startPos = getNormalizedPos(lineCounter, offset);
  const endPos = getNormalizedPos(lineCounter, endOffset);

  const token: TokenWithMarks = {
    type,
    startMark: {
      line: startPos.line,
      column: startPos.col,
      pointer: offset,
      buffer,
    },
    endMark: {
      line: endPos.line,
      column: endPos.col,
      pointer: endOffset,
      buffer,
    },
    // For block scalars, use resolvedValue as the token value (matches Python behavior)
    // The raw source is still used for position calculation
    value: resolvedValue !== undefined ? resolvedValue : source,
  };

  // Add style for scalar tokens
  if (scalarStyle !== undefined) {
    token.style = scalarStyle ?? undefined;
  }

  return token;
}

/**
 * Scalar style type for distinguishing block scalars from plain/quoted.
 */
export type ScalarStyle = 'block' | "'" | '"' | null;

/**
 * Collect all tokens from CST in a flat list.
 */
function collectCSTTokens(
  node: CSTNode | CSTNode[] | undefined,
  tokens: {
    type: string;
    offset: number;
    source: string;
    isBlockStart?: boolean;
    scalarStyle?: ScalarStyle;
    resolvedValue?: string;
  }[]
): void {
  if (!node) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      collectCSTTokens(item, tokens);
    }
    return;
  }

  const cstType = node.type;

  // Handle nodes without type (map/seq items)
  if (!cstType) {
    if (node.start) collectCSTTokens(node.start, tokens);

    // Emit Key token before key scalar
    if (node.key && node.key.offset !== undefined) {
      tokens.push({ type: TokenType.Key, offset: node.key.offset, source: '' });
      collectCSTTokens(node.key, tokens);
    }

    if (node.sep) collectCSTTokens(node.sep, tokens);
    if (node.value) collectCSTTokens(node.value, tokens);
    if (node.end) collectCSTTokens(node.end, tokens);
    return;
  }

  // Emit block structure tokens
  if (cstType === 'block-map' && node.offset !== undefined) {
    tokens.push({
      type: TokenType.BlockMappingStart,
      offset: node.offset,
      source: '',
      isBlockStart: true,
    });
  } else if (cstType === 'block-seq' && node.offset !== undefined) {
    tokens.push({
      type: TokenType.BlockSequenceStart,
      offset: node.offset,
      source: '',
      isBlockStart: true,
    });
  }

  // Process children
  if (node.start) collectCSTTokens(node.start, tokens);
  if (node.key && node.key.offset !== undefined) {
    tokens.push({ type: TokenType.Key, offset: node.key.offset, source: '' });
    collectCSTTokens(node.key, tokens);
  }
  if (node.sep) collectCSTTokens(node.sep, tokens);

  // Process value for containers, but not for scalars (they ARE the value)
  if (node.value && !cstType.includes('scalar')) {
    collectCSTTokens(node.value, tokens);
  }

  if (node.items) collectCSTTokens(node.items, tokens);
  if (node.end) collectCSTTokens(node.end, tokens);

  // Emit leaf token
  const tokenType = mapCSTType(cstType);
  if (tokenType && node.offset !== undefined && node.source !== undefined) {
    // Determine scalar style based on CST type
    let scalarStyle: ScalarStyle = null;
    let resolvedValue: string | undefined;

    if (cstType === 'block-scalar') {
      scalarStyle = 'block';
      // For block scalars, resolve to get the actual value with indentation stripped
      // The CST source preserves raw indentation, but Python's scanner returns the resolved value
      // Cast to unknown first since our CSTNode interface is a simplified subset
      const resolved = CST.resolveAsScalar(node as unknown as CST.BlockScalar);
      if (resolved && typeof resolved.value === 'string') {
        resolvedValue = resolved.value;
      }
    } else if (cstType === 'single-quoted-scalar') {
      scalarStyle = "'";
    } else if (cstType === 'double-quoted-scalar') {
      scalarStyle = '"';
    }
    // For plain scalar, scalarStyle remains null
    // Use raw source for offset calculation, but store resolved value for rules
    tokens.push({
      type: tokenType,
      offset: node.offset,
      source: node.source,
      scalarStyle,
      resolvedValue,
    });
  }
}

/**
 * Parse YAML and yield tokens with position information using Parser CST.
 */
export function* tokenGenerator(buffer: string): Generator<TokenWithMarks> {
  const lineCounter = new LineCounter();
  const parser = new Parser();

  // Build line counter from buffer content
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === '\n') {
      lineCounter.addNewLine(i + 1);
    }
  }

  // Emit StreamStart
  yield createTokenFromCST(TokenType.StreamStart, buffer, 0, '', lineCounter);

  // Collect all tokens from CST
  const rawTokens: {
    type: string;
    offset: number;
    source: string;
    isBlockStart?: boolean;
    scalarStyle?: ScalarStyle;
    resolvedValue?: string;
  }[] = [];

  for (const doc of parser.parse(buffer)) {
    collectCSTTokens(doc as CSTNode, rawTokens);
  }

  // Sort by offset to get document order
  rawTokens.sort((a, b) => {
    if (a.offset !== b.offset) return a.offset - b.offset;
    // For same offset, block starts come before other tokens
    if (a.isBlockStart && !b.isBlockStart) return -1;
    if (!a.isBlockStart && b.isBlockStart) return 1;
    // Key comes before scalar at same position
    if (a.type === TokenType.Key && b.type === TokenType.Scalar) return -1;
    if (a.type === TokenType.Scalar && b.type === TokenType.Key) return 1;
    return 0;
  });

  // Remove duplicates (same type and offset)
  const seen = new Set<string>();
  const uniqueTokens = rawTokens.filter((t) => {
    const key = `${t.type}:${t.offset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Track block stack for BlockEnd emission
  const blockStack: { type: string; indent: number; offset: number }[] = [];

  for (let i = 0; i < uniqueTokens.length; i++) {
    const token = uniqueTokens[i]!;

    // Skip comments - handled separately
    if (token.type === 'Comment') continue;

    // Get normalized position info (0-indexed)
    const pos = getNormalizedPos(lineCounter, token.offset);

    // Check for block ends before emitting new tokens
    // A block ends when we see a token at lesser indentation (not same)
    // Exception: Key tokens at same indent continue the same block-map
    while (blockStack.length > 0) {
      const topBlock = blockStack[blockStack.length - 1]!;

      // Block ends when indentation strictly decreases
      // Keys at same indent continue the map, entries continue the seq
      // ValueToken at column 0 can appear after explicit keys (? key\n: value)
      // BlockSequenceStart/BlockEntry at same indent as mapping can be a value (implicit sequence)
      const isMapContinuation =
        topBlock.type === TokenType.BlockMappingStart &&
        (token.type === TokenType.Key ||
          token.type === TokenType.Scalar ||
          token.type === TokenType.Value ||
          token.type === TokenType.BlockSequenceStart ||
          token.type === TokenType.BlockEntry);
      const isSeqContinuation =
        topBlock.type === TokenType.BlockSequenceStart && token.type === TokenType.BlockEntry;

      if (pos.col < topBlock.indent && token.offset > topBlock.offset) {
        blockStack.pop();
        yield createTokenFromCST(TokenType.BlockEnd, buffer, token.offset, '', lineCounter);
      } else if (
        pos.col === topBlock.indent &&
        !isMapContinuation &&
        !isSeqContinuation &&
        token.offset > topBlock.offset
      ) {
        // Same indent but not continuing the block
        blockStack.pop();
        yield createTokenFromCST(TokenType.BlockEnd, buffer, token.offset, '', lineCounter);
      } else {
        break;
      }
    }

    // Track block structures
    if (token.type === TokenType.BlockMappingStart || token.type === TokenType.BlockSequenceStart) {
      blockStack.push({ type: token.type, indent: pos.col, offset: token.offset });
    }

    yield createTokenFromCST(
      token.type,
      buffer,
      token.offset,
      token.source,
      lineCounter,
      token.scalarStyle,
      token.resolvedValue
    );
  }

  // Emit remaining BlockEnd tokens
  while (blockStack.length > 0) {
    blockStack.pop();
    yield createTokenFromCST(TokenType.BlockEnd, buffer, buffer.length, '', lineCounter);
  }

  // Emit StreamEnd
  yield createTokenFromCST(TokenType.StreamEnd, buffer, buffer.length, '', lineCounter);
}

// =============================================================================
// Comment Extraction
// =============================================================================

/**
 * Find all comments between two tokens.
 */
export function* commentsBetweenTokens(
  token1: TokenWithMarks,
  token2: TokenWithMarks | null,
  buffer: string
): Generator<Comment> {
  const searchStart = token1.endMark.pointer;
  let searchEnd: number;

  if (token2 === null) {
    searchEnd = buffer.length;
  } else if (
    token1.endMark.line === token2.startMark.line &&
    token1.type !== TokenType.StreamStart &&
    token2.type !== TokenType.StreamEnd
  ) {
    // Tokens on same line with no room for comments
    return;
  } else {
    searchEnd = token2.startMark.pointer;
  }

  const buf = buffer.slice(searchStart, searchEnd);

  let lineNo = token1.endMark.line + 1;
  let columnNo = token1.endMark.column + 1;
  let pointer = searchStart;

  let commentBefore: Comment | null = null;

  for (const line of buf.split('\n')) {
    const pos = line.indexOf('#');
    if (pos !== -1) {
      const newComment: Comment = new CommentImpl(
        lineNo,
        columnNo + pos,
        buffer,
        pointer + pos,
        token1,
        token2,
        commentBefore
      );
      yield newComment;
      commentBefore = newComment;
    }

    pointer += line.length + 1;
    lineNo++;
    columnNo = 1;
  }
}

// =============================================================================
// Combined Token/Comment Generator
// =============================================================================

/**
 * Generate tokens and comments in document order.
 */
export function* tokenOrCommentGenerator(buffer: string): Generator<Token | Comment> {
  const tokens: TokenWithMarks[] = [];

  // Collect all tokens first
  for (const token of tokenGenerator(buffer)) {
    tokens.push(token);
  }

  // Now yield tokens with context and interleaved comments
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i]!;
    const prev = i > 0 ? tokens[i - 1]! : null;
    const next = i < tokens.length - 1 ? tokens[i + 1]! : null;
    const nextnext = i < tokens.length - 2 ? tokens[i + 2]! : null;

    yield new TokenImpl(curr.startMark.line + 1, curr, prev, next, nextnext);

    // Yield comments between this token and the next
    yield* commentsBetweenTokens(curr, next, buffer);
  }
}

// =============================================================================
// Combined Token/Comment/Line Generator
// =============================================================================

/**
 * Generator that mixes tokens, comments, and lines, ordering them by line number.
 * This is the main generator used by the linter.
 */
export function* tokenOrCommentOrLineGenerator(buffer: string): Generator<ParsedElement> {
  const tokOrComGen = tokenOrCommentGenerator(buffer);
  const lineGen = lineGenerator(buffer);

  let tokOrCom = tokOrComGen.next();
  let line = lineGen.next();

  while (!tokOrCom.done || !line.done) {
    if (tokOrCom.done) {
      // Only lines left
      yield line.value;
      line = lineGen.next();
    } else if (line.done) {
      // Only tokens/comments left
      yield tokOrCom.value;
      tokOrCom = tokOrComGen.next();
    } else {
      // Both available - yield by line number
      const tokLine = tokOrCom.value.lineNo;
      const lineLine = line.value.lineNo;

      if (tokLine > lineLine) {
        yield line.value;
        line = lineGen.next();
      } else {
        yield tokOrCom.value;
        tokOrCom = tokOrComGen.next();
      }
    }
  }
}

// =============================================================================
// Type Guards
// =============================================================================

export function isToken(elem: ParsedElement): elem is Token {
  return 'curr' in elem && 'prev' in elem;
}

export function isComment(elem: ParsedElement): elem is Comment {
  return 'columnNo' in elem && 'tokenBefore' in elem;
}

export function isLine(elem: ParsedElement): elem is Line {
  return 'start' in elem && 'end' in elem && !('columnNo' in elem);
}
