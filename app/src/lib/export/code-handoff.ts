import { generateText } from 'ai';
import { getModel, type Provider, type UserApiKeys } from '@/lib/ai/providers';

export type HandoffFramework = 'react' | 'vue' | 'svelte';

export interface CodeHandoffOptions {
  html: string;
  css: string;
  js: string;
  title: string;
  framework: HandoffFramework;
  provider?: Provider;
  userKeys?: UserApiKeys;
}

const FRAMEWORK_INSTRUCTIONS: Record<HandoffFramework, string> = {
  react: `Convert the HTML/CSS/JS into a single self-contained React functional component written in TypeScript.
- Use "import React from 'react';" at the top.
- Inline the CSS as a <style> tag string injected via dangerouslySetInnerHTML on a style element OR use a styled JSX approach — whichever is cleaner.
- Convert JS event handlers to React event handler props (onClick, onMouseEnter, etc.) when straightforward. Leave complex imperative DOM logic in a useEffect.
- Export the component as "export default function ComponentName()".
- The output must be a single .tsx file, nothing else. No markdown fences.`,

  vue: `Convert the HTML/CSS/JS into a single Vue 3 Single File Component (.vue) using the Composition API (<script setup lang="ts">).
- Keep the <template>, <script setup>, and <style scoped> blocks.
- Convert JS event handlers to Vue event handlers (@click, @mouseenter, etc.) where possible. Use onMounted / onUnmounted for imperative DOM logic.
- The output must be the raw .vue file content, nothing else. No markdown fences.`,

  svelte: `Convert the HTML/CSS/JS into a single Svelte 5 component (.svelte).
- Keep HTML in the template, JS in a <script lang="ts"> block, CSS in a <style> block.
- Convert event handlers to Svelte syntax (onclick={...}, onmouseenter={...}).
- Use $state() rune for reactive variables; use $effect() for imperative DOM logic.
- The output must be the raw .svelte file content, nothing else. No markdown fences.`,
};

export async function generateCodeHandoff({
  html,
  css,
  js,
  title,
  framework,
  provider = 'anthropic',
  userKeys,
}: CodeHandoffOptions): Promise<string> {
  const model = getModel(provider, userKeys);
  const componentName = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  const { text } = await generateText({
    model,
    system: FRAMEWORK_INSTRUCTIONS[framework],
    prompt: `Component name: ${componentName || 'GeneratedComponent'}

HTML:
${html}

CSS:
${css}

JavaScript:
${js || '// No JS'}`,
    maxOutputTokens: 4096,
  });

  return text.trim();
}
