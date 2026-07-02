import React, { useState, useEffect, useRef } from 'react';
import type { Item, Platform, AISettings, UserProfile } from '../types';
import { theme } from '../theme';
import { useItems, usePlatforms, useAISettings, useUserProfile } from '../hooks/useSupabaseData';
import { useTutorial } from '../contexts/TutorialContext';
import { useLang } from '../contexts/LanguageContext';
import TopBar from '../components/TopBar';
import SideNav from '../components/SideNav';
import MainContent from '../components/MainContent';
import SettingsPanel from '../components/SettingsPanel';
import BackgroundDecorations from '../components/BackgroundDecorations';
import ConnectPlatformModal from '../components/ConnectPlatformModal';
import PlatformEditModal from '../components/PlatformEditModal';
import PerplexityModal from '../components/PerplexityModal';
import { analyzeItem } from '../services/webSearch';
import type { WebSearchResult } from '../services/webSearch';
import { getDailyRecommendation, clearCache } from '../services/dailyRecommendation';
import type { DailyRecommendation } from '../services/dailyRecommendation';

const generateId = () => crypto.randomUUID();

interface VosVentesScreenProps {
  userId: string;
  userMeta: { name?: string; avatar_initials?: string; avatar_url?: string };
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
}

const VosVentesScreen: React.FC<VosVentesScreenProps> = ({
  userId, userMeta, onLogout, onDeleteAccount,
}) => {
  const defaultName = userMeta.name ?? 'Utilisateur';
  const defaultInitials = userMeta.avatar_initials ?? defaultName.slice(0, 2).toUpperCase();

  const { items, setItems, loading: itemsLoading, saveItem, deleteItem, updateItem } = useItems(userId);
  const { platforms, addPlatform, reorderPlatforms, updatePlatform, deletePlatform } = usePlatforms(userId);
  const { registerAppApi } = useTutorial();
  const { lang } = useLang();

  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

  useEffect(() => {
    registerAppApi({ setItems, setSelectedPlatformId });
  }, [registerAppApi, setItems]);
  const { aiSettings, saveAISettings } = useAISettings(userId);
  const { userProfile, saveUserProfile } = useUserProfile(userId, defaultName, defaultInitials, userMeta.avatar_url);

  const [currentView, setCurrentView] = useState<'table' | 'settings'>('table');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [visible, setVisible] = useState(false);

  const [perplexityItem, setPerplexityItem] = useState<Item | null>(null);
  const [perplexityLoading, setPerplexityLoading] = useState(false);
  const [perplexityResult, setPerplexityResult] = useState<WebSearchResult | null>(null);
  const [perplexityError, setPerplexityError] = useState<string | null>(null);
  const [perplexitySavedResult, setPerplexitySavedResult] = useState<string | undefined>(undefined);

  const [dailyReco, setDailyReco] = useState<DailyRecommendation | null>(null);
  const [dailyRecoLoading, setDailyRecoLoading] = useState(false);
  const [dailyRecoError, setDailyRecoError] = useState<string | null>(null);

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!aiSettings.apiKey) return;
    let cancelled = false;
    setDailyRecoLoading(true);
    setDailyRecoError(null);
    getDailyRecommendation(userId, items, platforms, aiSettings, false, lang)
      .then(r => { if (!cancelled) { setDailyReco(r); setDailyRecoLoading(false); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDailyRecoError((e as Error)?.message ?? 'Erreur');
          setDailyRecoLoading(false);
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, aiSettings.apiKey, lang]);

  const handleRefreshReco = async () => {
    if (!aiSettings.apiKey) return;
    clearCache(userId);
    setDailyRecoLoading(true);
    setDailyRecoError(null);
    try {
      const r = await getDailyRecommendation(userId, itemsRef.current, platforms, aiSettings, true, lang);
      setDailyReco(r);
    } catch (e: unknown) {
      setDailyRecoError((e as Error)?.message ?? 'Erreur');
    } finally {
      setDailyRecoLoading(false);
    }
  };

  const filteredItems = selectedPlatformId
    ? items.filter(i => i.platformId === selectedPlatformId)
    : items;

  const handleSaveItem = async (updated: Item) => {
    const isNew = updated.id.startsWith('new_');
    const finalItem: Item = {
      ...updated,
      id: isNew ? generateId() : updated.id,
      dateAjout: updated.dateAjout ?? new Date().toISOString(),
      marge: updated.prixVendu !== null && updated.prixAchat !== null
        ? updated.prixVendu - updated.prixAchat
        : null,
    };
    await saveItem(finalItem);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };

  const handleAddPlatform = async (data: Omit<Platform, 'id'>) => {
    await addPlatform({ ...data, id: generateId() });
  };

  const handleSelectPlatform = (id: string) => {
    setSelectedPlatformId(prev => prev === id ? null : id);
  };

  const handleSaveUser = async (u: UserProfile) => {
    await saveUserProfile(u);
  };

  const handleSaveAI = async (s: AISettings) => {
    await saveAISettings(s);
  };

  const handleOpenReport = (item: Item) => {
    setPerplexityItem(item);
    setPerplexityResult(null);
    setPerplexityError(null);
    setPerplexityLoading(false);
    setPerplexitySavedResult(item.analyseIA);
  };

  const handleRequestPerplexity = async (item: Item) => {
    if (!aiSettings.apiKey) {
      setPerplexityItem(item);
      setPerplexityResult(null);
      setPerplexityError(`Clé API ${aiSettings.provider} non configurée. Rendez-vous dans Paramètres pour l'ajouter.`);
      setPerplexitySavedResult(undefined);
      return;
    }
    const platform = platforms.find(p => p.id === item.platformId);
    setPerplexityItem(item);
    setPerplexityLoading(true);
    setPerplexityResult(null);
    setPerplexityError(null);
    setPerplexitySavedResult(undefined);
    try {
      const result = await analyzeItem(
        item, platform,
        aiSettings.provider, aiSettings.apiKey, aiSettings.model,
        aiSettings.fallbackKeys, lang,
      );
      setPerplexityResult(result);

      if (result.structured && !result.structured.accessError) {
        const s = result.structured;
        const parsePrice = (v: string | null | undefined) => {
          if (!v || v === 'null') return null;
          const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
          return isNaN(n) || n === 0 ? null : n;
        };
        const priceNum    = parsePrice(s.recommendedPrice);
        const buyPriceNum = parsePrice(s.suggestedBuyPrice);
        const comment = s.shortSummary ?? s.tips?.[0] ?? '';
        const analyseIA = JSON.stringify(s);

        const updatedItem = {
          ...item,
          recommandations: comment,
          analyseIA,
          ...(priceNum !== null    ? { prixIACible: priceNum } : {}),
          ...(buyPriceNum !== null ? { prixAchat: buyPriceNum } : {}),
          ...(priceNum !== null && buyPriceNum !== null ? { marge: priceNum - buyPriceNum } : {}),
        };
        await updateItem(updatedItem);
      } else if (result.structured) {
        const analyseIA = JSON.stringify(result.structured);
        await updateItem({ ...item, analyseIA });
      }
    } catch (err: unknown) {
      setPerplexityError((err as Error)?.message ?? 'Erreur lors de la recherche.');
    } finally {
      setPerplexityLoading(false);
    }
  };

  const handleApplyResult = async (prixIACible: number | null, recommandation: string) => {
    if (!perplexityItem) return;
    await updateItem({ ...perplexityItem, prixIACible, recommandations: recommandation });
  };

  const handleClosePerplexity = () => {
    setPerplexityItem(null);
    setPerplexityResult(null);
    setPerplexityError(null);
    setPerplexityLoading(false);
    setPerplexitySavedResult(undefined);
  };

  return (
    <div className="app-root" style={{
      background: `linear-gradient(180deg, ${theme.bg.secondary} 0%, ${theme.bg.primary} 50%, ${theme.bg.bottom} 100%)`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.45s ease-out, transform 0.5s ease-out',
    }}>
      <BackgroundDecorations />
      <TopBar />

      <div className="app-layout" style={{ position: 'relative' }}>
        <SideNav
          platforms={platforms}
          items={items}
          selectedPlatformId={selectedPlatformId}
          user={userProfile}
          onSelectPlatform={handleSelectPlatform}
          onAddPlatform={() => setShowConnectModal(true)}
          onOpenSettings={() => setCurrentView('settings')}
          onEditPlatform={p => setEditingPlatform(p)}
          onLogout={onLogout}
          onReorderPlatforms={reorderPlatforms}
        />

        {currentView === 'settings' ? (
          <SettingsPanel
            user={userProfile}
            aiSettings={aiSettings}
            onSaveUser={handleSaveUser}
            onSaveAI={handleSaveAI}
            onBack={() => setCurrentView('table')}
            onDeleteAccount={onDeleteAccount}
          />
        ) : (
          <MainContent
            items={filteredItems}
            platforms={platforms}
            dailyReco={dailyReco}
            dailyRecoLoading={dailyRecoLoading || itemsLoading}
            dailyRecoError={dailyRecoError}
            onRefreshReco={handleRefreshReco}
            isLoading={itemsLoading}
            onSaveItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            onRequestPerplexity={handleRequestPerplexity}
            onOpenReport={handleOpenReport}
          />
        )}
      </div>

      {showConnectModal && (
        <ConnectPlatformModal
          onClose={() => setShowConnectModal(false)}
          onAdd={handleAddPlatform}
        />
      )}

      {editingPlatform && (
        <PlatformEditModal
          platform={editingPlatform}
          onClose={() => setEditingPlatform(null)}
          onSave={async p => { await updatePlatform(p); setEditingPlatform(null); }}
          onDelete={async id => { await deletePlatform(id); setSelectedPlatformId(null); setEditingPlatform(null); }}
        />
      )}

      {perplexityItem && (
        <PerplexityModal
          itemTitle={perplexityItem.titre || 'Article sans titre'}
          itemUrl={perplexityItem.url || undefined}
          providerLabel={
            { gemini: 'Gemini', anthropic: 'Claude', openai: 'ChatGPT',
              perplexity: 'Perplexity', mistral: 'Mistral', grok: 'Grok', autre: 'IA' }
            [aiSettings.provider] ?? 'IA'
          }
          loading={perplexityLoading}
          result={perplexityResult}
          savedResult={perplexitySavedResult}
          error={perplexityError}
          onClose={handleClosePerplexity}
          onApply={handleApplyResult}
        />
      )}
    </div>
  );
};

export default VosVentesScreen;
