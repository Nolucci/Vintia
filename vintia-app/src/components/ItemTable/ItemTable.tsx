import React, { useState, useMemo, useEffect } from 'react';
import type { Item, ItemType, Platform } from '../../types';
import { theme, hexAlpha } from '../../theme';
import { COL_MIN, TYPE_META, estimateTextWidth } from './constants';
import InlineRow from './InlineRow';
import Tooltip from './Tooltip';

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

const generateId = () => Math.random().toString(36).slice(2, 10);

const newBlankItem = (): Item => ({
  id: `new_${generateId()}`,
  transaction: 'vente',
  type: 'vetement',
  titre: '',
  url: '',
  description: '',
  prixAchat: null,
  prixVente: null,
  prixVendu: null,
  marge: null,
  compareAvec: [],
  prixIACible: null,
  recommandations: '',
  platformId: null,
  dateAjout: new Date().toISOString(),
});

// Calcul des largeurs de colonnes selon le contenu le plus long
function useColWidths(items: Item[], platforms: Platform[]) {
  return useMemo(() => {
    const priceW = (v: number | null) => v !== null ? estimateTextWidth(`${v.toFixed(2)} €`, 13, true) : 0;
    const margeW = (v: number | null) => v !== null ? estimateTextWidth(`${v >= 0 ? '+' : ''}${v.toFixed(2)} €`, 13, true) : 0;

    let type        = estimateTextWidth('Catégorie', 12, true);
    let finances    = COL_MIN.finances;
    let ia          = COL_MIN.ia;

    for (const item of items) {
      const meta = TYPE_META[item.type];
      type     = Math.max(type, estimateTextWidth(meta.label, 12, true) + 28);
      // finances : la ligne la plus large entre achat, vente, vendu, marge
      const fw = Math.max(priceW(item.prixAchat), priceW(item.prixVente), priceW(item.prixVendu), margeW(item.marge)) + 60; // +60 pour le label inline
      finances = Math.max(finances, fw);
      // ia : prixIA + texte court
      const iw = priceW(item.prixIACible) + Math.min(estimateTextWidth(item.recommandations, 11, false), 180);
      ia       = Math.max(ia, iw);
    }

    return {
      transaction: COL_MIN.transaction,
      type:        Math.max(COL_MIN.type, type),
      titre:       0,   // flex:1
      url:         COL_MIN.url,
      finances:    Math.max(COL_MIN.finances, finances),
      compareAvec: COL_MIN.compareAvec,
      ia:          Math.max(COL_MIN.ia, ia),
      actions:     COL_MIN.actions,
    };
  }, [items, platforms]);
}

const HEADER_H = 44;

// ── Dropdown filtre types ─────────────────────────────────────────────────────
const TypeFilterDropdown: React.FC<{
  activeTypeFilters: Set<ItemType>;
  onToggle: (t: ItemType) => void;
  onClear: () => void;
}> = ({ activeTypeFilters, onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const hasFilter = activeTypeFilters.size > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = hasFilter
    ? Array.from(activeTypeFilters).map(t => TYPE_META[t].label).join(', ')
    : 'Tous les types';

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', height: 36, borderRadius: 9,
          border: `1px solid ${hasFilter ? hexAlpha(theme.accent.gold, 0.6) : hexAlpha(theme.accent.gold, 0.30)}`,
          background: hasFilter ? hexAlpha(theme.accent.gold, 0.10) : hexAlpha('#FFFFFF', 0.60),
          display: 'flex', alignItems: 'center', gap: 8, paddingInline: 12,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: hasFilter ? theme.accent.gold : '#000000', flexShrink: 0 }}>filter_list</span>
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: hasFilter ? 700 : 400, color: hasFilter ? theme.accent.gold : theme.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {hasFilter && (
          <span
            onMouseDown={e => { e.stopPropagation(); onClear(); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: theme.accent.gold }}>close</span>
          </span>
        )}
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#000000', flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 40, left: 0, right: 0, zIndex: 999,
          background: '#FFFFFF', borderRadius: 10,
          border: `1px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
          boxShadow: `0 8px 24px ${hexAlpha('#000000', 0.12)}`,
          overflow: 'hidden',
        }}>
          {(Object.entries(TYPE_META) as [ItemType, typeof TYPE_META[ItemType]][]).map(([type, meta]) => {
            const active = activeTypeFilters.has(type);
            return (
              <div
                key={type}
                onMouseDown={e => { e.preventDefault(); onToggle(type); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  background: active ? hexAlpha(meta.color, 0.10) : 'transparent',
                  borderLeft: `3px solid ${active ? meta.color : 'transparent'}`,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 400, color: active ? meta.color : theme.text.primary }}>
                  {meta.label}
                </span>
                {active && <span className="material-symbols-rounded" style={{ fontSize: 16, color: meta.color }}>check</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// En-tête colonne — largeur + hauteur identiques aux cellules de données
const TH: React.FC<{ label: string; tooltip: string; width?: number; flex?: number; maxWidth?: number; align?: 'left' | 'center' | 'right'; gold?: boolean }> = ({
  label, tooltip, width, flex, maxWidth, align = 'left', gold,
}) => (
  <Tooltip text={tooltip} placement="bottom">
    <div style={{
      ...(width !== undefined ? { width, flexShrink: 0 } : {}),
      ...(flex  !== undefined ? { flex, minWidth: 0 }   : {}),
      ...(maxWidth !== undefined ? { maxWidth }          : {}),
      height: HEADER_H,
      display: 'flex', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      padding: '0 8px',
      boxSizing: 'border-box',
      fontSize: 11, fontWeight: 700,
      color: gold ? theme.accent.gold : '#000000',
      letterSpacing: 0.5, textTransform: 'uppercase',
      userSelect: 'none', cursor: 'default', whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  </Tooltip>
);

interface ItemTableProps {
  items: Item[];
  platforms: Platform[];
  onSaveItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onRequestPerplexity?: (item: Item) => void;
  onOpenReport?: (item: Item) => void;
  activeTypeFilters?: Set<ItemType>;
  onActiveTypeFiltersChange?: (filters: Set<ItemType>) => void;
}

const ItemTable: React.FC<ItemTableProps> = ({
  items, platforms, onSaveItem, onDeleteItem, onRequestPerplexity, onOpenReport,
  activeTypeFilters: externalFilters, onActiveTypeFiltersChange,
}) => {
  const [newRow, setNewRow] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'date' | 'prix' | 'marge' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [internalFilters, setInternalFilters] = useState<Set<ItemType>>(new Set());

  const activeTypeFilters = externalFilters ?? internalFilters;
  const COL = useColWidths(items, platforms);
  const isMobile = useIsMobile();

  const toggleTypeFilter = (type: ItemType) => {
    const next = new Set(activeTypeFilters);
    if (next.has(type)) next.delete(type); else next.add(type);
    if (onActiveTypeFiltersChange) onActiveTypeFiltersChange(next);
    else setInternalFilters(next);
  };

  const clearTypeFilters = () => {
    if (onActiveTypeFiltersChange) onActiveTypeFiltersChange(new Set());
    else setInternalFilters(new Set());
  };

  const childIds = new Set(items.flatMap(i => i.compareAvec));
  const roots = items.filter(i => !childIds.has(i.id));

  const handleSave = (updated: Item) => {
    onSaveItem(updated);
    if (updated.id.startsWith('new_')) setNewRow(null);
  };

  // Rentabilité estimée d'un item : marge réelle > marge estimée > null
  const rentabilite = (i: Item): number | null => {
    if (i.marge !== null) return i.marge;
    if (i.prixVendu !== null && i.prixAchat !== null) return i.prixVendu - i.prixAchat;
    if (i.prixVente !== null && i.prixAchat !== null) return i.prixVente - i.prixAchat;
    if (i.prixVente !== null) return i.prixVente;
    return null;
  };

  const filtered = roots.filter(r => {
    if (activeTypeFilters.size > 0 && !activeTypeFilters.has(r.type)) return false;
    return (
      r.titre.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === 'date') { va = new Date(a.dateAjout).getTime(); vb = new Date(b.dateAjout).getTime(); }
    if (sortKey === 'prix') { va = a.prixVente ?? a.prixAchat ?? 0; vb = b.prixVente ?? b.prixAchat ?? 0; }
    if (sortKey === 'marge') { va = rentabilite(a) ?? 0; vb = rentabilite(b) ?? 0; }
    return sortDir === 'desc' ? vb - va : va - vb;
  }) : filtered;

  const renderGroup = (parent: Item): React.ReactNode => {
    const children = parent.compareAvec
      .map(id => items.find(i => i.id === id))
      .filter((i): i is Item => Boolean(i))
      // tri : rentabilité décroissante, puis date décroissante
      .sort((a, b) => {
        const ra = rentabilite(a), rb = rentabilite(b);
        if (ra !== null && rb !== null && ra !== rb) return rb - ra;
        if (ra !== null && rb === null) return -1;
        if (ra === null && rb !== null) return 1;
        return b.dateAjout.localeCompare(a.dateAjout);
      });

    // Le meilleur du groupe (parent + enfants)
    const groupe = [parent, ...children];
    const bestRenta = Math.max(...groupe.map(i => rentabilite(i) ?? -Infinity));
    const bestId = bestRenta > -Infinity
      ? groupe.find(i => (rentabilite(i) ?? -Infinity) === bestRenta)?.id
      : undefined;

    return (
      <div key={parent.id} style={{ marginBottom: children.length > 0 ? 8 : 3 }}>
        <InlineRow item={parent} allItems={items} platforms={platforms} depth={0} col={COL}
          onSave={handleSave} onDelete={onDeleteItem} onRequestPerplexity={onRequestPerplexity} onOpenReport={onOpenReport}
          isBest={children.length > 0 && bestRenta > -Infinity && bestId === parent.id} />
        {children.length > 0 && (
          <div style={{ marginLeft: 14, borderLeft: `2px solid ${hexAlpha('#16A34A', 0.15)}`, paddingLeft: 4, marginTop: 3 }}>
            {children.map(child => (
              <InlineRow key={child.id} item={child} allItems={items} platforms={platforms} depth={1} col={COL}
                onSave={handleSave} onDelete={onDeleteItem} onRequestPerplexity={onRequestPerplexity} onOpenReport={onOpenReport}
                isBest={bestRenta > -Infinity && bestId === child.id} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Dropdown filtre types (mobile) ── */}
      {isMobile && <TypeFilterDropdown activeTypeFilters={activeTypeFilters} onToggle={toggleTypeFilter} onClear={clearTypeFilters} />}

      {/* ── Barre légende + bouton ajout ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        {!isMobile && (
          <div className="legend-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {(Object.entries(TYPE_META) as [ItemType, typeof TYPE_META[ItemType]][]).map(([type, meta]) => {
              const active = activeTypeFilters.has(type);
              return (
                <Tooltip key={type} text={active ? `Retirer le filtre "${meta.label}"` : `Filtrer sur "${meta.label}"`}>
                  <span
                    onClick={() => toggleTypeFilter(type)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: active ? meta.color : hexAlpha(meta.color, 0.12),
                      color: active ? '#FFFFFF' : meta.color,
                      border: `1px solid ${meta.color}`,
                      borderRadius: 7, padding: '4px 10px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      transition: 'background 0.14s, color 0.14s',
                      userSelect: 'none',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{meta.icon}</span>
                    {meta.label}
                    {active && <span className="material-symbols-rounded" style={{ fontSize: 12, marginLeft: 2 }}>close</span>}
                  </span>
                </Tooltip>
              );
            })}
            {activeTypeFilters.size > 0 && (
              <Tooltip text="Effacer tous les filtres de type">
                <button
                  onClick={() => clearTypeFilters()}
                  style={{
                    height: 26, paddingInline: 8, borderRadius: 7, border: `1px solid ${hexAlpha(theme.text.secondary, 0.35)}`,
                    background: hexAlpha(theme.text.secondary, 0.08), cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: theme.text.secondary,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 13 }}>filter_alt_off</span>
                  Tout
                </button>
              </Tooltip>
            )}
          </div>
        )}

        <button
          data-testid="tutorial-add-item"
          onClick={() => !newRow && setNewRow(newBlankItem())}
          disabled={!!newRow}
          style={{
            height: isMobile ? 38 : 44, borderRadius: 11, border: 'none',
            cursor: newRow ? 'not-allowed' : 'pointer',
            background: newRow
              ? hexAlpha(theme.accent.gold, 0.12)
              : `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
            color: theme.accent.buttonText, fontSize: isMobile ? 12 : 13, fontWeight: 700,
            paddingInline: isMobile ? 14 : 18,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            marginLeft: isMobile ? 'auto' : undefined,
            boxShadow: newRow ? 'none' : `0 4px 12px ${hexAlpha(theme.accent.gold, 0.28)}`,
            opacity: newRow ? 0.6 : 1,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: isMobile ? 16 : 18 }}>add</span>
          {isMobile ? 'Ajouter' : 'Nouvel article'}
        </button>
      </div>

      {/* ── Barre recherche + tri ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
        background: hexAlpha('#FFFFFF', 0.60),
        border: `1px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
        borderRadius: 11, padding: '6px 12px',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#000000' }}>search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un article..."
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: theme.text.primary,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#000000' }}>close</span>
          </button>
        )}
        <div style={{ width: 1, height: 18, background: hexAlpha(theme.accent.gold, 0.18) }} />
        {/* Boutons tri */}
        {([['date', 'calendar_today', 'Date'], ['prix', 'sell', 'Prix'], ['marge', 'savings', 'Marge']] as const).map(([key, icon, label]) => {
          const active = sortKey === key;
          return (
            <button
              key={key}
              onClick={() => { if (active) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortKey(key); setSortDir('desc'); } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                height: 26, paddingInline: 8, borderRadius: 7, border: 'none', cursor: 'pointer',
                background: active ? hexAlpha(theme.accent.gold, 0.14) : 'transparent',
                color: active ? theme.accent.gold : '#000000',
                fontSize: 11, fontWeight: active ? 700 : 500, transition: 'background 0.12s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>{icon}</span>
              {label}
              {active && <span className="material-symbols-rounded" style={{ fontSize: 11 }}>{sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>}
            </button>
          );
        })}
      </div>

      {/* ── En-têtes de colonnes (desktop uniquement) ── */}
      {!isMobile && (
        <div data-testid="tutorial-table-header" style={{
          display: 'flex', alignItems: 'stretch', height: HEADER_H,
          background: hexAlpha('#FFFFFF', 0.58),
          borderRadius: 12,
          border: `1px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
          marginBottom: 6, flexShrink: 0,
          boxSizing: 'border-box',
        }}>
          <TH label="±"          tooltip="Statut : + vente · − achat · ? en attente · ✕ perdu"   width={COL.transaction} align="center" />
          <TH label="Catégorie"  tooltip="Catégorie / type de l'objet"                              width={COL.type} />
          <TH label="Titre"      tooltip="Double-cliquez sur une ligne pour la modifier"            flex={1} />
          <TH label="🔗"         tooltip="Lien vers l'annonce"                                      width={COL.url}         align="center" />
          <div data-testid="tutorial-col-prices" style={{ width: COL.finances, flexShrink: 0, height: HEADER_H, display: 'flex', alignItems: 'center', padding: '0 4px', gap: 6, boxSizing: 'border-box' }}>
            {(['Achat', 'Proposition', 'Vente'] as const).map((lbl, i) => (
              <React.Fragment key={lbl}>
                {i > 0 && <div style={{ width: 1, height: 16, background: hexAlpha(theme.accent.gold, 0.20), flexShrink: 0 }} />}
                <span style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 700, color: theme.text.primary, letterSpacing: 0.5, textTransform: 'uppercase', userSelect: 'none' }}>
                  {lbl}
                </span>
              </React.Fragment>
            ))}
          </div>
          <TH label="Comp."      tooltip="Articles liés pour comparaison de prix"                   width={COL.compareAvec} align="center" />
          <div style={{ width: 3, alignSelf: 'stretch', background: hexAlpha(theme.accent.gold, 0.22), margin: '6px 0', flexShrink: 0, borderRadius: 2 }} />
          <TH label="IA" tooltip="Prix cible IA + recommandation" width={COL.ia} gold />
          <div style={{ width: COL.actions, flexShrink: 0 }} />
        </div>
      )}

      {/* ── Corps ── */}
      <div className="table-scroll-area">
        <div>
          {newRow && (
            <div style={{ marginBottom: 5 }}>
              <InlineRow item={newRow} allItems={items} platforms={platforms} depth={0} col={COL}
                onSave={handleSave} onDelete={() => setNewRow(null)} isNew onCancelNew={() => setNewRow(null)}
                onRequestPerplexity={onRequestPerplexity} onOpenReport={onOpenReport} />
            </div>
          )}

          {items.length === 0 && !newRow ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 44, color: hexAlpha(theme.text.secondary, 0.22) }}>inventory_2</span>
              <span style={{ fontSize: 14, color: hexAlpha(theme.text.secondary, 0.45), textAlign: 'center', paddingInline: 16 }}>
                Aucun article — appuyez sur «Ajouter» pour commencer
              </span>
            </div>
          ) : (
            sorted.map(root => renderGroup(root))
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemTable;
