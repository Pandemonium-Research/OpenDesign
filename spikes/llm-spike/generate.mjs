/**
 * LLM spike: multi-provider prototype generation via AI SDK generateObject
 *
 * Tests that Anthropic/OpenAI/Gemini all return a stable { html, css, js, title } schema.
 * Run with: ANTHROPIC_API_KEY=... node generate.mjs
 * or:        OPENAI_API_KEY=... PROVIDER=openai node generate.mjs
 * or:        GOOGLE_GENERATIVE_AI_API_KEY=... PROVIDER=gemini node generate.mjs
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const PROVIDER = process.env.PROVIDER || 'anthropic';

// Flat Zod schema — avoids anyOf/discriminated unions that Gemini rejects
const PrototypeSchema = z.object({
  title: z.string().describe('Short descriptive name for this prototype'),
  html: z.string().describe('Complete HTML body content (no <html>/<head> wrapper needed)'),
  css: z.string().describe('CSS styles for the component'),
  js: z.string().describe('JavaScript for interactivity (empty string if none needed)'),
  colorPrimary: z.string().describe('Primary color used (hex)'),
  colorBackground: z.string().describe('Background color (hex)'),
  fontFamily: z.string().describe('Font family used'),
});

// Sample brand context (would come from design token ingestion in production)
const BRAND_CONTEXT = `
Design tokens (W3C DTCG format):
- Primary color: #6366f1 (indigo)
- Background: #0f172a (dark slate)
- Surface: #1e293b
- Text primary: #f1f5f9
- Text muted: #94a3b8
- Border radius: 12px
- Font: Inter, system-ui
- Spacing unit: 8px
`;

const PROMPT = `Create a beautiful dark-themed hero section for a SaaS product called "OpenDesign".
It should have: a headline, subheadline, a CTA button, and floating animated cards showing features.
Use the provided brand tokens. Make it production-quality with smooth animations.`;

function getModel(provider) {
  switch (provider) {
    case 'openai':
      return openai('gpt-4o');
    case 'gemini':
      return google('gemini-2.0-flash');
    case 'anthropic':
    default:
      return anthropic('claude-sonnet-4-6');
  }
}

async function run() {
  console.log(`Testing provider: ${PROVIDER}`);
  console.log('Generating prototype...\n');

  const model = getModel(PROVIDER);

  const { object, usage } = await generateObject({
    model,
    schema: PrototypeSchema,
    system: `You are an expert frontend developer specializing in creating beautiful, production-quality UI components.
Generate complete, self-contained HTML/CSS/JS code that can be rendered in an iframe.
The HTML should be a complete fragment (not full document). CSS should be scoped or use unique class names.
Brand context:\n${BRAND_CONTEXT}`,
    prompt: PROMPT,
  });

  console.log('Generated prototype:');
  console.log('  Title:', object.title);
  console.log('  Primary color:', object.colorPrimary);
  console.log('  Background:', object.colorBackground);
  console.log('  Font:', object.fontFamily);
  console.log('  HTML length:', object.html.length, 'chars');
  console.log('  CSS length:', object.css.length, 'chars');
  console.log('  JS length:', object.js.length, 'chars');
  console.log('\nUsage:', usage);

  // Write output to file for inspection
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${object.title}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${object.colorBackground}; font-family: ${object.fontFamily}; }
${object.css}
</style>
</head>
<body>
${object.html}
${object.js ? `<script>\n${object.js}\n</script>` : ''}
</body>
</html>`;

  import('fs').then(fs => {
    fs.writeFileSync(`output-${PROVIDER}.html`, fullHtml);
    console.log(`\nSUCCESS: output-${PROVIDER}.html written.`);
    console.log(`LLM spike PASSED for provider: ${PROVIDER}`);
  });
}

run().catch((err) => {
  console.error('FAILED:', err.message);
  if (err.message.includes('API key') || err.message.includes('authentication')) {
    console.error(`Set the appropriate API key env var for provider "${PROVIDER}"`);
    console.error('  Anthropic: ANTHROPIC_API_KEY');
    console.error('  OpenAI:    OPENAI_API_KEY');
    console.error('  Gemini:    GOOGLE_GENERATIVE_AI_API_KEY');
  }
  process.exit(1);
});
