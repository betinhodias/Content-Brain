// src/remotion/Root.tsx
// Remotion Root — registers all compositions for the bundler
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { ReelComposition } from './compositions/ReelComposition.js';
import type { GSAPManifest } from '../types/index.js';

// Default manifests for preview in Remotion Studio
const defaultReelManifest: GSAPManifest = {
  duration: 30,
  fps: 30,
  resolution: { width: 1080, height: 1920 },
  layers: [
    {
      id: 'bg-base',
      type: 'shape',
      animation: { ease: 'linear', opacity: 1, scale: 1, duration: 0, delay: 0, textMask: false },
    },
    {
      id: 'hook-text',
      type: 'text',
      content: 'Preview Hook Text',
      animation: { ease: 'power4.out', opacity: 1, scale: 1, duration: 0.6, delay: 0.2, textMask: true },
    },
    {
      id: 'cta-text',
      type: 'text',
      content: 'Swipe Up →',
      animation: { ease: 'power2.out', opacity: 1, scale: 1, duration: 0.5, delay: 26, textMask: true },
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelComposition"
        component={ReelComposition}
        durationInFrames={900}  // 30s @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          manifest: defaultReelManifest,
          copyOutput: { hook: 'Preview hook', cta: 'Preview CTA' },
        }}
      />
      <Composition
        id="StoryComposition"
        component={ReelComposition}  // Story uses same composition, different manifest
        durationInFrames={360}  // 12s @ 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          manifest: { ...defaultReelManifest, duration: 12 },
          copyOutput: { hook: 'Preview story hook', cta: 'Tap to see more' },
        }}
    </>
  );
};

registerRoot(RemotionRoot);

