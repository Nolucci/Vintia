import type { Item, Platform } from '../types';

export interface PerplexityResult {
  summary: string;
  sources?: { title: string; url: string }[];
}

export async function analyzeItemOnWeb(
  item: Item,
  platform: Platform | undefined,
  apiKey: string,
): Promise<PerplexityResult> {
  const platformName = platform?.label ?? 'une plateforme de revente';
  const priceInfo = item.prixVente !== null
    ? `mis en vente à ${item.prixVente.toFixed(2)} €`
    : item.prixAchat !== null
      ? `acheté ${item.prixAchat.toFixed(2)} €`
      : '';

  const prompt = `Analyse cet article de seconde main sur ${platformName} :
Article : "${item.titre}" (catégorie : ${item.type})${priceInfo ? `, ${priceInfo}` : ''}${item.url ? `\nURL de l'annonce : ${item.url}` : ''}

Donne-moi :
1. Les prix pratiqués actuellement pour ce type d'article sur ${platformName} et les autres plateformes de revente
2. La demande (forte / moyenne / faible) et les tendances récentes
3. 2-3 conseils concrets pour optimiser la vente (photos, description, prix, timing)
Réponds en français, de façon concise et pratique.`;

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Perplexity error ${res.status}`);
  }

  const data = await res.json();
  const summary: string = data?.choices?.[0]?.message?.content ?? '';
  const sources: { title: string; url: string }[] = (data?.citations ?? []).map(
    (url: string, i: number) => ({ title: `Source ${i + 1}`, url }),
  );

  return { summary, sources };
}
