/**
 * yamllint-ts - TypeScript YAML Linter
 * Decoder Tests - Character encoding detection and decoding
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { detectEncoding, autoDecode, linesInFilesSync, linesInFiles } from '../src/decoder.js';

let tempDir: string;

// BOM constants for creating test buffers
const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
const BOM_UTF16_BE = Buffer.from([0xfe, 0xff]);
const BOM_UTF16_LE = Buffer.from([0xff, 0xfe]);
const BOM_UTF32_BE = Buffer.from([0x00, 0x00, 0xfe, 0xff]);
const BOM_UTF32_LE = Buffer.from([0xff, 0xfe, 0x00, 0x00]);

/**
 * Encode a string as UTF-16 BE (big endian)
 */
function encodeUtf16BE(str: string): Buffer {
  const buf = Buffer.alloc(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    buf[i * 2] = (code >> 8) & 0xff;
    buf[i * 2 + 1] = code & 0xff;
  }
  return buf;
}

/**
 * Encode a string as UTF-16 LE (little endian)
 */
function encodeUtf16LE(str: string): Buffer {
  return Buffer.from(str, 'utf16le');
}

/**
 * Encode a string as UTF-32 BE (big endian)
 */
function encodeUtf32BE(str: string): Buffer {
  const codePoints = [...str].map((c) => c.codePointAt(0)!);
  const buf = Buffer.alloc(codePoints.length * 4);
  for (let i = 0; i < codePoints.length; i++) {
    const cp = codePoints[i]!;
    buf[i * 4] = (cp >> 24) & 0xff;
    buf[i * 4 + 1] = (cp >> 16) & 0xff;
    buf[i * 4 + 2] = (cp >> 8) & 0xff;
    buf[i * 4 + 3] = cp & 0xff;
  }
  return buf;
}

/**
 * Encode a string as UTF-32 LE (little endian)
 */
function encodeUtf32LE(str: string): Buffer {
  const codePoints = [...str].map((c) => c.codePointAt(0)!);
  const buf = Buffer.alloc(codePoints.length * 4);
  for (let i = 0; i < codePoints.length; i++) {
    const cp = codePoints[i]!;
    buf[i * 4] = cp & 0xff;
    buf[i * 4 + 1] = (cp >> 8) & 0xff;
    buf[i * 4 + 2] = (cp >> 16) & 0xff;
    buf[i * 4 + 3] = (cp >> 24) & 0xff;
  }
  return buf;
}

describe('decoder', () => {
  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yamllint-ts-decoder-test-'));
  });

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('detectEncoding', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    describe('UTF-8', () => {
      it('should detect UTF-8 without BOM', () => {
        const buffer = Buffer.from('---\nkey: value\n', 'utf-8');
        expect(detectEncoding(buffer)).toBe('utf-8');
      });

      it('should detect UTF-8 with BOM', () => {
        const content = Buffer.from('---\nkey: value\n', 'utf-8');
        const buffer = Buffer.concat([BOM_UTF8, content]);
        expect(detectEncoding(buffer)).toBe('utf-8');
      });

      it('should default to UTF-8 for empty buffer', () => {
        expect(detectEncoding(Buffer.alloc(0))).toBe('utf-8');
      });

      it('should default to UTF-8 for single byte', () => {
        expect(detectEncoding(Buffer.from([0x41]))).toBe('utf-8');
      });
    });

    describe('UTF-16', () => {
      it('should detect UTF-16 BE with BOM', () => {
        const content = encodeUtf16BE('---');
        const buffer = Buffer.concat([BOM_UTF16_BE, content]);
        expect(detectEncoding(buffer)).toBe('utf-16be');
      });

      it('should detect UTF-16 BE without BOM (starts with 00)', () => {
        // ASCII char in UTF-16 BE starts with 0x00
        const buffer = encodeUtf16BE('-');
        expect(detectEncoding(buffer)).toBe('utf-16be');
      });

      it('should detect UTF-16 LE with BOM', () => {
        const content = encodeUtf16LE('---');
        const buffer = Buffer.concat([BOM_UTF16_LE, content]);
        expect(detectEncoding(buffer)).toBe('utf-16le');
      });

      it('should detect UTF-16 LE without BOM (second byte is 00)', () => {
        // ASCII char in UTF-16 LE has 0x00 as second byte
        const buffer = encodeUtf16LE('-');
        expect(detectEncoding(buffer)).toBe('utf-16le');
      });
    });

    describe('UTF-32', () => {
      it('should detect UTF-32 BE with BOM', () => {
        const content = encodeUtf32BE('-');
        const buffer = Buffer.concat([BOM_UTF32_BE, content]);
        expect(detectEncoding(buffer)).toBe('utf-32be');
      });

      it('should detect UTF-32 BE without BOM (starts with 00 00 00)', () => {
        // ASCII char in UTF-32 BE starts with 0x00 0x00 0x00
        const buffer = encodeUtf32BE('-');
        expect(detectEncoding(buffer)).toBe('utf-32be');
      });

      it('should detect UTF-32 LE with BOM', () => {
        const content = encodeUtf32LE('-');
        const buffer = Buffer.concat([BOM_UTF32_LE, content]);
        expect(detectEncoding(buffer)).toBe('utf-32le');
      });

      it('should detect UTF-32 LE without BOM (bytes 2-4 are 00)', () => {
        // ASCII char in UTF-32 LE has 0x00 in positions 2, 3, 4
        const buffer = encodeUtf32LE('-');
        expect(detectEncoding(buffer)).toBe('utf-32le');
      });
    });

    describe('environment override', () => {
      it('should use YAMLLINT_FILE_ENCODING if set', () => {
        process.env.YAMLLINT_FILE_ENCODING = 'iso-8859-1';
        const buffer = Buffer.from('test', 'utf-8');

        // Capture console.warn
        const originalWarn = console.warn;
        let warnMessage = '';
        console.warn = (msg: string) => {
          warnMessage = msg;
        };

        const encoding = detectEncoding(buffer);

        console.warn = originalWarn;

        expect(encoding).toBe('iso-8859-1');
        expect(warnMessage).toContain('YAMLLINT_FILE_ENCODING');
        expect(warnMessage).toContain('temporary workarounds');
      });
    });
  });

  describe('autoDecode', () => {
    describe('UTF-8', () => {
      it('should decode UTF-8 without BOM', () => {
        const buffer = Buffer.from('---\nkey: value\n', 'utf-8');
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-8 with BOM and strip BOM', () => {
        const content = Buffer.from('---\nkey: value\n', 'utf-8');
        const buffer = Buffer.concat([BOM_UTF8, content]);
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-8 with unicode characters', () => {
        const buffer = Buffer.from('key: 日本語\n', 'utf-8');
        expect(autoDecode(buffer)).toBe('key: 日本語\n');
      });

      it('should decode UTF-8 with emoji', () => {
        const buffer = Buffer.from('key: 🎉\n', 'utf-8');
        expect(autoDecode(buffer)).toBe('key: 🎉\n');
      });
    });

    describe('UTF-16 LE', () => {
      it('should decode UTF-16 LE with BOM', () => {
        const content = encodeUtf16LE('---\nkey: value\n');
        const buffer = Buffer.concat([BOM_UTF16_LE, content]);
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-16 LE without BOM', () => {
        const buffer = encodeUtf16LE('---\nkey: value\n');
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });
    });

    describe('UTF-16 BE', () => {
      it('should decode UTF-16 BE with BOM', () => {
        const content = encodeUtf16BE('---\nkey: value\n');
        const buffer = Buffer.concat([BOM_UTF16_BE, content]);
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-16 BE without BOM', () => {
        const buffer = encodeUtf16BE('---\nkey: value\n');
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });
    });

    describe('UTF-32 BE', () => {
      it('should decode UTF-32 BE with BOM', () => {
        const content = encodeUtf32BE('---\nkey: value\n');
        const buffer = Buffer.concat([BOM_UTF32_BE, content]);
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-32 BE without BOM', () => {
        const buffer = encodeUtf32BE('---\nkey: value\n');
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-32 BE with unicode', () => {
        const buffer = Buffer.concat([BOM_UTF32_BE, encodeUtf32BE('日本語')]);
        expect(autoDecode(buffer)).toBe('日本語');
      });
    });

    describe('UTF-32 LE', () => {
      it('should decode UTF-32 LE with BOM', () => {
        const content = encodeUtf32LE('---\nkey: value\n');
        const buffer = Buffer.concat([BOM_UTF32_LE, content]);
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-32 LE without BOM', () => {
        const buffer = encodeUtf32LE('---\nkey: value\n');
        expect(autoDecode(buffer)).toBe('---\nkey: value\n');
      });

      it('should decode UTF-32 LE with unicode', () => {
        const buffer = Buffer.concat([BOM_UTF32_LE, encodeUtf32LE('日本語')]);
        expect(autoDecode(buffer)).toBe('日本語');
      });
    });

    describe('edge cases', () => {
      it('should handle empty buffer', () => {
        expect(autoDecode(Buffer.alloc(0))).toBe('');
      });

      it('should handle single character', () => {
        expect(autoDecode(Buffer.from('a', 'utf-8'))).toBe('a');
      });

      it('should handle newlines', () => {
        const buffer = Buffer.from('line1\nline2\nline3\n', 'utf-8');
        expect(autoDecode(buffer)).toBe('line1\nline2\nline3\n');
      });

      it('should handle Windows line endings', () => {
        const buffer = Buffer.from('line1\r\nline2\r\n', 'utf-8');
        expect(autoDecode(buffer)).toBe('line1\r\nline2\r\n');
      });
    });
  });

  describe('linesInFilesSync', () => {
    it('should read lines from a single UTF-8 file', () => {
      const filePath = path.join(tempDir, 'utf8.txt');
      fs.writeFileSync(filePath, 'line1\nline2\nline3\n', 'utf-8');

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', 'line3', '']);
    });

    it('should read lines from multiple files', () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      fs.writeFileSync(file1, 'a\nb\n', 'utf-8');
      fs.writeFileSync(file2, 'c\nd\n', 'utf-8');

      const lines = linesInFilesSync([file1, file2]);
      expect(lines).toEqual(['a', 'b', '', 'c', 'd', '']);
    });

    it('should handle Windows line endings (CRLF)', () => {
      const filePath = path.join(tempDir, 'crlf.txt');
      fs.writeFileSync(filePath, 'line1\r\nline2\r\nline3\r\n', 'utf-8');

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', 'line3', '']);
    });

    it('should handle mixed line endings', () => {
      const filePath = path.join(tempDir, 'mixed.txt');
      fs.writeFileSync(filePath, 'line1\nline2\r\nline3\n', 'utf-8');

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', 'line3', '']);
    });

    it('should handle UTF-8 with BOM', () => {
      const filePath = path.join(tempDir, 'utf8-bom.txt');
      const content = Buffer.from('line1\nline2\n', 'utf-8');
      fs.writeFileSync(filePath, Buffer.concat([BOM_UTF8, content]));

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', '']);
    });

    it('should handle UTF-16 LE with BOM', () => {
      const filePath = path.join(tempDir, 'utf16le.txt');
      const content = encodeUtf16LE('line1\nline2\n');
      fs.writeFileSync(filePath, Buffer.concat([BOM_UTF16_LE, content]));

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', '']);
    });

    it('should handle UTF-16 BE with BOM', () => {
      const filePath = path.join(tempDir, 'utf16be.txt');
      const content = encodeUtf16BE('line1\nline2\n');
      fs.writeFileSync(filePath, Buffer.concat([BOM_UTF16_BE, content]));

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['line1', 'line2', '']);
    });

    it('should handle empty file', () => {
      const filePath = path.join(tempDir, 'empty.txt');
      fs.writeFileSync(filePath, '', 'utf-8');

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['']);
    });

    it('should handle file with unicode content', () => {
      const filePath = path.join(tempDir, 'unicode.txt');
      fs.writeFileSync(filePath, '日本語\n中文\nעברית\n', 'utf-8');

      const lines = linesInFilesSync([filePath]);
      expect(lines).toEqual(['日本語', '中文', 'עברית', '']);
    });

    it('should return empty array for empty paths array', () => {
      const lines = linesInFilesSync([]);
      expect(lines).toEqual([]);
    });
  });

  describe('linesInFiles (async)', () => {
    it('should read lines from a single file asynchronously', async () => {
      const filePath = path.join(tempDir, 'async-utf8.txt');
      fs.writeFileSync(filePath, 'line1\nline2\nline3\n', 'utf-8');

      const lines: string[] = [];
      for await (const line of linesInFiles([filePath])) {
        lines.push(line);
      }
      expect(lines).toEqual(['line1', 'line2', 'line3', '']);
    });

    it('should read lines from multiple files asynchronously', async () => {
      const file1 = path.join(tempDir, 'async1.txt');
      const file2 = path.join(tempDir, 'async2.txt');
      fs.writeFileSync(file1, 'a\nb\n', 'utf-8');
      fs.writeFileSync(file2, 'c\nd\n', 'utf-8');

      const lines: string[] = [];
      for await (const line of linesInFiles([file1, file2])) {
        lines.push(line);
      }
      expect(lines).toEqual(['a', 'b', '', 'c', 'd', '']);
    });

    it('should handle Windows line endings asynchronously', async () => {
      const filePath = path.join(tempDir, 'async-crlf.txt');
      fs.writeFileSync(filePath, 'line1\r\nline2\r\n', 'utf-8');

      const lines: string[] = [];
      for await (const line of linesInFiles([filePath])) {
        lines.push(line);
      }
      expect(lines).toEqual(['line1', 'line2', '']);
    });
  });
});
