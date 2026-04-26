import { generatePrototype, buildFullHtml } from '@/lib/ai/generate-prototype';
import type { Prototype } from '@/lib/ai/generate-prototype';
import { generateDeck, buildDeckHtml } from '@/lib/ai/generate-deck';
import type { Deck } from '@/lib/ai/generate-deck';
import type { Provider, UserApiKeys } from '@/lib/ai/providers';

export type ArtifactType = 'prototype' | 'deck';

export interface GenerateArtifactOptions {
  type: ArtifactType;
  prompt: string;
  brandContextString?: string;
  provider?: Provider;
  userKeys?: UserApiKeys;
}

export type ArtifactResult =
  | { type: 'prototype'; prototype: Prototype; fullHtml: string }
  | { type: 'deck'; deck: Deck; fullHtml: string };

export async function generateArtifact(options: GenerateArtifactOptions): Promise<ArtifactResult> {
  const { type, prompt, brandContextString, provider, userKeys } = options;

  if (type === 'deck') {
    const deck = await generateDeck({ prompt, brandContext: brandContextString, provider, userKeys });
    const fullHtml = buildDeckHtml(deck);
    return { type: 'deck', deck, fullHtml };
  }

  const prototype = await generatePrototype({ prompt, brandContext: brandContextString, provider, userKeys });
  const fullHtml = buildFullHtml(prototype);
  return { type: 'prototype', prototype, fullHtml };
}
