// src/prompts/visual-prompt.ts
// Elite Visual Prompt Engineering System
// Architecture: 8-dimension photography brief → Freepik-optimized prompt
//
// Quality philosophy: We write prompts as if briefing a commercial photographer
// at a Getty Images editorial shoot. Technical precision + artistic direction.

import { callLLM, extractJSON } from '../services/openrouter.js';
import type { ContentType } from '../types/index.js';

// ========================
// Prompt System Definition
// ========================

const VISUAL_DIRECTOR_SYSTEM = `You are a world-class visual art director and commercial photographer with 20 years of experience.

You have shot for Vogue, Wired, Fast Company, Monocle, and worked as creative director for Nike, Apple, and Airbnb campaigns.

Your task: given a content brief, generate a professional photography prompt for an AI image generator.

## YOUR 8-DIMENSION PHOTOGRAPHY BRIEF SYSTEM

Every prompt you write covers exactly these 8 dimensions. Missing any dimension produces inferior results.

### 1. SUBJECT
Who or what is the central element. Include:
- Demographics (age range, ethnicity where relevant, profession/archetype)
- Emotional state and expression (genuine, not posed/stock-photo)
- Action or gesture (what they are actively doing)
- Wardrobe cues that signal the brand's world

### 2. ENVIRONMENT
The world the subject inhabits:
- Location archetype (rooftop terrace, kitchen counter, studio office, coffee shop)
- Time of day (signals lighting conditions)
- Foreground/background balance
- Props that tell the story without words

### 3. CAMERA & OPTICS (be specific — vague = generic results)
- Camera body: Sony A7 III, Canon EOS R5, Hasselblad X2D, Leica SL2
- Lens: 35mm f/1.4, 85mm f/1.8, 50mm f/1.2, 135mm f/2
- Aperture: controls depth of field (f/1.4 = shallow, f/8 = deep)
- Focal length impacts subject compression and spatial relationship

### 4. LIGHTING (the single biggest quality differentiator)
- Type: natural window light, golden hour, overcast diffused, Rembrandt, split, clamshell, three-point
- Direction: front, side (45°), back, overhead, beneath
- Quality: hard (direct sun, bare flash) vs. soft (overcast, bounced)
- Modifiers: softbox, beauty dish, octabox, reflector fill
- Mood created: intimate, editorial, dramatic, soft, commercial

### 5. COLOR & TONE (color grading aesthetic)
- Film stock reference: Kodak Portra 400, Fuji Pro 400H, Kodak Ektar, Ilford HP5
- Color palette: warm/cool, saturated/muted, complementary/analogous
- Contrast level: high contrast, low contrast, flat/matte
- Highlight treatment: lifted blacks, crushed shadows, halation
- Overall mood: cinematic, editorial, documentary, commercial, luxury

### 6. COMPOSITION
- Framing: portrait, landscape, square
- Rule of thirds: subject placement
- Leading lines: architectural or natural
- Negative space: how much empty space and where
- Layers: foreground/midground/background separation

### 7. STYLE REFERENCE (gives the AI a visual anchor)
- Photography style: editorial, commercial, documentary, fine art, street
- Cultural reference: specific magazine, campaign, photographer's style
- Brand alignment: luxury/accessible, aspirational/relatable, premium/approachable

### 8. TECHNICAL QUALITY TAGS
- Resolution: hyperrealistic, 8K ultra-detailed, ultra-sharp
- Rendering quality: photo-realistic, not AI-generated look, genuine photograph
- Specific quality: fine grain texture, skin texture detail, fabric texture detail

## NEGATIVE PROMPT (equally important as positive)
Always specify what NOT to generate. Common traps:
- Stock photo clichés: forced smile, handshake, pointing at screen
- AI artifacts: extra fingers, melted text, warped reflections
- Brand violations: wrong colors, wrong tone, wrong demographic
- Technical failures: soft focus, motion blur (unless intentional), overexposed
- Generic aesthetics: white background studio shots (unless requested)

## CRITICAL RULES
1. NEVER use vague descriptors like "beautiful", "amazing", "perfect". Use technical language.
2. NEVER describe what cannot be photographed (emotions, concepts). Show through visual cues.
3. The negative prompt is as long and detailed as the positive prompt.
4. Match aspect ratio to platform specs exactly.
5. Prompts for human subjects must specify natural expression — no forced, stock-photo-style posing.

## OUTPUT FORMAT
Return a JSON object inside <output> tags with this exact structure:
{
  "concept": "One sentence describing the visual concept (for human reference only)",
  "positivePrompt": "Full photography prompt using all 8 dimensions, comma-separated, ~150-200 words",
  "negativePrompt": "Full negative prompt, comma-separated, ~80-100 words",
  "aspectRatio": "1:1" | "9:16" | "16:9" | "4:5",
  "styleNote": "Brief note on the specific visual style being targeted (for HITL review)"
}`;

// ========================
// Platform Specs
// ========================

export const PLATFORM_SPECS: Record<ContentType, { aspectRatio: string; cropNote: string }> = {
  carousel: {
    aspectRatio: '1:1',
    cropNote: 'Square format. Subject centered. Safe zone: leave 10% margin on all sides for text overlay areas.',
  },
  reel: {
    aspectRatio: '9:16',
    cropNote: 'Vertical 9:16 format. Subject in upper 60% of frame. Bottom 30% reserved for captions/subtitles area.',
  },
  story: {
    aspectRatio: '9:16',
    cropNote: 'Vertical 9:16 format. Minimal composition. Strong focal point. Works at small display sizes.',
  },
  caption: {
    aspectRatio: '4:5',
    cropNote: 'Portrait 4:5 format. Slightly taller than square. Subject center-weighted.',
  },
  thread: {
    aspectRatio: '16:9',
    cropNote: 'Landscape 16:9 format. Wide composition. Works as link preview image.',
  },
};

// ========================
// Industry-Specific Photography Archetypes
// ========================

const INDUSTRY_ARCHETYPES: Record<string, string> = {
  fitness: 'Athletic lifestyle photography. Movement, energy, sweat authenticity. Natural gym or outdoor settings. Action blur acceptable. Strong directional lighting.',
  food: 'Food editorial photography. Overhead (flat lay) or 45-degree angle. Natural window light preferred. Steam, texture, color contrast. Hero shot principles.',
  technology: 'Tech editorial photography. Clean environments. Focused UI/screen reflection. Professional but approachable. Sony A7 + 35mm aesthetic.',
  fashion: 'Editorial fashion photography. Environmental portrait. Street or architectural backdrop. Dynamic but controlled. Monocle/Kinfolk aesthetic.',
  finance: 'Premium financial services photography. Trust through environment. Luxury office, city views, quality materials. Conservative palette with one accent color.',
  healthcare: 'Healthcare lifestyle photography. Clean, hopeful, human. Natural light preferred. Authentic patient/professional interaction. Not clinical/hospital unless specified.',
  education: 'Education photography. Curious, engaged expressions. Learning environments. Authentic collaboration. Not posed "studying" stock photo tropes.',
  ecommerce: 'Product lifestyle photography. Hero product with environmental context. User-in-context preferred over isolated product. Brand-consistent color world.',
  marketing: 'Marketing agency photography. Creative workspace aesthetic. Confident professionals. Results-oriented visual storytelling. Campaign/brand world references.',
  restaurant: 'Restaurant & hospitality photography. Ambiance over food (unless food-focused). Natural warm light. Linen, material, craft emphasis. Gesture and interaction.',
};

// ========================
// Core Function
// ========================

export interface VisualPromptInput {
  hook: string;           // From Copy Agent output
  contentType: ContentType;
  brandContext?: string;  // From Brand Guide RAG
  clientName?: string;
  industry?: string;
  tone?: string;
  visualDirection?: string; // Optional operator override
}

export interface VisualPromptOutput {
  concept: string;
  positivePrompt: string;
  negativePrompt: string;
  aspectRatio: string;
  styleNote: string;
}

/**
 * Generates an elite-grade visual prompt using the 8-dimension photography system.
 * This is the creative engine behind all image generation in Creative Brain.
 */
export async function generateVisualPrompt(input: VisualPromptInput): Promise<VisualPromptOutput> {
  const { hook, contentType, brandContext, clientName, industry, tone, visualDirection } = input;
  const platformSpec = PLATFORM_SPECS[contentType];
  const industryArchetype = industry ? INDUSTRY_ARCHETYPES[industry.toLowerCase()] : null;

  const userPrompt = `## CREATIVE BRIEF

**Content Hook (drives visual concept):**
"${hook}"

**Content Type:** ${contentType} — ${platformSpec.cropNote}

**Target Aspect Ratio:** ${platformSpec.aspectRatio}

${clientName ? `**Brand/Client:** ${clientName}` : ''}
${tone ? `**Brand Tone:** ${tone}` : ''}

${industryArchetype ? `**Industry Photography Style:**\n${industryArchetype}` : ''}

${brandContext ? `**Brand Visual Context (from Brand Guide):**\n${brandContext}` : ''}

${visualDirection ? `**Operator Visual Direction:**\n${visualDirection}` : ''}

## YOUR TASK

1. Read the hook. Understand the emotional intent and message.
2. Decide: what photograph would make someone STOP scrolling and understand the hook's promise instantly?
3. Apply your 8-dimension system to build a technically precise photography brief.
4. The image must work standalone — if the hook was removed, the image should still communicate the core message visually.
5. For human subjects: specify AUTHENTIC expressions. Never "smiling at camera", never "pointing at laptop". Show them mid-action, mid-thought, in their world.

Generate the visual prompt now. Respond only with JSON inside <output></output>.`;

  const rawOutput = await callLLM({
    systemPrompt: VISUAL_DIRECTOR_SYSTEM,
    userPrompt,
    temperature: 0.8,  // Slightly higher temp for creative variety
    maxTokens: 1200,
  });

  const parsed = extractJSON<VisualPromptOutput>(rawOutput);

  if (!parsed) {
    // Fallback: construct a safe, decent prompt from the hook
    return {
      concept: `Visual for: ${hook}`,
      positivePrompt: `professional editorial photography, ${hook.toLowerCase()}, natural window light, Sony A7 III 50mm f/1.8, shallow depth of field, warm neutral tones, authentic expression, ${platformSpec.aspectRatio} aspect ratio, hyperrealistic, 8K`,
      negativePrompt: 'watermark, text overlay, logo, blurry, low quality, cartoon, illustration, AI artifacts, stock photo pose, forced smile, pointing at camera, generic office',
      aspectRatio: platformSpec.aspectRatio,
      styleNote: 'Auto-generated fallback prompt',
    };
  }

  // Enforce platform aspect ratio (don't let LLM override)
  return { ...parsed, aspectRatio: platformSpec.aspectRatio };
}

// ========================
// Thumbnail-Specific Prompt System
// ========================

const THUMB_DIRECTOR_SYSTEM = `You are a specialist in YouTube and Instagram thumbnail design, trained on the highest-performing thumbnails across all major content categories.

You understand the psychology of scroll-stopping: high contrast, single focal point, emotional face expression, bold color, legible at 150px width.

Your task: given a content hook, generate a photography prompt for a thumbnail/cover image.

## THUMBNAIL RULES (non-negotiable)

1. **One subject, one message.** Thumbnails with multiple competing elements fail.
2. **Face or no face — not both.** If using a person, their face must dominate 40-60% of the frame. No landscape thumbnails with tiny distant people.
3. **Emotional amplification.** The expression must read clearly at thumbnail size. Subtle expressions don't work. Think: surprise, confidence, curiosity, concern.
4. **Color blocking.** The background should be a single dominant color that contrasts with the subject.
5. **Depth matters.** Sharp subject against soft/blurred background. f/1.4 thinking even in a prompt.
6. **Text-safe zone.** Leave 30% of the frame empty for text overlay (usually bottom or right side).

## OUTPUT FORMAT
Return JSON inside <output> tags:
{
  "concept": "What this thumbnail communicates at a glance",
  "positivePrompt": "Full photography prompt optimized for thumbnail use, ~120-150 words",
  "negativePrompt": "What to exclude, ~60 words",
  "aspectRatio": "16:9",
  "expressionNote": "The specific facial expression/body language to achieve"
}`;

export interface ThumbPromptInput {
  hook: string;
  brandContext?: string;
  clientName?: string;
  industry?: string;
}

export interface ThumbPromptOutput {
  concept: string;
  positivePrompt: string;
  negativePrompt: string;
  aspectRatio: string;
  expressionNote: string;
}

/**
 * Generates a thumbnail-optimized visual prompt.
 * Specialized for high click-through rate at small display sizes.
 */
export async function generateThumbPrompt(input: ThumbPromptInput): Promise<ThumbPromptOutput> {
  const { hook, brandContext, clientName, industry } = input;
  const industryArchetype = industry ? INDUSTRY_ARCHETYPES[industry.toLowerCase()] : null;

  const userPrompt = `## THUMBNAIL BRIEF

**Hook to visualize:**
"${hook}"

${clientName ? `**Client:** ${clientName}` : ''}
${industryArchetype ? `**Industry context:** ${industryArchetype}` : ''}
${brandContext ? `**Brand context:** ${brandContext}` : ''}

Create a thumbnail image that:
- Reads immediately at 300px width
- Creates curiosity about the content
- Matches the emotional promise of the hook
- Has one dominant visual element

The thumbnail must EARN the click. Generate the prompt now. JSON inside <output></output>.`;

  const rawOutput = await callLLM({
    systemPrompt: THUMB_DIRECTOR_SYSTEM,
    userPrompt,
    temperature: 0.8,
    maxTokens: 800,
  });

  const parsed = extractJSON<ThumbPromptOutput>(rawOutput);

  if (!parsed) {
    return {
      concept: `Thumbnail for: ${hook}`,
      positivePrompt: `portrait photograph, confident professional expression, one person, shallow depth of field Sony 85mm f/1.4, single-color background high contrast, editorial lighting, hyperrealistic, text-safe zone on right third`,
      negativePrompt: 'cluttered background, multiple people, small face, generic stock pose, watermark, text, logo',
      aspectRatio: '16:9',
      expressionNote: 'Confident, direct eye contact',
    };
  }

  return { ...parsed, aspectRatio: '16:9' };
}
