import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel, type Provider, type UserApiKeys } from './providers';
import { PrototypeSchema } from './generate-prototype';

export type LandingPage = z.infer<typeof PrototypeSchema> & { _type: 'landing' };

export interface GenerateLandingOptions {
  prompt: string;
  brandContext?: string;
  provider?: Provider;
  userKeys?: UserApiKeys;
}

const SYSTEM_PROMPT = `You are an expert landing page designer specializing in high-converting marketing sites.
Generate a complete, self-contained landing page as an HTML fragment.

The page MUST include all of these sections:
1. Hero — large headline (use display/serif sizing), subheadline, primary CTA button, optional background visual
2. Features — 3 feature cards or a 3-column grid with icons (use SVG or Unicode), short benefit copy
3. Social proof — 2-3 testimonial quotes or a "trusted by" logo strip (placeholder names/logos are fine)
4. CTA — a second conversion prompt with button, often with a contrasting background
5. Footer — minimal: logo text, 3-4 nav links, copyright line

Design rules:
- Use a scroll-snap or natural scroll layout (not a single viewport)
- CSS custom properties for all colors — makes the design system coherent
- Subtle entrance animations (use @keyframes, not JS timers)
- Fully responsive: desktop and mobile must both look good in an iframe
- Default to a modern dark theme unless brand context specifies light`;

export async function generateLandingPage(opts: GenerateLandingOptions): Promise<LandingPage> {
  const { prompt, brandContext, provider = 'anthropic', userKeys } = opts;
  const model = getModel(provider, userKeys);

  const systemWithBrand = brandContext
    ? `${SYSTEM_PROMPT}\n\nBrand design tokens to apply:\n${brandContext}`
    : SYSTEM_PROMPT;

  const { object } = await generateObject({
    model,
    schema: PrototypeSchema,
    system: systemWithBrand,
    prompt: `Create a landing page for: ${prompt}`,
  });

  return { ...object, _type: 'landing' };
}

export function buildLandingHtml(lp: LandingPage): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${lp.title}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: ${lp.colorBackground}; font-family: ${lp.fontFamily}; color: ${lp.colorPrimary}; }
${lp.css}
</style>
</head>
<body>
${lp.html}
${lp.js ? `<script>\n${lp.js}\n</script>` : ''}
</body>
</html>`;
}
