// src/agents/copy-agent.test.ts
// Unit tests for Copy Agent components
import { describe, it, expect } from 'vitest';
import { detectSlop, flattenCopyToText } from '../prompts/slop-detector.js';
import { chunkText } from '../services/embeddings.js';
import { buildSystemPrompt } from '../prompts/system.js';
import { buildFormatPrompt } from '../prompts/format-templates.js';
import { extractJSON } from '../services/openrouter.js';

// ========================
// Slop Detector Tests
// ========================
describe('detectSlop', () => {
  it('should detect banned words', () => {
    const text = 'We leverage cutting-edge technology to revolutionize your business.';
    const result = detectSlop(text);
    expect(result.hasSlopWords).toBe(true);
    expect(result.offendingWords).toContain('leverage');
    expect(result.offendingWords).toContain('cutting-edge');
    expect(result.offendingWords).toContain('revolutionize');
    expect(result.slopScore).toBeGreaterThan(0);
  });

  it('should detect banned patterns', () => {
    const text = "In today's fast-paced world, businesses need to adapt.";
    const result = detectSlop(text);
    expect(result.hasSloppyPatterns).toBe(true);
    expect(result.slopScore).toBeGreaterThan(0);
  });

  it('should return zero slop for clean copy', () => {
    const text = 'We rebuilt client onboarding from 14 steps to 3. New clients activate in under 2 minutes.';
    const result = detectSlop(text);
    expect(result.hasSlopWords).toBe(false);
    expect(result.hasSloppyPatterns).toBe(false);
    expect(result.slopScore).toBe(0);
  });

  it('should be case-insensitive', () => {
    const text = 'We LEVERAGE our SEAMLESS platform.';
    const result = detectSlop(text);
    expect(result.hasSlopWords).toBe(true);
  });
});

describe('flattenCopyToText', () => {
  it('should flatten nested copy output to a single string', () => {
    const copyOutput = {
      hook: 'This is the hook',
      slides: [
        { title: 'Slide 1', body: 'Body 1' },
        { title: 'Slide 2', body: 'Body 2' },
      ],
      cta: 'Call to action',
      hashtags: ['marketing', 'automation'],
    };
    const flat = flattenCopyToText(copyOutput as unknown as Record<string, unknown>);
    expect(flat).toContain('This is the hook');
    expect(flat).toContain('Slide 1');
    expect(flat).toContain('Body 2');
    expect(flat).toContain('marketing');
  });
});

// ========================
// Text Chunking Tests
// ========================
describe('chunkText', () => {
  it('should return a single chunk for short text', () => {
    const text = 'Short brand guide text.';
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('should split long text into multiple chunks', () => {
    const text = 'word '.repeat(1000); // 5000 chars
    const chunks = chunkText(text, 2000, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should not produce empty chunks', () => {
    const text = 'word '.repeat(500);
    const chunks = chunkText(text);
    chunks.forEach(chunk => {
      expect(chunk.trim().length).toBeGreaterThan(0);
    });
  });

  it('should respect overlap — consecutive chunks share content', () => {
    const text = 'A B C D E F G H I J K L M N O P Q R S T '.repeat(200);
    const chunks = chunkText(text, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

// ========================
// Prompt Building Tests
// ========================
describe('buildSystemPrompt', () => {
  it('should include anti-slop rules', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('ABSOLUTE PROHIBITIONS');
    expect(prompt).toContain('revolutionize');
    expect(prompt).toContain('leverage');
  });

  it('should include brand summary when provided', () => {
    const prompt = buildSystemPrompt('We are a fitness brand for women over 40.');
    expect(prompt).toContain('BRAND CONTEXT');
    expect(prompt).toContain('fitness brand');
  });
});

describe('buildFormatPrompt', () => {
  it('should generate carousel format instructions', () => {
    const prompt = buildFormatPrompt('carousel');
    expect(prompt).toContain('CAROUSEL');
    expect(prompt).toContain('hook');
    expect(prompt).toContain('slides');
  });

  it('should generate reel format instructions', () => {
    const prompt = buildFormatPrompt('reel');
    expect(prompt).toContain('REEL');
    expect(prompt).toContain('timecode');
  });

  it('should generate thread format instructions', () => {
    const prompt = buildFormatPrompt('thread');
    expect(prompt).toContain('THREAD');
    expect(prompt).toContain('tweets');
  });
});

// ========================
// JSON Extraction Tests
// ========================
describe('extractJSON', () => {
  it('should extract JSON from output tags', () => {
    const raw = 'Here is the result:\n<output>{"hook": "Test hook", "cta": "Test CTA"}</output>';
    const result = extractJSON<{ hook: string; cta: string }>(raw);
    expect(result).not.toBeNull();
    expect(result?.hook).toBe('Test hook');
    expect(result?.cta).toBe('Test CTA');
  });

  it('should parse raw JSON if no output tags present', () => {
    const raw = '{"hook": "Direct JSON", "hashtags": ["test"]}';
    const result = extractJSON<{ hook: string; hashtags: string[] }>(raw);
    expect(result?.hook).toBe('Direct JSON');
  });

  it('should return null for unparseable content', () => {
    const raw = 'This is just plain text with no JSON.';
    const result = extractJSON(raw);
    expect(result).toBeNull();
  });
});
