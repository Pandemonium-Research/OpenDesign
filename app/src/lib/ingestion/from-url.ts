import { css_to_tokens } from '@projectwallace/css-design-tokens';

export interface BrandContext {
  sourceUrl: string;
  colors: string[];
  fontFamilies: string[];
  fontSizes: string[];
  rawCss: string;
  dtcgTokens: Record<string, unknown>;
  brandContextString: string;
}

interface DtcgColorValue { colorSpace: string; components: number[]; alpha: number }
interface DtcgDimensionValue { value: number; unit: string }
interface DtcgToken {
  $type: string;
  $value: unknown;
  $extensions?: Record<string, unknown>;
}

function colorToHex(val: DtcgColorValue): string {
  const [r, g, b] = val.components.map((c) => Math.round(c * 255));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export async function ingestFromUrl(url: string): Promise<BrandContext> {
  const pageRes = await fetch(url, {
    headers: { 'User-Agent': 'OpenDesign/1.0 (design-token-ingestion)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!pageRes.ok) throw new Error(`Failed to fetch ${url}: ${pageRes.status}`);
  const html = await pageRes.text();

  // Extract stylesheet URLs and inline styles
  const styleUrls: string[] = [];
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
  const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1];
    styleUrls.push(href.startsWith('http') ? href : new URL(href, url).href);
  }

  const inlineStyles: string[] = [];
  while ((match = styleTagRe.exec(html)) !== null) {
    inlineStyles.push(match[1]);
  }

  // Fetch external stylesheets (best-effort, ignore failures)
  const sheetTexts = await Promise.allSettled(
    styleUrls.map(async (sheetUrl) => {
      const res = await fetch(sheetUrl, {
        headers: { 'User-Agent': 'OpenDesign/1.0' },
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? res.text() : '';
    })
  );

  const allCss = [
    ...inlineStyles,
    ...sheetTexts.map((r) => (r.status === 'fulfilled' ? r.value : '')),
  ].join('\n');

  // Parse DTCG tokens with Wallace
  const dtcgTokens = css_to_tokens(allCss) as unknown as Record<string, Record<string, DtcgToken>>;

  // Extract readable values for the brand context string
  const colors: string[] = Object.values(dtcgTokens.color ?? {})
    .slice(0, 12)
    .map((t) => {
      const ext = t.$extensions?.['com.projectwallace.css-authored-as'];
      if (typeof ext === 'string') return ext;
      if (t.$value && typeof t.$value === 'object') return colorToHex(t.$value as DtcgColorValue);
      return String(t.$value);
    });

  const fontFamilies: string[] = Object.values(dtcgTokens.font_family ?? {})
    .slice(0, 6)
    .map((t) => {
      const ext = t.$extensions?.['com.projectwallace.css-authored-as'];
      return typeof ext === 'string' ? ext : Array.isArray(t.$value) ? (t.$value as string[]).join(', ') : String(t.$value);
    });

  const fontSizes: string[] = Object.values(dtcgTokens.font_size ?? {})
    .slice(0, 10)
    .map((t) => {
      const ext = t.$extensions?.['com.projectwallace.css-authored-as'];
      if (typeof ext === 'string') return ext;
      const v = t.$value;
      if (v && typeof v === 'object' && 'value' in v && 'unit' in v) {
        return `${(v as DtcgDimensionValue).value}${(v as DtcgDimensionValue).unit}`;
      }
      return String(v);
    });

  const brandContextString = [
    `Source: ${url}`,
    colors.length > 0 ? `Colors: ${colors.slice(0, 10).join(', ')}` : '',
    fontFamilies.length > 0 ? `Font families: ${fontFamilies.join(', ')}` : '',
    fontSizes.length > 0 ? `Font sizes: ${fontSizes.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return {
    sourceUrl: url,
    colors,
    fontFamilies,
    fontSizes,
    rawCss: allCss.slice(0, 5000),
    dtcgTokens,
    brandContextString,
  };
}
