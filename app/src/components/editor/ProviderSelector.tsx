'use client';
import type { Provider } from '@/lib/ai/providers';
import { PROVIDER_MODELS } from '@/lib/ai/providers';

interface ProviderSelectorProps {
  value: Provider;
  onChange: (provider: Provider) => void;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'anthropic', label: 'Claude (Anthropic)' },
  { id: 'openai', label: 'GPT-4o (OpenAI)' },
  { id: 'gemini', label: 'Gemini (Google)' },
  { id: 'ollama', label: 'Ollama (local)' },
];

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Provider)}
        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} — {PROVIDER_MODELS[p.id]}
          </option>
        ))}
      </select>
    </div>
  );
}
