// src/prompts/slop-detector.ts
// Post-generation AI Slop detection
// Scans output for banned words and patterns before returning to client.

const BANNED_WORDS = [
  'revolutionize', 'revolutionizing', 'revolutionary',
  'leverage', 'leveraging',
  'game-changer', 'game-changing',
  'synergy', 'synergistic',
  'empower', 'empowering',
  'unlock', 'unlocking',
  'seamless', 'seamlessly',
  'cutting-edge',
  'state-of-the-art',
  'innovative', 'innovation',
  'transform', 'transformative', 'transformation',
  'disrupt', 'disruptive', 'disruption',
  'elevate', 'elevating',
  'holistic',
  'end-to-end',
  'best-in-class',
  'world-class',
  'robust',
  'streamline', 'streamlined', 'streamlining',
  'pain points',
  'value proposition',
  'ecosystem',
  'digital transformation',
  'next-level',
];

const BANNED_PATTERNS = [
  /in today'?s fast-?paced world/i,
  /are you tired of/i,
  /imagine a world where/i,
  /we are excited to announce/i,
  /it'?s no secret that/i,
  /as we all know/i,
  /in this day and age/i,
  /it goes without saying/i,
  /at the end of the day/i,
  /it'?s important to note/i,
  /this is crucial/i,
  /this is critical/i,
  /don'?t wait[,—].{0,20}act now/i,
  /contact us today to get started/i,
];

export interface SlopCheckResult {
  hasSlopWords: boolean;
  hasSloppyPatterns: boolean;
  offendingWords: string[];
  offendingPatterns: string[];
  slopScore: number;  // 0-100, lower is better
}

/**
 * Analyzes text for AI slop indicators.
 * Returns a structured report — does NOT block output, just flags issues.
 */
export function detectSlop(text: string): SlopCheckResult {
  const lowerText = text.toLowerCase();

  const offendingWords = BANNED_WORDS.filter(word =>
    lowerText.includes(word.toLowerCase())
  );

  const offendingPatterns: string[] = [];
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      offendingPatterns.push(pattern.source);
    }
  }

  // Score: 10 points per banned word, 20 per banned pattern, capped at 100
  const slopScore = Math.min(
    100,
    offendingWords.length * 10 + offendingPatterns.length * 20
  );

  return {
    hasSlopWords: offendingWords.length > 0,
    hasSloppyPatterns: offendingPatterns.length > 0,
    offendingWords,
    offendingPatterns,
    slopScore,
  };
}

/**
 * Flattens a copy output object to a single string for analysis.
 */
export function flattenCopyToText(copyOutput: Record<string, unknown>): string {
  function extract(obj: unknown): string {
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(extract).join(' ');
    if (obj && typeof obj === 'object') {
      return Object.values(obj).map(extract).join(' ');
    }
    return '';
  }
  return extract(copyOutput);
}
