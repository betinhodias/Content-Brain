// src/prompts/format-templates.ts
// Format Layer — per-content-type output schemas and instructions
import type { ContentType } from '../types/index.js';

export interface FormatTemplate {
  description: string;
  outputSchema: string;
  guidelines: string;
}

export const FORMAT_TEMPLATES: Record<ContentType, FormatTemplate> = {
  carousel: {
    description: 'Instagram/LinkedIn carousel post (multiple slides)',
    outputSchema: `{
  "hook": "First slide headline — must stop the scroll. Max 8 words. No punctuation at the end.",
  "slides": [
    { "index": 1, "title": "Short slide title", "body": "2-4 lines of content. One idea per slide." },
    { "index": 2, "title": "Short slide title", "body": "2-4 lines of content." }
  ],
  "cta": "Last slide — specific action. Not 'learn more'. Ex: 'DM us the word AUDIT for a free analysis'",
  "caption": "Post caption for the feed. 3-5 lines. Hook + value + CTA. Include hashtag placeholder: {{hashtags}}",
  "hashtags": ["relevant", "hashtags", "max10", "noGeneric"]
}`,
    guidelines: `
- Minimum 4 slides, maximum 8 slides.
- Each slide should have ONE core idea. Never cram two ideas into one slide.
- The hook (slide 1) must create a strong reason to keep swiping. Use a surprising fact, a bold claim, or a provocative question.
- Use short sentences. Each line of body copy should be readable in under 3 seconds.
- The CTA slide should be specific and low-friction. Tell the exact next step.
- Hashtags: mix niche (3-4), topic (3-4), and brand (1-2). No generic hashtags like #marketing or #business.`,
  },

  reel: {
    description: 'Instagram/TikTok/LinkedIn short video script (15-60 seconds)',
    outputSchema: `{
  "hook": "First 3 seconds. Spoken line OR on-screen text. Must create immediate curiosity or interrupt pattern.",
  "script": [
    { "timecode": "0:00-0:03", "visual": "What appears on screen", "voiceover": "Spoken words or silence" },
    { "timecode": "0:03-0:15", "visual": "B-roll or talking head", "voiceover": "Core message" },
    { "timecode": "0:15-0:30", "visual": "Proof or demonstration", "voiceover": "Supporting point" },
    { "timecode": "0:30-0:45", "visual": "CTA scene", "voiceover": "Call to action" }
  ],
  "caption": "Short caption for feed. Hook line + 2-3 value lines + CTA. Under 150 chars recommended.",
  "hashtags": ["relevant", "hashtags", "max10"]
}`,
    guidelines: `
- Hook must hit in the first 2-3 seconds. No slow build-ups.
- Write voiceover for how people actually speak — contractions, short sentences, natural rhythm.
- Visuals should complement the voiceover, not repeat it.
- Total script should be readable in 30-60 seconds at natural speaking pace (~140 words/min).
- CTA should be said out loud AND shown as text on screen.`,
  },

  story: {
    description: 'Instagram/LinkedIn Story (ephemeral, 15-second format)',
    outputSchema: `{
  "hook": "Ultra-short hook. 3-5 words MAX. Bold, provocative, specific.",
  "body": "1-2 sentences only. One single, punchy message.",
  "cta": "Swipe up text OR poll question OR tap-to-reveal text.",
  "visual_note": "Brief description of the visual/design feel that would complement this copy."
}`,
    guidelines: `
- Stories are glanced at for 1-2 seconds before the viewer decides to watch or skip.
- Be brutal about brevity. If you can say it in 5 words instead of 10, use 5.
- CTAs work best as questions (poll) or commands (swipe up for X, DM for Y).`,
  },

  caption: {
    description: 'Standalone Instagram/LinkedIn feed post caption',
    outputSchema: `{
  "hook": "First line — the only line visible before 'more'. Must earn the tap. Max 140 chars.",
  "body": "2-5 short paragraphs. Each separated by a blank line. Each paragraph = one idea.",
  "cta": "Final line — specific action. What exactly should the reader do right now?",
  "hashtags": ["relevant", "hashtags", "max10"]
}`,
    guidelines: `
- The hook is everything. Most people never tap "more". Write the hook as if it's a standalone post.
- Use line breaks aggressively. Dense walls of text get skipped.
- Vary sentence length. Mix short punches with slightly longer explanatory sentences.
- End every paragraph with either a fact that makes the reader want more, or a transition that pulls them forward.
- The CTA should be concrete: not "follow for more" but "save this post for the next time your client asks for X".`,
  },

  thread: {
    description: 'LinkedIn/Twitter/X thread format',
    outputSchema: `{
  "hook": "Tweet 1 — the reason people read the thread. Standalone value + promise. Max 280 chars.",
  "tweets": [
    { "index": 2, "content": "Thread tweet content. One idea. Max 280 chars." },
    { "index": 3, "content": "Thread tweet content." }
  ],
  "closer": "Final tweet — summarize + CTA. Retweet-worthy standalone. Max 280 chars.",
  "hashtags": ["max3", "relevant"]
}`,
    guidelines: `
- Thread tweet 1 must work as a standalone post AND promise more value if the reader continues.
- Each subsequent tweet should deliver ONE piece of value. No filler transitions.
- Minimum 5 tweets, maximum 10 tweets.
- Final tweet should be quotable on its own — many people share only the last tweet.
- Keep hashtags to a maximum of 3 — threads don't need hashtag stuffing.`,
  },
};

export function getFormatTemplate(contentType: ContentType): FormatTemplate {
  return FORMAT_TEMPLATES[contentType];
}

export function buildFormatPrompt(contentType: ContentType): string {
  const template = getFormatTemplate(contentType);
  return `## OUTPUT FORMAT: ${contentType.toUpperCase()}

You are writing a **${template.description}**.

### Output Schema (return this exact structure as JSON inside <output> tags):
\`\`\`json
${template.outputSchema}
\`\`\`

### Format Guidelines:
${template.guidelines}`;
}
