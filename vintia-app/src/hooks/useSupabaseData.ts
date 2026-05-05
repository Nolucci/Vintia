import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Item, Platform, AISettings, UserProfile } from '../types';

// ── Convertisseurs snake_case ↔ camelCase ────────────────────────────────────

function dbToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    transaction: row.transaction as Item['transaction'],
    type: row.type as Item['type'],
    titre: (row.titre as string) ?? '',
    url: (row.url as string) ?? '',
    description: (row.description as string) ?? '',
    prixAchat: row.prix_achat as number | null,
    prixVente: row.prix_vente as number | null,
    prixVendu: row.prix_vendu as number | null,
    marge: row.marge as number | null,
    prixIACible: row.prix_ia_cible as number | null,
    recommandations: (row.recommandations as string) ?? '',
    analyseIA: row.analyse_ia as string | undefined,
    compareAvec: (row.compare_avec as string[]) ?? [],
    platformId: (row.platform_id as string) ?? null,
    dateAjout: row.date_ajout as string,
  };
}

function itemToDb(item: Item, userId: string): Record<string, unknown> {
  return {
    id: item.id,
    user_id: userId,
    platform_id: item.platformId ?? null,
    transaction: item.transaction,
    type: item.type,
    titre: item.titre,
    url: item.url,
    description: item.description,
    prix_achat: item.prixAchat,
    prix_vente: item.prixVente,
    prix_vendu: item.prixVendu,
    marge: item.marge,
    prix_ia_cible: item.prixIACible,
    recommandations: item.recommandations,
    analyse_ia: item.analyseIA ?? null,
    compare_avec: item.compareAvec,
    date_ajout: item.dateAjout,
  };
}

function dbToPlatform(row: Record<string, unknown>): Platform {
  return {
    id: row.id as string,
    label: row.label as string,
    icon: row.icon as string,
    accentColor: row.accent_color as string,
    url: row.url as string | undefined,
    connected: row.connected as boolean,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

function platformToDb(p: Platform, userId: string): Record<string, unknown> {
  return {
    id: p.id,
    user_id: userId,
    label: p.label,
    icon: p.icon,
    accent_color: p.accentColor,
    url: p.url ?? null,
    connected: p.connected,
    sort_order: p.sortOrder ?? 0,
  };
}

function dbToAISettings(row: Record<string, unknown>): AISettings {
  return {
    provider: row.provider as AISettings['provider'],
    apiKey: (row.api_key as string) ?? '',
    model: (row.model as string) ?? 'gemini-2.5-flash',
    fallbackKeys: (row.fallback_keys as AISettings['fallbackKeys']) ?? [],
  };
}

// ── Hook items ───────────────────────────────────────────────────────────────

export function useItems(userId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('date_ajout', { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []).map(r => dbToItem(r as Record<string, unknown>)));
        setLoading(false);
      });
  }, [userId]);

  const saveItem = useCallback(async (item: Item) => {
    if (!userIdRef.current) return;
    const row = itemToDb(item, userIdRef.current);
    const { data } = await supabase
      .from('items')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (data) {
      const saved = dbToItem(data as Record<string, unknown>);
      setItems(prev => {
        const exists = prev.some(i => i.id === saved.id);
        return exists ? prev.map(i => i.id === saved.id ? saved : i) : [saved, ...prev];
      });
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await supabase.from('items').delete().eq('id', id);
    setItems(prev =>
      prev
        .filter(i => i.id !== id)
        .map(i => ({ ...i, compareAvec: i.compareAvec.filter(cid => cid !== id) }))
    );
  }, []);

  // Mise à jour locale immédiate + sync BDD (optimistic update)
  const updateItem = useCallback(async (updated: Item) => {
    if (!userIdRef.current) return;
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    const row = itemToDb(updated, userIdRef.current);
    await supabase.from('items').upsert(row, { onConflict: 'id' });
  }, []);

  return { items, setItems, loading, saveItem, deleteItem, updateItem };
}

// ── Hook plateformes ─────────────────────────────────────────────────────────

export function usePlatforms(userId: string | null) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) { setPlatforms([]); return; }
    supabase
      .from('platforms')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []).map(r => dbToPlatform(r as Record<string, unknown>));
        // Assign sort_order if missing (migration douce)
        rows.forEach((p: Platform, i: number) => { if (!p.sortOrder) p.sortOrder = i; });
        setPlatforms(rows);
      });
  }, [userId]);

  const addPlatform = useCallback(async (p: Omit<Platform, 'id'> & { id?: string }) => {
    if (!userIdRef.current) return;
    setPlatforms(prev => {
      const sortOrder = prev.length;
      const full: Platform = { ...p, id: p.id ?? crypto.randomUUID(), sortOrder } as Platform;
      const row = platformToDb(full, userIdRef.current!);
      supabase.from('platforms').insert(row).select().single().then(({ data }: { data: Record<string, unknown> | null }) => {
        if (data) setPlatforms(prev2 => [...prev2.filter(x => x.id !== full.id), dbToPlatform(data as Record<string, unknown>)]);
      });
      return [...prev, { ...p, id: (p.id ?? crypto.randomUUID()), sortOrder } as Platform];
    });
  }, []);

  const reorderPlatforms = useCallback(async (ordered: Platform[]) => {
    if (!userIdRef.current) return;
    const updated = ordered.map((p, i) => ({ ...p, sortOrder: i }));
    setPlatforms(updated);
    await Promise.all(
      updated.map(p =>
        supabase.from('platforms').update({ sort_order: p.sortOrder }).eq('id', p.id).eq('user_id', userIdRef.current!)
      )
    );
  }, []);

  const updatePlatform = useCallback(async (p: Platform) => {
    if (!userIdRef.current) return;
    setPlatforms(prev => prev.map(x => x.id === p.id ? p : x));
    await supabase.from('platforms').update(platformToDb(p, userIdRef.current!)).eq('id', p.id).eq('user_id', userIdRef.current!);
  }, []);

  const deletePlatform = useCallback(async (id: string) => {
    if (!userIdRef.current) return;
    setPlatforms(prev => prev.filter(x => x.id !== id));
    await supabase.from('platforms').delete().eq('id', id).eq('user_id', userIdRef.current!);
  }, []);

  return { platforms, addPlatform, reorderPlatforms, updatePlatform, deletePlatform };
}

// ── Hook paramètres IA ───────────────────────────────────────────────────────

const DEFAULT_AI: AISettings = { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' };

export function useAISettings(userId: string | null) {
  const [aiSettings, setAiSettingsState] = useState<AISettings>(DEFAULT_AI);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) { setAiSettingsState(DEFAULT_AI); return; }
    supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) setAiSettingsState(dbToAISettings(data as Record<string, unknown>));
      });
  }, [userId]);

  const saveAISettings = useCallback(async (s: AISettings) => {
    if (!userIdRef.current) return;
    setAiSettingsState(s);
    await supabase.from('ai_settings').upsert({
      user_id: userIdRef.current,
      provider: s.provider,
      api_key: s.apiKey,
      model: s.model,
      fallback_keys: s.fallbackKeys ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, []);

  return { aiSettings, saveAISettings };
}

// ── Hook profil utilisateur ──────────────────────────────────────────────────

export function useUserProfile(userId: string | null, defaultName: string, defaultInitials: string, defaultAvatarUrl?: string) {
  const [userProfile, setUserProfileState] = useState<UserProfile>({
    name: defaultName,
    avatarInitials: defaultInitials,
    avatarUrl: defaultAvatarUrl,
  });
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserProfileState({
            name: (data.name as string) || defaultName,
            avatarInitials: (data.avatar_initials as string) || defaultInitials,
            avatarUrl: data.avatar_url as string | undefined,
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveUserProfile = useCallback(async (u: UserProfile) => {
    if (!userIdRef.current) return;
    setUserProfileState(u);
    await supabase.from('user_profiles').upsert({
      id: userIdRef.current,
      name: u.name,
      avatar_initials: u.avatarInitials,
      avatar_url: u.avatarUrl ?? null,
    }, { onConflict: 'id' });
  }, []);

  return { userProfile, saveUserProfile };
}
