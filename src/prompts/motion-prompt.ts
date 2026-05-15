// src/prompts/motion-prompt.ts
// Elite Motion Design Prompt Engineering System
// Architecture: Content brief → GSAP manifest for Remotion rendering
//
// Philosophy: Motion design is choreography. Every element moves with intention.
// Timing is as important as the visual. Bad timing kills great visuals.

import { callLLM, extractJSON } from '../services/openrouter.js';
import type { ContentType, GSAPManifest, GSAPLayer } from '../types/index.js';

// ========================
// Motion Director System Prompt
// ========================

const MOTION_DIRECTOR_SYSTEM = `You are a senior motion designer with mastery of GSAP (GreenSock Animation Platform) and 15 years experience in commercial video for social media platforms (Instagram, TikTok, LinkedIn).

You have motion directed content for brands including Spotify, Notion, Linear, Vercel, and Stripe. Your work is known for precise timing, elegant transitions, and purposeful motion that enhances message — never distracts from it.

## GSAP CORE PRINCIPLES YOU APPLY IN EVERY PIECE

### Easing Philosophy
Easing is emotion. Choose deliberately:
- \`power4.out\` — Fast in, graceful settle. Authority. Confidence. Used for headlines, CTAs.
- \`power2.inOut\` — Balanced. Professional. Used for container/card movements.
- \`elastic.out(1, 0.5)\` — Playful bounce. Use sparingly. Only for accent elements.
- \`back.out(1.7)\` — Slight overshoot then settle. Modern SaaS aesthetic. Good for icons.
- \`sine.inOut\` — Gentle, flowing. Luxury, wellness, lifestyle brands.
- \`expo.out\` — Aggressive deceleration. Maximum impact for hero moments.
- \`linear\` — Mechanical, robotic. Use for looping progress bars, counters, machine aesthetics.
- \`circ.out\` — Circular deceleration. Feels physical, like something slowing from spin.

### Timing Philosophy
- **Reveal hierarchy:** Primary element first, secondary 0.15-0.20s later, tertiary another 0.15-0.20s.
- **Total entry animation:** 0.4-0.8s per element. Fast means modern. Slow means premium.
- **Hold time:** Text needs 2-4 seconds to read. Never animate away before the viewer reads.
- **Exit animations:** 0.2-0.3s maximum. Exits should feel decisive, not lingering.
- **Stagger:** When animating lists/items, 0.05-0.10s between each. Too much = clunky.

### Motion Direction Rules
- **Text reveals:** Clip mask from bottom (y: 100% → 0%). Never from top. Never fade-only.
- **Cards/containers:** Scale from 0.95 + opacity 0 → 1.0 + opacity 1. Never from 0.
- **Images:** Subtle Ken Burns effect (scale 1.0 → 1.05 over full duration) adds life without distraction.
- **Color transitions:** Never instant color changes. Always 0.3s transition minimum.
- **Background:** Static or extremely slow movement only. Background should not compete with content.

### Platform-Specific Motion Rules

**Instagram Reels (9:16 vertical):**
- First frame must be visually complete even before animation starts (frozen frame test)
- Total duration: 15-60 seconds
- Hook animation must complete in first 3 seconds
- Maximum 3-4 element types per scene
- Transition between scenes: fast wipe (0.2s) or cut — no elaborate transitions

**Instagram Stories (9:16 vertical):**
- Maximum 15 seconds
- One idea per story. One scene.
- Animation must read at 2x speed (assume viewer is tapping quickly)
- Large text. Minimal text. High contrast.

**LinkedIn Posts (16:9 or square):**
- More generous timing (professional audience is patient)
- Motion should feel corporate-premium: controlled, precise
- Data visualizations work well (counters, progress bars, charts)

## LAYER TYPES AND THEIR ANIMATION DEFAULTS

### Text Layer
Always use clip mask reveal (y from below). Never fade. Never scale from zero.
\`\`\`
animation: {
  ease: "power4.out",
  opacity: 1,  // always 1 for text (clip mask controls reveal)
  scale: 1,
  duration: 0.6,
  delay: calculated,
  textMask: true  // REQUIRED for all text layers
}
\`\`\`

### Image Layer
Scale 0.96 → 1.0 with opacity 0 → 1.
\`\`\`
animation: {
  ease: "power2.out",
  opacity: 1,
  scale: 1.0,
  duration: 0.5,
  delay: calculated,
  textMask: false
}
\`\`\`

### Background/Container Layer
ALWAYS animate first (delay: 0). Scale 0.97 → 1.0.
\`\`\`
animation: {
  ease: "expo.out",
  opacity: 1,
  scale: 1.0,
  duration: 0.4,
  delay: 0,
  textMask: false
}
\`\`\`

### Accent/Shape Layer
For geometric decorations, dividers, accent dots.
\`\`\`
animation: {
  ease: "back.out(1.7)",
  opacity: 1,
  scale: 1.0,
  duration: 0.35,
  delay: calculated,
  textMask: false
}
\`\`\`

## OUTPUT FORMAT

Return a complete GSAPManifest JSON inside <output> tags:

\`\`\`
{
  "duration": number,    // total video duration in seconds
  "fps": 30,             // always 30 for social media
  "resolution": {
    "width": number,     // 1080 for vertical/square, 1920 for horizontal
    "height": number     // 1920 for vertical, 1080 for horizontal, 1080 for square
  },
  "layers": [
    {
      "id": "unique-layer-id",
      "type": "text" | "image" | "video" | "shape",
      "content": "text content (if text layer)",
      "assetUrl": "placeholder for image/video layers",
      "animation": {
        "ease": "gsap ease string",
        "opacity": number (0-1),
        "scale": number,
        "duration": number (seconds),
        "delay": number (seconds),
        "textMask": boolean
      }
    }
  ]
}
\`\`\`

CRITICAL: Layer order = render order. First layer = bottom of stack. Last layer = top.
CRITICAL: Every layer needs a unique, descriptive id (e.g., "bg-overlay", "headline-text", "cta-button").
CRITICAL: Total duration must account for all animations including holds.`;

// ========================
// Platform Duration Specs
// ========================

export const MOTION_PLATFORM_SPECS: Record<ContentType, {
  width: number;
  height: number;
  fps: number;
  minDuration: number;
  maxDuration: number;
  recommendation: string;
}> = {
  reel: {
    width: 1080,
    height: 1920,
    fps: 30,
    minDuration: 15,
    maxDuration: 60,
    recommendation: '30 seconds — optimal for algorithm. 3s hook + 22s body + 5s CTA.',
  },
  story: {
    width: 1080,
    height: 1920,
    fps: 30,
    minDuration: 5,
    maxDuration: 15,
    recommendation: '12 seconds — one idea, one scene, maximum retention.',
  },
  carousel: {
    width: 1080,
    height: 1080,
    fps: 30,
    minDuration: 3,
    maxDuration: 8,
    recommendation: '5 seconds per slide. Motion used for entry animation of each slide.',
  },
  caption: {
    width: 1080,
    height: 1350,
    fps: 30,
    minDuration: 3,
    maxDuration: 10,
    recommendation: 'Short loop — 5-8 seconds. Used as animated version of the post image.',
  },
  thread: {
    width: 1920,
    height: 1080,
    fps: 30,
    minDuration: 3,
    maxDuration: 10,
    recommendation: '5 seconds — static-feeling motion (Ken Burns only). Used as header image.',
  },
};

// ========================
// Motion Prompt Input/Output
// ========================

export interface MotionPromptInput {
  copyOutput: {
    hook: string;
    body?: string;
    cta?: string;
    slides?: Array<{ index: number; title: string; body: string }>;
  };
  contentType: ContentType;
  brandTone?: string;
  brandColors?: string;  // e.g., "primary: #000037, accent: #00A79D"
  imageAssetUrls?: string[];  // Pre-generated image URLs to include in motion
}

/**
 * Generates a GSAP manifest for Remotion rendering.
 * The manifest describes every animated layer with precise timing and easing.
 */
export async function generateMotionManifest(input: MotionPromptInput): Promise<GSAPManifest> {
  const { copyOutput, contentType, brandTone, brandColors, imageAssetUrls } = input;
  const platformSpec = MOTION_PLATFORM_SPECS[contentType];

  // Build content inventory for the LLM to work with
  const contentLayers: string[] = [];
  if (copyOutput.hook) contentLayers.push(`Hook: "${copyOutput.hook}"`);
  if (copyOutput.body) contentLayers.push(`Body: "${copyOutput.body.slice(0, 200)}..."`);
  if (copyOutput.slides) {
    copyOutput.slides.forEach(s => {
      contentLayers.push(`Slide ${s.index}: "${s.title}" — ${s.body}`);
    });
  }
  if (copyOutput.cta) contentLayers.push(`CTA: "${copyOutput.cta}"`);

  const assetInventory = imageAssetUrls && imageAssetUrls.length > 0
    ? `\n**Available Image Assets:**\n${imageAssetUrls.map((url, i) => `Asset ${i + 1}: ${url}`).join('\n')}`
    : '\n**No image assets provided** — design text-only composition or use geometric shapes.';

  const userPrompt = `## MOTION DESIGN BRIEF

**Content Type:** ${contentType}
**Platform Spec:** ${platformSpec.width}x${platformSpec.height} @ ${platformSpec.fps}fps
**Recommended Duration:** ${platformSpec.recommendation}

${brandColors ? `**Brand Colors:**\n${brandColors}\n` : ''}
${brandTone ? `**Brand Tone:** ${brandTone}\n` : ''}

**Content to Animate:**
${contentLayers.join('\n')}
${assetInventory}

## YOUR TASK

Design the complete motion sequence for this content.

1. Decide the scene structure — how many scenes/acts does this need?
2. For each scene: what layers exist, what order do they appear, how do they enter and exit?
3. Apply the timing hierarchy rules — reveal in order of importance.
4. Choose easing curves that match the brand tone: ${brandTone ?? 'professional, modern'}.
5. Verify: does the first 3 seconds work as a standalone hook?
6. Verify: does the CTA appear with enough time to read and act?

Return the complete GSAPManifest JSON inside <output></output>.
Every layer must have a unique id. Layers ordered from bottom to top.`;

  const rawOutput = await callLLM({
    systemPrompt: MOTION_DIRECTOR_SYSTEM,
    userPrompt,
    temperature: 0.7,
    maxTokens: 2000,
  });

  const parsed = extractJSON<GSAPManifest>(rawOutput);

  if (!parsed) {
    // Safe fallback manifest
    return buildFallbackManifest(copyOutput.hook, copyOutput.cta, contentType);
  }

  // Enforce platform specs
  return {
    ...parsed,
    fps: platformSpec.fps,
    resolution: {
      width: platformSpec.width,
      height: platformSpec.height,
    },
    duration: Math.min(
      Math.max(parsed.duration, platformSpec.minDuration),
      platformSpec.maxDuration
    ),
  };
}

/**
 * Fallback manifest for when LLM fails to generate a valid manifest.
 * Clean, professional text-only animation.
 */
function buildFallbackManifest(hook: string, cta?: string, contentType: ContentType = 'reel'): GSAPManifest {
  const spec = MOTION_PLATFORM_SPECS[contentType];

  const layers: GSAPLayer[] = [
    {
      id: 'bg-base',
      type: 'shape',
      animation: { ease: 'linear', opacity: 1, scale: 1, duration: 0, delay: 0, textMask: false },
    },
    {
      id: 'hook-text',
      type: 'text',
      content: hook,
      animation: { ease: 'power4.out', opacity: 1, scale: 1, duration: 0.6, delay: 0.2, textMask: true },
    },
  ];

  if (cta) {
    layers.push({
      id: 'cta-text',
      type: 'text',
      content: cta,
      animation: { ease: 'power2.out', opacity: 1, scale: 1, duration: 0.5, delay: spec.minDuration - 3, textMask: true },
    });
  }

  return {
    duration: spec.minDuration,
    fps: spec.fps,
    resolution: { width: spec.width, height: spec.height },
    layers,
  };
}
