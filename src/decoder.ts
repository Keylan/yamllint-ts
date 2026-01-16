/**
 * yamllint-ts - TypeScript YAML Linter
 * Character encoding detection
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

// BOM (Byte Order Mark) constants
const BOM_UTF32_BE = Buffer.from([0x00, 0x00, 0xfe, 0xff]);
const BOM_UTF32_LE = Buffer.from([0xff, 0xfe, 0x00, 0x00]);
const BOM_UTF16_BE = Buffer.from([0xfe, 0xff]);
const BOM_UTF16_LE = Buffer.from([0xff, 0xfe]);
const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Encoding names compatible with Node.js Buffer
 */
export type Encoding =
  | 'utf-8'
  | 'utf-16le'
  | 'utf-16be'
  | 'utf8'; // Node.js normalizes these

/**
 * Detect the character encoding of a YAML stream.
 *
 * The YAML spec says that streams must begin with a BOM or an ASCII
 * character. If streamData doesn't begin with either of those, then this
 * function might return the wrong encoding.
 *
 * See chapter 5.2 of the YAML spec for details:
 * https://yaml.org/spec/1.2.2/#52-character-encodings
 *
 * Environment variable YAMLLINT_FILE_ENCODING can override detection.
 *
 * @param streamData - Raw bytes to analyze
 * @returns Encoding name suitable for Buffer.toString() or TextDecoder
 */
export function detectEncoding(streamData: Buffer): string {
  // Allow override via environment variable
  const envEncoding = process.env['YAMLLINT_FILE_ENCODING'];
  if (envEncoding) {
    console.warn(
      'YAMLLINT_FILE_ENCODING is meant for temporary workarounds. ' +
        'It may be removed in a future version of yamllint.'
    );
    return envEncoding;
  }

  // Check for UTF-32 (must be checked before UTF-16 due to BOM overlap)
  // UTF-32 BE BOM: 00 00 FE FF
  if (streamData.length >= 4 && bufferStartsWith(streamData, BOM_UTF32_BE)) {
    return 'utf-32be'; // Will need special handling
  }
  // UTF-32 BE without BOM: starts with 00 00 00 xx
  if (
    streamData.length >= 4 &&
    streamData[0] === 0x00 &&
    streamData[1] === 0x00 &&
    streamData[2] === 0x00
  ) {
    return 'utf-32be';
  }
  // UTF-32 LE BOM: FF FE 00 00
  if (streamData.length >= 4 && bufferStartsWith(streamData, BOM_UTF32_LE)) {
    return 'utf-32le';
  }
  // UTF-32 LE without BOM: starts with xx 00 00 00
  if (
    streamData.length >= 4 &&
    streamData[1] === 0x00 &&
    streamData[2] === 0x00 &&
    streamData[3] === 0x00
  ) {
    return 'utf-32le';
  }

  // Check for UTF-16
  // UTF-16 BE BOM: FE FF
  if (streamData.length >= 2 && bufferStartsWith(streamData, BOM_UTF16_BE)) {
    return 'utf-16be';
  }
  // UTF-16 BE without BOM: starts with 00 xx
  if (streamData.length >= 2 && streamData[0] === 0x00) {
    return 'utf-16be';
  }
  // UTF-16 LE BOM: FF FE (but not FF FE 00 00 which is UTF-32)
  if (
    streamData.length >= 2 &&
    bufferStartsWith(streamData, BOM_UTF16_LE) &&
    !(streamData.length >= 4 && streamData[2] === 0x00 && streamData[3] === 0x00)
  ) {
    return 'utf-16le';
  }
  // UTF-16 LE without BOM: starts with xx 00
  if (streamData.length >= 2 && streamData[1] === 0x00) {
    return 'utf-16le';
  }

  // Check for UTF-8 BOM
  if (bufferStartsWith(streamData, BOM_UTF8)) {
    return 'utf-8'; // utf-8-sig equivalent - we'll strip BOM manually
  }

  // Default to UTF-8
  return 'utf-8';
}

/**
 * Check if a buffer starts with another buffer.
 */
function bufferStartsWith(buffer: Buffer, prefix: Buffer): boolean {
  if (buffer.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (buffer[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Decode UTF-32 BE to string.
 * Node.js doesn't natively support UTF-32, so we handle it manually.
 */
function decodeUtf32BE(buffer: Buffer, skipBom: boolean = false): string {
  const start = skipBom && bufferStartsWith(buffer, BOM_UTF32_BE) ? 4 : 0;
  const codePoints: number[] = [];

  for (let i = start; i + 3 < buffer.length; i += 4) {
    const codePoint =
      (buffer[i]! << 24) | (buffer[i + 1]! << 16) | (buffer[i + 2]! << 8) | buffer[i + 3]!;
    codePoints.push(codePoint);
  }

  return String.fromCodePoint(...codePoints);
}

/**
 * Decode UTF-32 LE to string.
 * Node.js doesn't natively support UTF-32, so we handle it manually.
 */
function decodeUtf32LE(buffer: Buffer, skipBom: boolean = false): string {
  const start = skipBom && bufferStartsWith(buffer, BOM_UTF32_LE) ? 4 : 0;
  const codePoints: number[] = [];

  for (let i = start; i + 3 < buffer.length; i += 4) {
    const codePoint =
      buffer[i]! | (buffer[i + 1]! << 8) | (buffer[i + 2]! << 16) | (buffer[i + 3]! << 24);
    codePoints.push(codePoint);
  }

  return String.fromCodePoint(...codePoints);
}

/**
 * Decode UTF-16 BE to string.
 */
function decodeUtf16BE(buffer: Buffer): string {
  // Skip BOM if present
  let start = 0;
  if (bufferStartsWith(buffer, BOM_UTF16_BE)) {
    start = 2;
  }

  // Swap bytes for Node's utf16le decoder
  const swapped = Buffer.alloc(buffer.length - start);
  for (let i = start; i + 1 < buffer.length; i += 2) {
    swapped[i - start] = buffer[i + 1]!;
    swapped[i - start + 1] = buffer[i]!;
  }

  return swapped.toString('utf16le');
}

/**
 * Auto-detect encoding and decode a buffer to string.
 *
 * @param streamData - Raw bytes to decode
 * @returns Decoded string
 */
export function autoDecode(streamData: Buffer): string {
  const encoding = detectEncoding(streamData);

  switch (encoding) {
    case 'utf-32be':
      return decodeUtf32BE(streamData, true);
    case 'utf-32le':
      return decodeUtf32LE(streamData, true);
    case 'utf-16be':
      return decodeUtf16BE(streamData);
    case 'utf-16le': {
      // Skip BOM if present
      if (bufferStartsWith(streamData, BOM_UTF16_LE)) {
        return streamData.subarray(2).toString('utf16le');
      }
      return streamData.toString('utf16le');
    }
    case 'utf-8':
    default: {
      // Skip UTF-8 BOM if present
      if (bufferStartsWith(streamData, BOM_UTF8)) {
        return streamData.subarray(3).toString('utf-8');
      }
      return streamData.toString('utf-8');
    }
  }
}

/**
 * Read and auto-decode files, yielding their lines.
 * Used for reading ignore-from-file configurations.
 *
 * @param paths - File paths to read
 * @returns Generator yielding lines from all files
 */
export async function* linesInFiles(
  paths: string[]
): AsyncGenerator<string, void, unknown> {
  const fs = await import('fs/promises');

  for (const path of paths) {
    const buffer = await fs.readFile(path);
    const text = autoDecode(buffer);
    for (const line of text.split('\n')) {
      // Remove carriage return if present (Windows line endings)
      yield line.replace(/\r$/, '');
    }
  }
}

/**
 * Synchronous version of linesInFiles for use in config parsing.
 *
 * @param paths - File paths to read
 * @returns Array of lines from all files
 */
export function linesInFilesSync(paths: string[]): string[] {
  const fs = require('fs') as typeof import('fs');
  const lines: string[] = [];

  for (const path of paths) {
    const buffer = fs.readFileSync(path);
    const text = autoDecode(buffer);
    for (const line of text.split('\n')) {
      lines.push(line.replace(/\r$/, ''));
    }
  }

  return lines;
}
