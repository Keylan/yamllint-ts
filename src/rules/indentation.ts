/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: indentation
 *
 * Control the indentation level.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenRule, type BaseRuleConfig, type BaseRuleContext, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'indentation';
export const TYPE = 'token' as const;

export const CONF = {
  'spaces': [Number, 'consistent'],
  'indent-sequences': [true, false, 'whatever', 'consistent'],
  'check-multi-line-strings': Boolean,
};

export const DEFAULT = {
  'spaces': 'consistent',
  'indent-sequences': true,
  'check-multi-line-strings': false,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the indentation rule */
export interface IndentationConfig extends BaseRuleConfig {
  'spaces': number | 'consistent';
  'indent-sequences': boolean | 'whatever' | 'consistent';
  'check-multi-line-strings': boolean;
}

// Context types
const ROOT = 0;
const B_MAP = 1;
const F_MAP = 2;
const B_SEQ = 3;
const F_SEQ = 4;
const B_ENT = 5;
const KEY = 6;
const VAL = 7;

interface Parent {
  type: number;
  indent: number;
  expectedIndent?: number; // The indent that SHOULD be expected (may differ from actual if incorrectly positioned)
  lineIndent?: number;
  explicitKey?: boolean;
  implicitBlockSeq?: boolean;
}

/** Typed context for the indentation rule */
export interface IndentationContext extends BaseRuleContext {
  stack: Parent[];
  cur_line: number;
  spaces: number | 'consistent';
  'indent-sequences': boolean | 'whatever' | 'consistent';
  cur_line_indent: number;
  initialized?: boolean;
}

/** Factory to create initial context */
export function createContext(): IndentationContext {
  return {
    stack: [{ type: ROOT, indent: 0 }],
    cur_line: -1,
    spaces: 'consistent',
    'indent-sequences': 'consistent', // Placeholder - will be set from config on first call
    cur_line_indent: 0,
    initialized: false,
  };
}

/**
 * Get the real end line of a token (accounting for multi-line tokens).
 */
function getRealEndLine(token: TokenWithMarks): number {
  if (token.endMark.line > token.startMark.line) {
    // Multi-line token - check if end is at column 0 (meaning previous line)
    if (token.endMark.column === 0) {
      return token.endMark.line;
    }
  }
  return token.endMark.line + 1;
}

/**
 * Check indentation of multi-line scalar content.
 */
function* checkScalarIndentation(
  _conf: IndentationConfig,
  token: TokenWithMarks,
  context: IndentationContext
): Generator<LintProblem> {
  // Only check multi-line scalars
  if (token.startMark.line === token.endMark.line) {
    return;
  }

  const stack = context.stack;
  const buffer = token.startMark.buffer;

  function detectIndent(baseIndent: number, foundIndent: number): number {
    if (typeof context.spaces !== 'number') {
      context.spaces = foundIndent - baseIndent;
    }
    return baseIndent + (context.spaces as number);
  }

  function computeExpectedIndent(foundIndent: number): number {
    const style = token.style;

    // Plain scalar (no quotes, no block indicator)
    if (!style) {
      return token.startMark.column;
    }
    // Quoted strings - content should be at column + 1 (after the quote)
    else if (style === '"' || style === "'") {
      return token.startMark.column + 1;
    }
    // Block scalar (| or >)
    else if (style === 'block') {
      const topType = stack[stack.length - 1]?.type;
      
      if (topType === B_ENT) {
        // - >
        //     multi
        //     line
        return detectIndent(token.startMark.column, foundIndent);
      } else if (topType === KEY) {
        // - ? >
        //       multi-line
        //       key
        return detectIndent(token.startMark.column, foundIndent);
      } else if (topType === VAL) {
        const curLine = context.cur_line;
        if (token.startMark.line + 1 > curLine) {
          // - key:
          //     >
          //       multi
          //       line
          return detectIndent(stack[stack.length - 1]!.indent, foundIndent);
        } else if (stack.length >= 2 && stack[stack.length - 2]?.explicitKey) {
          // - ? key
          //   : >
          //       multi-line
          //       value
          return detectIndent(token.startMark.column, foundIndent);
        } else {
          // - key: >
          //     multi
          //     line
          const baseIndent = stack.length >= 2 ? stack[stack.length - 2]!.indent : 0;
          return detectIndent(baseIndent, foundIndent);
        }
      } else {
        return detectIndent(stack[stack.length - 1]?.indent ?? 0, foundIndent);
      }
    }

    return token.startMark.column;
  }

  let expectedIndent: number | null = null;
  let lineNo = token.startMark.line + 1;
  let lineStart = token.startMark.pointer;

  while (true) {
    // Find next newline in the buffer
    const nextNewline = buffer.indexOf('\n', lineStart);
    if (nextNewline === -1 || nextNewline >= token.endMark.pointer - 1) {
      break;
    }
    lineStart = nextNewline + 1;
    lineNo++;

    // Count indent spaces
    let indent = 0;
    while (lineStart + indent < buffer.length && buffer[lineStart + indent] === ' ') {
      indent++;
    }

    // Skip empty lines
    if (lineStart + indent < buffer.length && buffer[lineStart + indent] === '\n') {
      continue;
    }

    // Compute expected indent on first non-empty line
    if (expectedIndent === null) {
      expectedIndent = computeExpectedIndent(indent);
    }

    // Report error if indent doesn't match
    if (indent !== expectedIndent) {
      yield new LintProblem(
        lineNo,
        indent + 1,
        `wrong indentation: expected ${expectedIndent} but found ${indent}`
      );
    }
  }
}

// Debug mode - set to true to enable debug logging
const DEBUG = false;
const labels = ['ROOT', 'B_MAP', 'F_MAP', 'B_SEQ', 'F_SEQ', 'B_ENT', 'KEY', 'VAL'];

export function* check(
  conf: IndentationConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  context: IndentationContext
): Generator<LintProblem> {
  // Initialize context from config on first call
  if (!context.initialized) {
    context.spaces = conf['spaces'];
    context['indent-sequences'] = conf['indent-sequences'];
    context.initialized = true;
  }

  const stack = context.stack;

  if (DEBUG) {
    console.log(`\n=== ${token.type} (${token.startMark.line+1}:${token.startMark.column+1}) value=${JSON.stringify(token.value)} ===`);
    console.log(`Stack: [${stack.map(p => labels[p.type] + '(' + p.indent + (p.explicitKey ? ',exp' : '') + ')').join(', ')}]`);
    if (prev) console.log(`prev: ${prev.type} value=${JSON.stringify(prev.value)}`);
  }

  // Helper to detect indent
  function detectIndent(baseIndent: number, nextToken: TokenWithMarks | null): number {
    if (!nextToken) return baseIndent;
    if (typeof context.spaces !== 'number') {
      context.spaces = nextToken.startMark.column - baseIndent;
    }
    return baseIndent + (context.spaces as number);
  }

  // Step 1: Lint indentation

  const isVisible =
    token.type !== TokenType.StreamStart &&
    token.type !== TokenType.StreamEnd &&
    token.type !== TokenType.BlockEnd &&
    !(token.type === TokenType.Scalar && (token.value ?? '') === '');

  const firstInLine =
    isVisible && token.startMark.line + 1 > context.cur_line;

  if (firstInLine) {
    const foundIndentation = token.startMark.column;
    let expected = stack[stack.length - 1]!.indent;
    
    // For BlockEntry tokens in a B_SEQ context, use expectedIndent if the sequence
    // was incorrectly positioned (to flag all items, not just the first)
    if (token.type === TokenType.BlockEntry && 
        stack[stack.length - 1]!.type === B_SEQ &&
        stack[stack.length - 1]!.expectedIndent !== undefined &&
        stack[stack.length - 1]!.expectedIndent !== stack[stack.length - 1]!.indent) {
      expected = stack[stack.length - 1]!.expectedIndent!;
    }

    if (
      token.type === TokenType.FlowMappingEnd ||
      token.type === TokenType.FlowSequenceEnd
    ) {
      expected = stack[stack.length - 1]!.lineIndent ?? expected;
    } else if (
      stack[stack.length - 1]!.type === KEY &&
      stack[stack.length - 1]!.explicitKey &&
      token.type !== TokenType.Value
    ) {
      expected = detectIndent(expected, token);
    } else if (
      // Handle explicit key marker (?) - next tokens are indented under the key
      prev?.type === TokenType.Key && prev?.value === '?' &&
      token.type !== TokenType.Value
    ) {
      expected = detectIndent(expected, token);
    }

    if (foundIndentation !== expected) {
      let message: string;
      if (expected < 0) {
        message = `wrong indentation: expected at least ${foundIndentation + 1}`;
      } else {
        message = `wrong indentation: expected ${expected} but found ${foundIndentation}`;
      }
      yield new LintProblem(token.startMark.line + 1, foundIndentation + 1, message);
    }
  }

  // Check multi-line string indentation if enabled
  if (token.type === TokenType.Scalar && conf['check-multi-line-strings']) {
    yield* checkScalarIndentation(conf, token, context);
  }

  // Step 2.a: Update current line tracking

  if (isVisible) {
    context.cur_line = getRealEndLine(token);
    if (firstInLine) {
      context.cur_line_indent = token.startMark.column;
    }
  }

  // Step 2.b: Update state based on token type

  if (token.type === TokenType.BlockMappingStart) {
    const indent = token.startMark.column;
    stack.push({ type: B_MAP, indent });
  } else if (token.type === TokenType.FlowMappingStart) {
    let indent: number;
    if (next && next.startMark.line === token.startMark.line) {
      indent = next.startMark.column;
    } else {
      indent = detectIndent(context.cur_line_indent, next);
    }
    stack.push({ type: F_MAP, indent, lineIndent: context.cur_line_indent });
  } else if (token.type === TokenType.BlockSequenceStart) {
    const indent = token.startMark.column;
    // Preserve the expected indent from parent VAL for detecting incorrectly indented sequences
    // Don't set expectedIndent when inside an explicit key (KEY context), as sequences there
    // are correctly at their actual indent
    const parent = stack[stack.length - 1];
    const parentExpected = parent?.type === VAL ? parent.indent : undefined;
    stack.push({ type: B_SEQ, indent, expectedIndent: parentExpected });
  } else if (
    token.type === TokenType.BlockEntry &&
    next &&
    next.type !== TokenType.BlockEntry &&
    next.type !== TokenType.BlockEnd
  ) {
    // Handle implicit block sequences
    if (stack[stack.length - 1]!.type !== B_SEQ) {
      stack.push({ type: B_SEQ, indent: token.startMark.column, implicitBlockSeq: true });
    }

    let indent: number;
    if (next.startMark.line === token.endMark.line) {
      indent = next.startMark.column;
    } else if (next.startMark.column === token.startMark.column) {
      indent = next.startMark.column;
    } else {
      indent = detectIndent(token.startMark.column, next);
    }
    stack.push({ type: B_ENT, indent });
  } else if (token.type === TokenType.FlowSequenceStart) {
    let indent: number;
    if (next && next.startMark.line === token.startMark.line) {
      indent = next.startMark.column;
    } else {
      indent = detectIndent(context.cur_line_indent, next);
    }
    stack.push({ type: F_SEQ, indent, lineIndent: context.cur_line_indent });
  } else if (token.type === TokenType.Key) {
    // Our parser generates TWO KeyTokens for explicit keys:
    // 1. KeyToken "?" - the explicit key marker
    // 2. KeyToken "" - spurious token for content position (not in Python)
    // 
    // We push KEY when we see the marker "?" with current parent's indent.
    // We skip the spurious empty KeyToken that follows the "?" marker.
    if (token.value === '?') {
      // Explicit key marker - push KEY with current parent's indent
      const indent = stack[stack.length - 1]!.indent;
      if (DEBUG) console.log(`  Pushing KEY(${indent},exp) for explicit marker`);
      stack.push({ type: KEY, indent, explicitKey: true });
    } else {
      // Regular key or spurious key after explicit marker
      // Skip if:
      // 1. Previous token was KeyToken "?" (immediately following explicit marker)
      // 2. We're inside an explicit KEY and inside a B_SEQ (spurious key in sequence)
      const immediatelyAfterExplicitMarker = prev?.type === TokenType.Key && prev?.value === '?';
      const insideExplicitKeySequence = 
        stack[stack.length - 1]!.type === B_SEQ && 
        stack.length >= 2 &&
        stack[stack.length - 2]!.type === KEY &&
        stack[stack.length - 2]!.explicitKey;
      
      if (DEBUG) console.log(`  KeyToken: afterMarker=${immediatelyAfterExplicitMarker}, inExpSeq=${insideExplicitKeySequence}`);
      if (!immediatelyAfterExplicitMarker && !insideExplicitKeySequence) {
        const indent = stack[stack.length - 1]!.indent;
        if (DEBUG) console.log(`  Pushing KEY(${indent})`);
        stack.push({ type: KEY, indent, explicitKey: false });
      } else {
        if (DEBUG) console.log(`  Skipping spurious KeyToken`);
      }
    }
  } else if (token.type === TokenType.Value) {
    // Handle anchor/tag before value
    let effectiveNext = next;
    if (
      next &&
      (next.type === TokenType.Anchor || next.type === TokenType.Tag) &&
      nextnext &&
      prev &&
      next.startMark.line === prev.startMark.line &&
      next.startMark.line < nextnext.startMark.line
    ) {
      effectiveNext = nextnext;
    }

    // Only if value is not empty
    if (
      effectiveNext &&
      effectiveNext.type !== TokenType.BlockEnd &&
      effectiveNext.type !== TokenType.FlowMappingEnd &&
      effectiveNext.type !== TokenType.FlowSequenceEnd &&
      effectiveNext.type !== TokenType.Key
    ) {
      let indent: number;
      const currentParent = stack[stack.length - 1]!;

      if (currentParent.explicitKey) {
        indent = detectIndent(currentParent.indent, effectiveNext);
      } else if (prev && effectiveNext.startMark.line === prev.startMark.line) {
        indent = effectiveNext.startMark.column;
      } else if (
        effectiveNext.type === TokenType.BlockSequenceStart ||
        effectiveNext.type === TokenType.BlockEntry
      ) {
        const indentSeq = context['indent-sequences'];
        if (indentSeq === false) {
          indent = currentParent.indent;
        } else if (indentSeq === true) {
          if (
            context.spaces === 'consistent' &&
            effectiveNext.startMark.column - currentParent.indent === 0
          ) {
            indent = -1; // Unknown indentation
          } else {
            indent = detectIndent(currentParent.indent, effectiveNext);
          }
        } else {
          // 'whatever' or 'consistent'
          if (effectiveNext.startMark.column === currentParent.indent) {
            if (context['indent-sequences'] === 'consistent') {
              context['indent-sequences'] = false;
            }
            indent = currentParent.indent;
          } else {
            if (context['indent-sequences'] === 'consistent') {
              context['indent-sequences'] = true;
            }
            indent = detectIndent(currentParent.indent, effectiveNext);
          }
        }
      } else {
        indent = detectIndent(currentParent.indent, effectiveNext);
      }

      stack.push({ type: VAL, indent });
    }
  }

  // Step 3: Pop from stack based on token transitions
  let consumedCurrentToken = false;
  let loopCount = 0;
  const maxLoops = 100; // Safety limit

  while (loopCount++ < maxLoops) {
    if (stack.length === 0) break;
    const currentType = stack[stack.length - 1]!.type;

    if (
      currentType === F_SEQ &&
      token.type === TokenType.FlowSequenceEnd &&
      !consumedCurrentToken
    ) {
      stack.pop();
      consumedCurrentToken = true;
    } else if (
      currentType === F_MAP &&
      token.type === TokenType.FlowMappingEnd &&
      !consumedCurrentToken
    ) {
      stack.pop();
      consumedCurrentToken = true;
    } else if (
      (currentType === B_MAP || currentType === B_SEQ) &&
      token.type === TokenType.BlockEnd &&
      !stack[stack.length - 1]!.implicitBlockSeq &&
      !consumedCurrentToken
    ) {
      stack.pop();
      consumedCurrentToken = true;
    } else if (
      currentType === B_ENT &&
      token.type !== TokenType.BlockEntry &&
      stack.length > 1 &&
      stack[stack.length - 2]!.implicitBlockSeq &&
      token.type !== TokenType.Anchor &&
      token.type !== TokenType.Tag &&
      next?.type !== TokenType.BlockEntry
    ) {
      stack.pop();
      stack.pop();
    } else if (
      currentType === B_ENT &&
      (next?.type === TokenType.BlockEntry || next?.type === TokenType.BlockEnd)
    ) {
      stack.pop();
    } else if (
      currentType === VAL &&
      token.type !== TokenType.Value &&
      token.type !== TokenType.Anchor &&
      token.type !== TokenType.Tag
    ) {
      if (stack.length > 1 && stack[stack.length - 2]!.type === KEY) {
        stack.pop();
        stack.pop();
      }
    } else if (
      currentType === KEY &&
      (next?.type === TokenType.BlockEnd ||
        next?.type === TokenType.FlowMappingEnd ||
        next?.type === TokenType.FlowSequenceEnd ||
        next?.type === TokenType.Key)
    ) {
      // Don't pop KEY if we just pushed it for an explicit key marker (next is spurious KeyToken)
      if (token.type === TokenType.Key && token.value === '?') {
        // We just pushed KEY for explicit key, and next is the spurious KeyToken - don't pop
        break;
      }
      // Don't pop explicit KEY just because next is a KeyToken - wait for ValueToken
      // The KeyToken might be for a key inside the explicit key's content (nested mapping)
      if (stack[stack.length - 1]!.explicitKey && next?.type === TokenType.Key) {
        break;
      }
      if (DEBUG) console.log(`  Popping KEY (next is ${next?.type})`);
      stack.pop();
    } else {
      break;
    }
  }
}

const rule: TokenRule<IndentationConfig, IndentationContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
