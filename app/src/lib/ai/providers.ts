import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export type Provider = 'anthropic' | 'openai' | 'gemini' | 'ollama';

export const PROVIDER_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  ollama: process.env.OLLAMA_MODEL ?? 'llama3.2',
};

// Shared openai client (cloud)
const openaiClient = createOpenAI({});

export function getModel(provider: Provider = 'anthropic'): LanguageModel {
  switch (provider) {
    case 'openai':
      return openaiClient(PROVIDER_MODELS.openai);
    case 'gemini':
      return google(PROVIDER_MODELS.gemini);
    case 'ollama': {
      // Ollama exposes an OpenAI-compatible API at /v1
      const ollamaClient = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
        apiKey: 'ollama',
      });
      return ollamaClient(PROVIDER_MODELS.ollama);
    }
    case 'anthropic':
    default:
      return anthropic(PROVIDER_MODELS.anthropic);
  }
}
