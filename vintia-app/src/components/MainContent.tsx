import React, { useState, useEffect } from 'react';
import type { Item, Platform } from '../types';
import type { DailyRecommendation } from '../services/dailyRecommendation';
import { theme, hexAlpha } from '../theme';
import ItemTable from './ItemTable/ItemTable';
import Tooltip from './ItemTable/Tooltip';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// ── Barre de statistiques ──────────────────────────────────────────────────
const StatsBar: React.FC<{ items: Item[] }> = ({ items }) => {
  const isMobile = useIsMobile();
  const actifs     = items.filter(i => i.transaction !== 'perdu');
  const achats     = actifs.filter(i => i.transaction === 'achat');
  const ventes     = actifs.filter(i => i.transaction === 'vente');
  const attentes   = actifs.filter(i => i.transaction === 'attente');
  const vendus     = actifs.filter(i => i.prixVendu !== null);
  const totalVendu = ventes.reduce((s, i) => s + (i.prixVendu ?? i.prixVente ?? 0), 0);
  const totalAchat = actifs.reduce((s, i) => s + (i.prixAchat ?? 0), 0);
  const totalMarge = totalVendu - totalAchat;

  const Stat = ({ label, value, color, tip }: { label: string; value: string; color?: string; tip: string }) => (
    <Tooltip text={tip}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'default', flexShrink: 0 }}>
        <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: theme.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 700, color: color ?? theme.text.primary, whiteSpace: 'nowrap' }}>
          {value}
        </span>
      </div>
    </Tooltip>
  );

  const Sep = () => <div style={{ width: 1, height: isMobile ? 24 : 32, background: hexAlpha(theme.accent.gold, 0.14), flexShrink: 0 }} />;

  if (isMobile) {
    return (
      <div className="stats-bar" data-testid="tutorial-stats-bar" style={{
        background: hexAlpha('#FFFFFF', 0.72),
        borderRadius: 10,
        border: `1px solid ${hexAlpha(theme.accent.gold, 0.16)}`,
        boxShadow: `0 2px 8px ${hexAlpha('#000000', 0.04)}`,
        display: 'flex', alignItems: 'center',
        paddingInline: 14, gap: 0,
        flexShrink: 0, flexWrap: 'nowrap',
        paddingBlock: 0, height: 46,
      }}>
        {[
          { label: 'Achetés',  value: `${achats.length}`,  color: hexAlpha('#EF4444', 0.9), tip: 'Articles achetés (−)' },
          { label: 'Vendus',   value: `${ventes.length}`,  color: '#16A34A',                tip: 'Articles mis en vente (+)' },
          { label: 'CA',       value: `+${totalVendu.toFixed(0)} €`, color: '#16A34A',      tip: "Chiffre d'affaires" },
          { label: 'Achats €', value: `-${totalAchat.toFixed(0)} €`, color: hexAlpha('#EF4444', 0.9), tip: 'Total achats' },
          { label: 'Marge',    value: `${totalMarge >= 0 ? '+' : ''}${totalMarge.toFixed(0)} €`, color: totalMarge >= 0 ? '#16A34A' : '#EF4444', tip: 'Marge nette' },
        ].map(({ label, value, color, tip }, i, arr) => (
          <React.Fragment key={label}>
            <Tooltip text={tip}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'default', flex: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: theme.text.secondary, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                  {value}
                </span>
              </div>
            </Tooltip>
            {i < arr.length - 1 && (
              <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.14), flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-bar" data-testid="tutorial-stats-bar" style={{
      minHeight: 60,
      background: hexAlpha('#FFFFFF', 0.72),
      borderRadius: 12,
      border: `1px solid ${hexAlpha(theme.accent.gold, 0.16)}`,
      boxShadow: `0 2px 8px ${hexAlpha('#000000', 0.04)}`,
      display: 'flex', alignItems: 'center',
      paddingInline: 20, gap: 16,
      flexShrink: 0, flexWrap: 'nowrap',
      paddingBlock: 10,
    }}>
      <Stat label="Articles"       value={`${actifs.length}`}                                      tip="Articles actifs (hors perdus)" />
      <Sep />
      <Stat label="Achats"         value={`${achats.length}`}   color={hexAlpha('#EF4444', 0.9)}   tip="Articles achat (−)" />
      <Sep />
      <Stat label="Ventes"         value={`${ventes.length}`}   color="#16A34A"                    tip="Articles vente (+)" />
      <Sep />
      <Stat label="En attente"     value={`${attentes.length}`} color="#F59E0B"                    tip="Articles en étude (?)" />
      <Sep />
      <Stat label="Vendus"         value={`${vendus.length}`}   color={theme.accent.teal}          tip="Articles avec prix vendu" />
      <Sep />
      <Stat label="Chiffre d'aff." value={`+${totalVendu.toFixed(2)} €`} color="#16A34A"           tip="Chiffre d'affaires" />
      <Sep />
      <Stat label="Total achats"   value={`-${totalAchat.toFixed(2)} €`} color="#EF4444"           tip="Total des achats" />
      <Sep />
      <Stat label="Marge"
        value={`${totalMarge >= 0 ? '+' : ''}${totalMarge.toFixed(2)} €`}
        color={totalMarge >= 0 ? '#16A34A' : '#EF4444'}
        tip="Marge nette = CA − Achats" />
    </div>
  );
};

// ── Bloc recommandation IA quotidienne ────────────────────────────────────
interface AIHeaderProps {
  reco: DailyRecommendation | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const AIHeader: React.FC<AIHeaderProps> = ({ reco, loading, error, onRefresh }) => {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const generatedLabel = reco?.generatedAt
    ? new Date(reco.generatedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  const expiresLabel = reco?.expiresAt
    ? new Date(reco.expiresAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{
      background: hexAlpha('#FFFFFF', 0.68),
      borderRadius: 12,
      border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.28)}`,
      boxShadow: `0 2px 10px ${hexAlpha(theme.accent.gold, 0.09)}`,
      padding: isMobile ? '8px 12px' : '12px 18px',
      flexShrink: 0,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <Tooltip text="Recommandation IA générée à partir de vos données réelles, renouvelée chaque jour à 10h00">
        <span className="material-symbols-rounded" style={{ fontSize: 22, color: theme.accent.gold, flexShrink: 0, marginTop: 2 }}>
          auto_awesome
        </span>
      </Tooltip>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Titre + métadonnées */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: isMobile && collapsed ? 0 : 6, cursor: isMobile ? 'pointer' : 'default' }}
          onClick={isMobile ? () => setCollapsed(s => !s) : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent.gold, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Recommandation IA du jour
            </span>
            {(!isMobile || !collapsed) && generatedLabel && !loading && (
              <span style={{
                fontSize: 10, color: hexAlpha(theme.text.secondary, 0.8),
                background: hexAlpha('#1A2332', 0.05),
                borderRadius: 4, padding: '2px 6px', fontWeight: 500,
              }}>
                Généré le {generatedLabel}
              </span>
            )}
            {(!isMobile || !collapsed) && expiresLabel && !loading && (
              <Tooltip text={`Se renouvelle automatiquement le ${expiresLabel}`}>
                <span style={{
                  fontSize: 10, color: theme.accent.gold,
                  background: hexAlpha(theme.accent.gold, 0.08),
                  borderRadius: 4, padding: '2px 6px', fontWeight: 600,
                  cursor: 'default',
                }}>
                  ↻ {expiresLabel}
                </span>
              </Tooltip>
            )}
            {isMobile && (
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: theme.accent.gold, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', marginLeft: 'auto', flexShrink: 0 }}>
                expand_more
              </span>
            )}
          </div>

          {/* Bouton refresh — masqué en mobile replié */}
          {(!isMobile || !collapsed) && (
            <Tooltip text="Régénérer maintenant (efface le cache)">
              <button
                data-testid="tutorial-refresh-reco"
                onClick={e => { e.stopPropagation(); onRefresh(); }}
                disabled={loading}
                style={{
                  height: 26, borderRadius: 7, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? hexAlpha(theme.accent.gold, 0.06) : hexAlpha(theme.accent.gold, 0.10),
                  display: 'flex', alignItems: 'center', gap: 4, paddingInline: 10,
                  opacity: loading ? 0.6 : 1, transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.20); }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.10); }}
              >
                <span className="material-symbols-rounded" style={{
                  fontSize: 14, color: theme.accent.gold,
                  animation: loading ? 'spin 0.9s linear infinite' : 'none',
                }}>refresh</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold }}>
                  {loading ? 'Analyse…' : 'Actualiser'}
                </span>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Contenu — masqué si replié en mobile */}
        {!(isMobile && collapsed) && (
          loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['100%', '82%', '60%'].map((w, i) => (
                <div key={i} style={{
                  height: 11, borderRadius: 5, width: w,
                  background: `linear-gradient(90deg, ${hexAlpha(theme.accent.gold, 0.06)}, #EEF1F8, ${hexAlpha(theme.accent.gold, 0.06)})`,
                  backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#EF4444' }}>warning</span>
              <span style={{ fontSize: 12, color: hexAlpha('#EF4444', 0.8) }}>
                {error.includes('manquante') ? 'Clé API non configurée — ajoutez-la dans Paramètres pour activer la recommandation.' : error}
              </span>
            </div>
          ) : reco ? (
            <p style={{ margin: 0, fontSize: 13, color: theme.text.secondary, lineHeight: 1.65 }}>
              {reco.text}
            </p>
          ) : (
            <span style={{ fontSize: 12, color: hexAlpha(theme.text.secondary, 0.45) }}>
              Aucune recommandation — configurez une clé IA dans les Paramètres.
            </span>
          )
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Composant principal ────────────────────────────────────────────────────
interface MainContentProps {
  items: Item[];
  platforms: Platform[];
  dailyReco: DailyRecommendation | null;
  dailyRecoLoading: boolean;
  dailyRecoError: string | null;
  onRefreshReco: () => void;
  isLoading: boolean;
  onSaveItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onRequestPerplexity?: (item: Item) => void;
  onOpenReport?: (item: Item) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  items, platforms,
  dailyReco, dailyRecoLoading, dailyRecoError, onRefreshReco,
  isLoading, onSaveItem, onDeleteItem, onRequestPerplexity, onOpenReport,
}) => {
  return (
    <div className="main-content" data-testid="tutorial-main-content" style={{ minWidth: 0 }}>
      <AIHeader
        reco={dailyReco}
        loading={dailyRecoLoading || isLoading}
        error={dailyRecoError}
        onRefresh={onRefreshReco}
      />
      <StatsBar items={items} />
      <ItemTable
        items={items}
        platforms={platforms}
        onSaveItem={onSaveItem}
        onDeleteItem={onDeleteItem}
        onRequestPerplexity={onRequestPerplexity}
        onOpenReport={onOpenReport}
      />
    </div>
  );
};

export default MainContent;
