import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export type Provider = 'anthropic' | 'openai' | 'gemini' | 'ollama';

export interface UserApiKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
}

export const PROVIDER_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  ollama: process.env.OLLAMA_MODEL ?? 'llama3.2',
};

export function getModel(provider: Provider = 'anthropic', userKeys?: UserApiKeys): LanguageModel {
  switch (provider) {
    case 'openai': {
      const client = createOpenAI({ apiKey: userKeys?.openai });
      return client(PROVIDER_MODELS.openai);
    }
    case 'gemini': {
      const client = createGoogleGenerativeAI({ apiKey: userKeys?.google });
      return client(PROVIDER_MODELS.gemini);
    }
    case 'ollama': {
      const ollamaClient = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
        apiKey: 'ollama',
      });
      return ollamaClient(PROVIDER_MODELS.ollama);
    }
    case 'anthropic':
    default: {
      const client = createAnthropic({ apiKey: userKeys?.anthropic });
      return client(PROVIDER_MODELS.anthropic);
    }
  }
}

/** Returns true if the user or server env has a key for the given provider */
export function hasKeyForProvider(provider: Provider, userKeys?: UserApiKeys): boolean {
  switch (provider) {
    case 'anthropic': return !!(userKeys?.anthropic || process.env.ANTHROPIC_API_KEY);
    case 'openai':    return !!(userKeys?.openai    || process.env.OPENAI_API_KEY);
    case 'gemini':    return !!(userKeys?.google    || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    case 'ollama':    return true;
  }
}
