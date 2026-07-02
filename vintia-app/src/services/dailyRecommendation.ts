import type { Item, Platform, AISettings } from '../types';
import type { Lang } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

export interface DailyRecommendation {
  text: string;
  generatedAt: string;
  expiresAt: string;
}

function nextExpiryAt10(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(10, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function loadCached(userId: string): Promise<DailyRecommendation | null> {
  const { data } = await supabase
    .from('daily_recommendations')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  if (new Date(data.expires_at as string) <= new Date()) return null;
  return {
    text: data.text as string,
    generatedAt: data.generated_at as string,
    expiresAt: data.expires_at as string,
  };
}

async function saveCache(userId: string, reco: DailyRecommendation): Promise<void> {
  await supabase.from('daily_recommendations').upsert({
    user_id: userId,
    text: reco.text,
    generated_at: reco.generatedAt,
    expires_at: reco.expiresAt,
  }, { onConflict: 'user_id' });
}

export async function clearCache(userId: string): Promise<void> {
  await supabase.from('daily_recommendations').delete().eq('user_id', userId);
}

function buildContext(items: Item[], platforms: Platform[]): string {
  if (items.length === 0) return 'Aucun article enregistré pour le moment.';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const soldYesterday = items.filter(i => {
    if (i.prixVendu === null) return false;
    const d = new Date(i.dateAjout);
    return d >= yesterday && d < todayStart;
  });

  const allSold = items.filter(i => i.prixVendu !== null && i.prixAchat !== null);

  const avgMarge = allSold.length > 0
    ? allSold.reduce((s, i) => s + ((i.prixVendu ?? 0) - (i.prixAchat ?? 0)), 0) / allSold.length
    : null;

  const avgMargeYesterday = soldYesterday.length > 0 && soldYesterday.every(i => i.prixAchat !== null)
    ? soldYesterday.reduce((s, i) => s + ((i.prixVendu ?? 0) - (i.prixAchat ?? 0)), 0) / soldYesterday.length
    : null;

  const pending = items.filter(i => i.transaction === 'attente');
  const activeListings = items.filter(i => i.transaction === 'vente' && i.prixVendu === null);

  const byType: Record<string, { count: number; totalMarge: number }> = {};
  for (const i of allSold) {
    const m = (i.prixVendu ?? 0) - (i.prixAchat ?? 0);
    if (!byType[i.type]) byType[i.type] = { count: 0, totalMarge: 0 };
    byType[i.type].count++;
    byType[i.type].totalMarge += m;
  }
  const typeStats = Object.entries(byType)
    .map(([type, { count, totalMarge }]) => ({ type, count, avgMarge: totalMarge / count }))
    .sort((a, b) => b.avgMarge - a.avgMarge)
    .slice(0, 5);

  const mispriced = activeListings.filter(i =>
    i.prixIACible !== null && i.prixVente !== null &&
    (i.prixVente > i.prixIACible * 1.25 || i.prixVente < i.prixIACible * 0.75),
  );

  const platformNames = platforms.map(p => p.label).join(', ') || 'plateforme non spécifiée';

  const lines: string[] = [
    `Date d'analyse : ${now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    `Plateformes utilisées : ${platformNames}`,
    ``,
    `=== PORTEFEUILLE ACTUEL ===`,
    `- Total articles : ${items.length}`,
    `- En vente active : ${activeListings.length} article(s)`,
    `- En attente de décision : ${pending.length} article(s)`,
    `- Vendus (historique) : ${allSold.length} article(s)`,
    ``,
    `=== PERFORMANCE ===`,
    avgMarge !== null ? `- Marge moyenne globale : ${avgMarge >= 0 ? '+' : ''}${avgMarge.toFixed(2)} €` : '- Marge moyenne : aucune donnée',
    avgMargeYesterday !== null
      ? `- Marge moyenne hier : ${avgMargeYesterday >= 0 ? '+' : ''}${avgMargeYesterday.toFixed(2)} € (${soldYesterday.length} vente(s))`
      : soldYesterday.length === 0 ? '- Aucune vente enregistrée hier' : '- Ventes hier sans données suffisantes',
  ];

  if (soldYesterday.length > 0)
    lines.push(`- Articles vendus hier : ${soldYesterday.map(i => `"${i.titre}" (${i.prixVendu} €)`).join(', ')}`);

  if (typeStats.length > 0) {
    lines.push(``, `=== MARGES PAR CATÉGORIE (meilleures) ===`);
    for (const t of typeStats)
      lines.push(`- ${t.type} : marge moy. ${t.avgMarge >= 0 ? '+' : ''}${t.avgMarge.toFixed(2)} € (${t.count} vente(s))`);
  }

  if (activeListings.length > 0) {
    lines.push(``, `=== ANNONCES ACTIVES ===`);
    for (const i of activeListings.slice(0, 10)) {
      const ia = i.prixIACible !== null ? ` | Prix IA cible: ${i.prixIACible} €` : '';
      lines.push(`- "${i.titre}" affiché à ${i.prixVente ?? '?'} €${ia}`);
    }
  }

  if (mispriced.length > 0) {
    lines.push(``, `=== PRIX POTENTIELLEMENT MAL CALIBRÉS ===`);
    for (const i of mispriced) {
      const diff = ((i.prixVente ?? 0) - (i.prixIACible ?? 0)).toFixed(2);
      lines.push(`- "${i.titre}" : affiché ${i.prixVente} € vs IA cible ${i.prixIACible} € (écart ${Number(diff) >= 0 ? '+' : ''}${diff} €)`);
    }
  }

  if (pending.length > 0) {
    lines.push(``, `=== EN ATTENTE DE DÉCISION ===`);
    for (const i of pending.slice(0, 8))
      lines.push(`- "${i.titre}" (achat à ${i.prixAchat ?? '?'} €, vente envisagée à ${i.prixVente ?? '?'} €)`);
  }

  return lines.join('\n');
}

function buildPrompt(context: string, lang: Lang = 'fr'): string {
  const outputLanguage = lang === 'en' ? 'anglais' : 'français';
  return `Tu es un conseiller expert en revente de seconde main (Vinted, Leboncoin, eBay...). Voici les données réelles de l'utilisateur pour aujourd'hui :

${context}

Génère une recommandation quotidienne en ${outputLanguage}, courte et directement actionnable (4 à 6 phrases maximum). Elle doit répondre à :
1. Que faire aujourd'hui en priorité ? (ajuster un prix, publier, relancer une annonce...)
2. Quoi proposer en fonction de la demande actuelle et des catégories les plus rentables ?
3. Que retenir des marges de la veille et comment s'améliorer ?

Sois direct, précis sur les articles et les chiffres. Pas d'introduction générique. Commence directement par l'action.`;
}

async function callAI(prompt: string, settings: AISettings): Promise<string> {
  const { provider, apiKey, model } = settings;

  if (provider === 'gemini') {
    const m = model || 'gemini-2.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  if (provider === 'openai' || provider === 'autre') {
    const m = model || 'gpt-4o';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'anthropic') {
    const m = model || 'claude-sonnet-4-6';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: m, max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text ?? '';
  }

  if (provider === 'mistral') {
    const m = model || 'mistral-large-latest';
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Mistral ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'grok') {
    const m = model || 'grok-3';
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Grok ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'groq') {
    const m = model || 'llama-3.3-70b-versatile';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'perplexity') {
    const m = model || 'sonar-pro';
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Perplexity ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  throw new Error(`Provider inconnu : ${provider}`);
}

export async function getDailyRecommendation(
  userId: string,
  items: Item[],
  platforms: Platform[],
  aiSettings: AISettings,
  force = false,
  lang: Lang = 'fr',
): Promise<DailyRecommendation> {
  if (!force) {
    const cached = await loadCached(userId);
    if (cached) return cached;
  }

  if (!aiSettings.apiKey) {
    throw new Error('Clé API manquante — configurez-la dans les Paramètres.');
  }

  const context = buildContext(items, platforms);
  const prompt = buildPrompt(context, lang);
  const text = await callAI(prompt, aiSettings);

  const reco: DailyRecommendation = {
    text: text.trim(),
    generatedAt: new Date().toISOString(),
    expiresAt: nextExpiryAt10().toISOString(),
  };

  await saveCache(userId, reco);
  return reco;
}
