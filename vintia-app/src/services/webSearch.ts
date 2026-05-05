import type { Item, Platform, AIProvider, AIFallbackKey } from '../types';

export interface SimilarItem {
  title: string;
  url: string;
  price?: string;
}

export interface WebSearchResult {
  summary: string;
  sources?: { title: string; url: string }[];
  structured?: {
    objectName: string;
    platformPrice: string | null;
    actionType: string;
    approvalScore: number; // 0-100
    shortSummary: string;
    recommendedPrice: string | null;   // prix proposition (prixVente)
    suggestedBuyPrice: string | null;  // prix d'achat conseillé (prixAchat)
    priceRange: string | null;
    potentialMargin: string | null;
    tips: string[];
    similarItems: SimilarItem[];
    accessError?: boolean;
    usedProvider?: string;
    usedFallback?: boolean;
  };
}

// ── Extraction du domaine depuis une URL ──────────────────────────────────
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function buildPrompt(item: Item, platformName: string, platformUrl?: string): string {
  const actionLabel = item.transaction === 'achat' ? 'achat'
    : item.transaction === 'vente' ? 'vente'
    : item.transaction === 'attente' ? 'mise en attente'
    : 'transaction';

  const priceInfo = item.prixVente !== null
    ? `Prix de vente affiché : ${item.prixVente.toFixed(2)} €`
    : item.prixAchat !== null
      ? `Prix d'achat payé : ${item.prixAchat.toFixed(2)} €`
      : '';

  const itemDomain = item.url ? extractDomain(item.url) : '';
  const targetSite = itemDomain || (platformUrl ? extractDomain(platformUrl) : platformName);

  const descriptionBlock = item.description?.trim()
    ? `Description de l'article (fournie par l'utilisateur, à utiliser si l'URL est inaccessible) :\n"${item.description.trim()}"`
    : '';

  return `Tu es un expert en revente de seconde main. Analyse cet article et réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks, sans texte avant ou après).

Article : "${item.titre}"
Catégorie : ${item.type}
Action : ${actionLabel}
${priceInfo}
${item.url ? `URL exacte de l'annonce : ${item.url}` : ''}
${descriptionBlock}
Site cible : ${targetSite}

INSTRUCTIONS IMPORTANTES :
1. Accède à l'URL exacte fournie si possible et lis le prix affiché sur la page.
2. Si l'URL est inaccessible, utilise la description fournie par l'utilisateur pour affiner l'analyse.
3. Recherche des annonces SIMILAIRES sur ${targetSite} UNIQUEMENT — les URLs des similarItems doivent être sur ${targetSite}, pas sur d'autres sites.
4. Si tu ne peux pas accéder au site ou à l'annonce, mets "accessError": true et fais de ton mieux avec la description et tes connaissances.
5. Les URLs des similarItems doivent être des vraies URLs existantes et complètes (commençant par https://).

Réponds avec ce JSON exact :
{
  "objectName": "nom précis de l'objet avec marque et modèle si détectable",
  "platformPrice": "prix lu sur l'annonce en €, ou null si non accessible",
  "actionType": "${actionLabel}",
  "approvalScore": nombre entier entre 0 et 100,
  "shortSummary": "résumé de 2-3 phrases sur cet article et ce prix précisément",
  "recommendedPrice": "prix de vente/proposition conseillé en €",
  "suggestedBuyPrice": "prix d'achat maximum conseillé pour être rentable en €, ou null si non pertinent",
  "priceRange": "fourchette observée sur ${targetSite} ex: 25€ - 45€",
  "potentialMargin": "marge potentielle estimée en €, ou null si non pertinent",
  "tips": ["conseil 1 précis", "conseil 2 précis", "conseil 3 précis"],
  "accessError": false,
  "similarItems": [
    {"title": "titre exact annonce similaire sur ${targetSite}", "url": "https://${targetSite}/...", "price": "prix en €"},
    {"title": "titre exact annonce similaire sur ${targetSite}", "url": "https://${targetSite}/...", "price": "prix en €"},
    {"title": "titre exact annonce similaire sur ${targetSite}", "url": "https://${targetSite}/...", "price": "prix en €"}
  ]
}`;
}

// ── Gemini ────────────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const m = model || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── OpenAI ────────────────────────────────────────────────────────────────
async function callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const m = model || 'gpt-4o-search-preview';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: 'user', content: prompt }],
      ...(m.includes('search') ? { web_search_options: {} } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

// ── Anthropic (Claude) ────────────────────────────────────────────────────
async function callAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const m = model || 'claude-sonnet-4-6';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: m,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data?.content?.[0]?.text ?? '';
}

// ── Mistral ───────────────────────────────────────────────────────────────
async function callMistral(prompt: string, apiKey: string, model: string): Promise<string> {
  const m = model || 'mistral-large-latest';
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message ?? `Mistral error ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

// ── Grok (xAI) ───────────────────────────────────────────────────────────
async function callGrok(prompt: string, apiKey: string, model: string): Promise<string> {
  const m = model || 'grok-3';
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Grok error ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

// ── Perplexity ────────────────────────────────────────────────────────────
async function callPerplexity(prompt: string, apiKey: string, model: string): Promise<{ text: string; sources: { title: string; url: string }[] }> {
  const m = model || 'sonar-pro';
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Perplexity error ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const sources = (data?.citations ?? []).map((url: string, i: number) => ({ title: `Source ${i + 1}`, url }));
  return { text, sources };
}

// ── Dispatch par provider ─────────────────────────────────────────────────
async function callProvider(provider: AIProvider, apiKey: string, model: string, prompt: string): Promise<string> {
  switch (provider) {
    case 'gemini':     return callGemini(prompt, apiKey, model);
    case 'openai':     return callOpenAI(prompt, apiKey, model);
    case 'anthropic':  return callAnthropic(prompt, apiKey, model);
    case 'mistral':    return callMistral(prompt, apiKey, model);
    case 'grok':       return callGrok(prompt, apiKey, model);
    case 'perplexity': return (await callPerplexity(prompt, apiKey, model)).text;
    default:           return callOpenAI(prompt, apiKey, model);
  }
}

// ── Parsing JSON structuré ────────────────────────────────────────────────
function parseStructured(text: string, providerLabel: string, usedFallback: boolean): WebSearchResult['structured'] | undefined {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    const parsed = JSON.parse(match[0]);
    if (!parsed.shortSummary) return undefined;
    return {
      objectName: parsed.objectName ?? '',
      platformPrice: parsed.platformPrice ?? null,
      actionType: parsed.actionType ?? '',
      approvalScore: typeof parsed.approvalScore === 'number' ? Math.min(100, Math.max(0, parsed.approvalScore)) : 50,
      shortSummary: parsed.shortSummary ?? '',
      recommendedPrice: parsed.recommendedPrice ?? null,
      suggestedBuyPrice: parsed.suggestedBuyPrice ?? null,
      priceRange: parsed.priceRange ?? null,
      potentialMargin: parsed.potentialMargin ?? null,
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      similarItems: Array.isArray(parsed.similarItems) ? parsed.similarItems : [],
      accessError: parsed.accessError === true,
      usedProvider: providerLabel,
      usedFallback,
    };
  } catch {
    return undefined;
  }
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: 'Gemini', anthropic: 'Claude', openai: 'ChatGPT',
  perplexity: 'Perplexity', mistral: 'Mistral', grok: 'Grok', autre: 'IA',
};

// ── Point d'entrée unique — avec fallback chaîné ──────────────────────────
export async function analyzeItem(
  item: Item,
  platform: Platform | undefined,
  provider: AIProvider,
  apiKey: string,
  model: string,
  fallbackKeys?: AIFallbackKey[],
): Promise<WebSearchResult> {
  if (!apiKey) throw new Error('Clé API manquante — configurez-la dans les Paramètres.');

  const platformName = platform?.label ?? 'une plateforme de revente';
  const platformUrl = platform?.url;
  const prompt = buildPrompt(item, platformName, platformUrl);

  // File de tentatives : provider principal + jusqu'à 2 fallbacks
  const attempts: { provider: AIProvider; apiKey: string; model: string }[] = [
    { provider, apiKey, model },
    ...((fallbackKeys ?? []).slice(0, 2).filter(f => f.apiKey)),
  ];

  let lastError: string = '';
  let sources: { title: string; url: string }[] = [];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const usedFallback = i > 0;
    const providerLabel = PROVIDER_LABELS[attempt.provider] ?? 'IA';

    try {
      let text: string;
      if (attempt.provider === 'perplexity') {
        const r = await callPerplexity(prompt, attempt.apiKey, attempt.model);
        text = r.text;
        sources = r.sources;
      } else {
        text = await callProvider(attempt.provider, attempt.apiKey, attempt.model, prompt);
      }

      const structured = parseStructured(text, providerLabel, usedFallback);

      // Si l'IA signale elle-même qu'elle ne peut pas accéder et qu'il reste des fallbacks, on continue
      if (structured?.accessError && i < attempts.length - 1) {
        lastError = `${providerLabel} n'a pas pu accéder au site.`;
        continue;
      }

      return { summary: text, sources, structured };
    } catch (err: any) {
      lastError = err?.message ?? `Erreur ${providerLabel}`;
      // On passe au fallback suivant
    }
  }

  // Tous les providers ont échoué — on retourne un résultat avec accessError
  const allProviderNames = attempts.map(a => PROVIDER_LABELS[a.provider]).join(', ');
  const fallbackSummary = JSON.stringify({
    objectName: item.titre,
    platformPrice: null,
    actionType: item.transaction,
    approvalScore: 50,
    shortSummary: `Impossible d'analyser cet article : aucun des fournisseurs IA (${allProviderNames}) n'a pu accéder au site. Dernière erreur : ${lastError}`,
    recommendedPrice: null,
    priceRange: null,
    potentialMargin: null,
    tips: [],
    accessError: true,
    similarItems: [],
  });

  return {
    summary: fallbackSummary,
    sources: [],
    structured: parseStructured(fallbackSummary, allProviderNames, true),
  };
}
