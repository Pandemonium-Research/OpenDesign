import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel, type Provider, type UserApiKeys } from './providers';

// Flat schema — avoids anyOf/discriminated unions that Gemini rejects
export const PrototypeSchema = z.object({
  title: z.string().describe('Short descriptive name for this prototype'),
  html: z.string().describe('Complete HTML body content (fragment, no <html>/<head> wrapper)'),
  css: z.string().describe('CSS styles — scoped or with unique class names to avoid collisions'),
  js: z.string().describe('JavaScript for interactivity. Empty string if none needed.'),
  colorPrimary: z.string().describe('Primary color used in hex format e.g. #6366f1'),
  colorBackground: z.string().describe('Background color in hex format e.g. #0f172a'),
  fontFamily: z.string().describe('Font family string e.g. "Inter, system-ui, sans-serif"'),
});

export type Prototype = z.infer<typeof PrototypeSchema>;

export interface GeneratePrototypeOptions {
  prompt: string;
  brandContext?: string;
  provider?: Provider;
  userKeys?: UserApiKeys;
}

const SYSTEM_PROMPT = `You are an expert frontend developer specializing in creating beautiful, production-quality UI components.
Generate complete, self-contained HTML/CSS/JS code that renders correctly in an iframe.
The HTML should be a complete fragment (not a full document). Use semantic HTML5.
CSS should be scoped using unique class names with a "od-" prefix to avoid collisions.
Animations should use CSS keyframes or requestAnimationFrame (not setTimeout-based delays).
Make designs dark-themed, modern, and visually impressive by default.`;

export async function generatePrototype({ prompt, brandContext, provider = 'anthropic', userKeys }: GeneratePrototypeOptions): Promise<Prototype> {
  const model = getModel(provider, userKeys);

  const systemWithBrand = brandContext
    ? `${SYSTEM_PROMPT}\n\nBrand design tokens to use:\n${brandContext}`
    : SYSTEM_PROMPT;

  const { object } = await generateObject({
    model,
    schema: PrototypeSchema,
    system: systemWithBrand,
    prompt,
  });

  return object;
}

export function buildFullHtml(prototype: Prototype): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${prototype.title}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; }
body { background: ${prototype.colorBackground}; font-family: ${prototype.fontFamily}; }
${prototype.css}
</style>
</head>
<body>
${prototype.html}
${prototype.js ? `<script>\n${prototype.js}\n</script>` : ''}
</body>
</html>`;
}
