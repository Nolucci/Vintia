import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Item, ItemType, Platform } from '../../types';
import { theme, hexAlpha } from '../../theme';
import { getTransactionMeta, TRANSACTION_CYCLE, getTypeMeta, COL_MIN } from './constants';
import Tooltip from './Tooltip';
import { useLang } from '../../contexts/LanguageContext';

// ITEM_TYPES is built dynamically in the component using getTypeMeta(t)

const ROW_H = 68;

const RED   = '#EF4444';
const GREEN = '#16A34A';
const DASH_COLOR = hexAlpha('#8A9BA8', 0.30);

// ── Hook pour détecter mobile ─────────────────────────────────────────────
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

// ── Input numérique inline ────────────────────────────────────────────────
const NumInput: React.FC<{
  value: number | null;
  onChange: (v: number | null) => void;
  color?: string;
}> = ({ value, onChange, color }) => (
  <input
    type="number"
    step="0.01"
    min="0"
    value={value ?? ''}
    placeholder="—"
    autoFocus={false}
    onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
    style={{
      width: '100%', height: 20, border: 'none',
      borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
      background: 'transparent', outline: 'none',
      fontSize: 13, fontWeight: 600,
      color: color ?? theme.text.primary,
      textAlign: 'right', padding: 0,
    }}
  />
);

// ── Cellule finances en 3 sous-colonnes alignées (lecture) ───────────────
const FinCol: React.FC<{ label: string; val: number | null; color: string; prefix?: string; testId?: string }> = ({ label, val, color, prefix = '', testId }) => (
  <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flex: 1, minWidth: 0 }}>
    <span style={{ fontSize: 9, fontWeight: 700, color: hexAlpha(color, 1), textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1 }}>
      {label}
    </span>
    <span style={{ fontSize: 13, fontWeight: 700, color: val !== null ? color : DASH_COLOR, lineHeight: 1 }}>
      {val !== null ? `${prefix}${val.toFixed(2)} €` : '—'}
    </span>
  </div>
);

const FinSep = () => (
  <div style={{ width: 1, alignSelf: 'stretch', background: hexAlpha('#8A9BA8', 0.12), flexShrink: 0, margin: '2px 0' }} />
);

const FinancesCell: React.FC<{
  prixAchat: number | null;
  prixVente: number | null;
  prixVendu: number | null;
}> = ({ prixAchat, prixVente, prixVendu }) => {
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, width: '100%', paddingInline: 4 }}>
      <FinCol label={t.rowPriceAchat} val={prixAchat}  color={RED} testId="tutorial-item-price-achat" />
      <FinSep />
      <FinCol label={t.rowPriceVente} val={prixVente}  color={theme.accent.blue} testId="tutorial-item-price-vente" />
      <FinSep />
      <FinCol label={t.rowPriceVendu} val={prixVendu}  color={GREEN} testId="tutorial-item-price-vendu" />
    </div>
  );
};

interface InlineRowProps {
  item: Item;
  allItems: Item[];
  platforms: Platform[];
  depth: number;
  col: typeof COL_MIN;
  onSave: (updated: Item) => void;
  onDelete: (id: string) => void;
  onRequestAI?: (item: Item) => void;
  onRequestPerplexity?: (item: Item) => void;
  onOpenReport?: (item: Item) => void;
  isNew?: boolean;
  onCancelNew?: () => void;
  isBest?: boolean;
}

const InlineRow: React.FC<InlineRowProps> = ({
  item, allItems, platforms, depth, col, onSave, onDelete, onRequestAI, onRequestPerplexity, onOpenReport,
  isNew = false, onCancelNew, isBest = false,
}) => {
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState<Item>({ ...item, description: item.description ?? '' });

  useEffect(() => {
    if (!editing) setDraft({ ...item, description: item.description ?? '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [comparePos, setComparePos] = useState<{ top: number; left: number } | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const compareBtnRef = useRef<HTMLButtonElement>(null);

  const openCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showCompare && compareBtnRef.current) {
      const r = compareBtnRef.current.getBoundingClientRect();
      const popupW = 240;
      const popupH = 240;
      // Place à gauche du bouton si ça déborderait à droite
      const left = r.right + popupW > window.innerWidth ? r.left - popupW - 4 : r.right + 4;
      // Place au-dessus si ça déborderait en bas
      const top = r.bottom + popupH > window.innerHeight ? r.top - popupH - 4 : r.bottom + 4;
      setComparePos({ top, left });
    }
    setShowCompare(s => !s);
  };

  useEffect(() => {
    if (!showCompare) return;
    const handler = () => setShowCompare(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showCompare]);

  const isMobile = useIsMobile();
  const { t, lang } = useLang();
  const allTypeMeta = getTypeMeta(t);
  const allTransMeta = getTransactionMeta(t);

  const isChild = depth > 0;
  const typeMeta = allTypeMeta[draft.type];
  const transMeta = allTransMeta[draft.transaction];

  const set = <K extends keyof Item>(k: K, v: Item[K]) =>
    setDraft(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'prixVendu' || k === 'prixAchat') {
        const pa = k === 'prixAchat' ? (v as number | null) : next.prixAchat;
        const pv = k === 'prixVendu' ? (v as number | null) : next.prixVendu;
        next.marge = pa !== null && pv !== null ? pv - pa : null;
      }
      return next;
    });

  const cycleTransaction = () => {
    const idx = TRANSACTION_CYCLE.indexOf(draft.transaction);
    const next = TRANSACTION_CYCLE[(idx + 1) % TRANSACTION_CYCLE.length];
    const updated = { ...draft, transaction: next };
    setDraft(updated);
    if (!editing) onSave(updated);
  };

  const save = useCallback(() => {
    if (!draft.titre.trim()) {
      if (isNew && onCancelNew) { onCancelNew(); return; }
      return;
    }
    onSave(draft);
    setEditing(false);
    setShowCompare(false);
  }, [draft, isNew, onCancelNew, onSave]);

  const cancel = () => {
    if (isNew && onCancelNew) { onCancelNew(); return; }
    setDraft({ ...item });
    setEditing(false);
    setShowCompare(false);
  };

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) save();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing, save]);

  const toggleCompare = (id: string) => {
    const next = draft.compareAvec.includes(id)
      ? draft.compareAvec.filter(x => x !== id)
      : [...draft.compareAvec, id];
    const updated = { ...draft, compareAvec: next };
    setDraft(updated);
    onSave(updated);
  };

  const accentColor =
    draft.transaction === 'attente' ? '#F59E0B' :
    draft.transaction === 'perdu'   ? '#8A9BA8' :
    typeMeta.color;

  const rowBg = isBest
    ? hexAlpha(GREEN, 0.07)
    : isChild
      ? hexAlpha(typeMeta.color, 0.04)
      : editing
        ? hexAlpha(theme.accent.gold, 0.04)
        : draft.transaction === 'attente'
          ? hexAlpha('#F59E0B', 0.04)
          : draft.transaction === 'perdu'
            ? hexAlpha('#8A9BA8', 0.05)
            : hexAlpha('#FFFFFF', 0.72);

  const cell = (w: number, extra?: React.CSSProperties): React.CSSProperties => ({
    width: w, flexShrink: 0, height: ROW_H,
    display: 'flex', alignItems: 'center',
    boxSizing: 'border-box',
    ...extra,
  });

  // ── Parsing IA (partagé entre mobile et desktop) ──────────────────────
  let iaAchat: number | null = null;
  let iaProp: number | null = null;
  let iaComment: string = item.recommandations ?? '';
  if (item.analyseIA) {
    try {
      const parsed = JSON.parse(item.analyseIA);
      const toNum = (v: string | null | undefined) => {
        if (!v) return null;
        const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(n) ? null : n;
      };
      iaAchat = toNum(parsed.suggestedBuyPrice);
      iaProp  = toNum(parsed.recommendedPrice);
      if (!iaComment) iaComment = parsed.shortSummary ?? parsed.tips?.[0] ?? '';
    } catch { /* ignore */ }
  }
  const iaMarge = iaAchat !== null && iaProp !== null ? iaProp - iaAchat : null;
  const iaMargePos = iaMarge !== null && iaMarge >= 0;
  const hasIA = item.analyseIA && (iaAchat !== null || iaProp !== null);

  // ── VUE CARTE MOBILE ─────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div ref={rowRef} style={{ position: 'relative', marginBottom: 6 }}>
        <div
          style={{
            background: rowBg,
            borderRadius: isChild ? '0 12px 12px 0' : 12,
            boxShadow: editing
              ? `inset 3px 0 0 ${hexAlpha(accentColor, 1)}, 0 0 0 1.5px ${hexAlpha(theme.accent.gold, 0.25)}`
              : isBest
                ? `inset 3px 0 0 ${hexAlpha(GREEN, 0.7)}, 0 0 0 1.5px ${hexAlpha(GREEN, 0.30)}`
                : `inset 3px 0 0 ${hexAlpha(accentColor, isChild ? 0.45 : 0.22)}`,
            opacity: draft.transaction === 'perdu' ? 0.65 : 1,
            transition: 'background 0.12s, box-shadow 0.12s',
            paddingLeft: isChild ? 12 : 0,
            overflow: 'hidden',
          }}
        >
          {editing ? (
            /* ── Carte en mode édition ── */
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Ligne 1 : statut + catégorie */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  onClick={e => { e.stopPropagation(); cycleTransaction(); }}
                  style={{
                    fontSize: 14, fontWeight: 900, lineHeight: 1,
                    color: transMeta.color, fontFamily: 'monospace', userSelect: 'none',
                    background: hexAlpha(transMeta.color, 0.10),
                    borderRadius: 6, width: 30, height: 30, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${hexAlpha(transMeta.color, 0.45)}`,
                    cursor: 'pointer',
                  }}
                >
                  {transMeta.symbol}
                </div>
                <select
                  value={draft.type}
                  onChange={e => set('type', e.target.value as ItemType)}
                  style={{
                    flex: 1, height: 32, fontSize: 13, fontWeight: 700,
                    border: 'none', borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                    background: 'transparent', outline: 'none', cursor: 'pointer',
                    color: allTypeMeta[draft.type].color,
                  }}
                >
                  {Object.entries(allTypeMeta).map(([val, meta]) => (
                    <option key={val} value={val}>{meta.label}</option>
                  ))}
                </select>
              </div>

              {/* Ligne 2 : titre */}
              <input
                autoFocus
                value={draft.titre}
                onChange={e => set('titre', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                placeholder={t.rowTitlePlaceholder}
                style={{
                  width: '100%', border: 'none',
                  borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                  background: 'transparent', outline: 'none',
                  fontSize: 15, fontWeight: 600, color: theme.text.primary, padding: 0,
                }}
              />

              {/* Ligne 3 : prix */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: hexAlpha(RED, 0.7), textTransform: 'uppercase', marginBottom: 2 }}>{t.rowPriceAchat}</div>
                  <NumInput value={draft.prixAchat} onChange={v => set('prixAchat', v)} color={RED} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.accent.blue, textTransform: 'uppercase', marginBottom: 2 }}>{t.rowPriceVente}</div>
                  <NumInput value={draft.prixVente} onChange={v => set('prixVente', v)} color={theme.accent.blue} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: hexAlpha(GREEN, 0.9), textTransform: 'uppercase', marginBottom: 2 }}>{t.rowPriceVendu}</div>
                  <NumInput value={draft.prixVendu} onChange={v => set('prixVendu', v)} color={GREEN} />
                </div>
              </div>

              {/* Plateforme + URL */}
              {platforms.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#000000', flexShrink: 0 }}>{t.rowPlatform}</span>
                  <select
                    value={draft.platformId ?? ''}
                    onChange={e => set('platformId', e.target.value || null)}
                    style={{
                      flex: 1, height: 22, fontSize: 11, border: 'none',
                      borderBottom: `1px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
                      background: 'transparent', outline: 'none', cursor: 'pointer', color: theme.text.primary,
                    }}
                  >
                    <option value="">— {t.rowNoPlatform} —</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#000000', flexShrink: 0 }}>{t.rowLink}</span>
                <input
                  value={draft.url}
                  onChange={e => set('url', e.target.value)}
                  placeholder="https://..."
                  style={{
                    flex: 1, height: 22, border: 'none',
                    borderBottom: `1px solid ${hexAlpha(theme.accent.blue, 0.28)}`,
                    background: 'transparent', outline: 'none',
                    fontSize: 11, color: theme.accent.blue, padding: 0,
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 12, color: theme.accent.gold, marginTop: 4 }}>notes</span>
                <textarea
                  value={draft.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  placeholder={t.rowDescPlaceholder}
                  rows={2}
                  style={{
                    flex: 1, border: 'none', resize: 'vertical', minHeight: 36,
                    borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
                    background: 'transparent', outline: 'none',
                    fontSize: 11, color: theme.text.primary, padding: '2px 0',
                    lineHeight: 1.5, fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Actions édition */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {/* Comparaison en édition */}
                <button
                  ref={compareBtnRef}
                  onClick={openCompare}
                  style={{
                    ...btnStyle(theme.accent.blue),
                    background: showCompare ? hexAlpha(theme.accent.blue, 0.18) : hexAlpha(theme.accent.blue, 0.08),
                    position: 'relative',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 15, color: theme.accent.blue }}>compare_arrows</span>
                  {draft.compareAvec.length > 0 && (
                    <span style={{
                      position: 'absolute', top: 2, right: 2,
                      fontSize: 8, fontWeight: 700, color: '#fff',
                      background: theme.accent.blue, borderRadius: '50%',
                      width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}>{draft.compareAvec.length}</span>
                  )}
                </button>
                {onRequestPerplexity && (
                  <button onClick={e => { e.stopPropagation(); save(); onRequestPerplexity(draft); }} style={btnStyle('#0E74F4')}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#0E74F4' }}>travel_explore</span>
                  </button>
                )}
                <button onClick={save} style={btnStyle('#22C55E')}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#16A34A' }}>check</span>
                </button>
                <button onClick={cancel} style={btnStyle('#8A9BA8')}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.text.secondary }}>close</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Carte en lecture ── */
            <div
              style={{ padding: '8px 10px 8px 12px' }}
              onDoubleClick={() => setEditing(true)}
            >
              {/* Ligne 1 : statut + titre + lien + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div
                  onClick={e => { e.stopPropagation(); cycleTransaction(); }}
                  style={{
                    fontSize: 13, fontWeight: 900, lineHeight: 1,
                    color: transMeta.color, fontFamily: 'monospace', userSelect: 'none',
                    background: hexAlpha(transMeta.color, 0.10),
                    borderRadius: 5, width: 26, height: 26, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${hexAlpha(transMeta.color, 0.25)}`,
                    cursor: 'pointer',
                  }}
                >
                  {transMeta.symbol}
                </div>

                <span style={{
                  flex: 1, fontSize: 14, fontWeight: isChild ? 500 : 600,
                  color: draft.transaction === 'perdu' ? '#8A9BA8' : theme.text.primary,
                  textDecoration: draft.transaction === 'perdu' ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {draft.titre || <span style={{ opacity: 0.55 }}>{t.rowUntitled}</span>}
                </span>

                {draft.url && (
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: hexAlpha(theme.accent.blue, 0.10),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14, color: theme.accent.blue }}>open_in_new</span>
                  </a>
                )}
              </div>

              {/* Ligne 2 : catégorie + date + plateforme */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: hexAlpha(typeMeta.color, 0.10),
                  color: typeMeta.color,
                  border: `1px solid ${hexAlpha(typeMeta.color, 0.22)}`,
                  borderRadius: 6, padding: '2px 7px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 11 }}>{typeMeta.icon}</span>
                  {typeMeta.label}
                </span>
                {draft.platformId && (
                  <span style={{ fontSize: 10, color: '#000000', background: hexAlpha('#1A2332', 0.05), borderRadius: 4, padding: '2px 5px' }}>
                    {platforms.find(p => p.id === draft.platformId)?.label}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#000000', marginLeft: 'auto' }}>
                  {draft.dateAjout ? new Date(draft.dateAjout).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                </span>
              </div>

              {/* Ligne 3 : prix */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: hasIA ? 5 : 0, background: hexAlpha('#1A2332', 0.025), borderRadius: 7, overflow: 'hidden' }}>
                {[
                  { label: t.rowPriceAchat, val: draft.prixAchat, color: RED },
                  { label: t.rowPriceVente, val: draft.prixVente, color: theme.accent.blue },
                  { label: t.rowPriceVendu, val: draft.prixVendu, color: GREEN },
                ].map(({ label, val, color }, i) => (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '4px 8px', borderLeft: i > 0 ? `1px solid ${hexAlpha('#8A9BA8', 0.10)}` : 'none' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: val !== null ? color : DASH_COLOR }}>
                      {val !== null ? `${val.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ligne 4 : IA */}
              {hasIA && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, background: hexAlpha(theme.accent.gold, 0.05), borderRadius: 7, padding: '4px 8px' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 12, color: theme.accent.gold, flexShrink: 0 }}>auto_awesome</span>
                  {iaAchat !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: RED, textTransform: 'uppercase' }}>{t.rowIABuy}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>{iaAchat.toFixed(2)} €</span>
                    </div>
                  )}
                  {iaAchat !== null && iaProp !== null && (
                    <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.18) }} />
                  )}
                  {iaProp !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: theme.accent.gold, textTransform: 'uppercase' }}>{t.rowIAProp}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent.gold }}>{iaProp.toFixed(2)} €</span>
                    </div>
                  )}
                  {iaMarge !== null && (
                    <>
                      <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.18) }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: iaMargePos ? GREEN : RED, textTransform: 'uppercase' }}>{t.rowMarge}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: iaMargePos ? GREEN : RED }}>
                          {iaMargePos ? '+' : ''}{iaMarge.toFixed(2)} €
                        </span>
                      </div>
                    </>
                  )}
                  {item.recommandations && (
                    <>
                      <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.18) }} />
                      <span style={{ fontSize: 11, color: '#000000', flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                        {item.recommandations}
                      </span>
                    </>
                  )}
                </div>
              )}

               {/* Ligne 5 : actions */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                 {/* Bouton comparaison */}
                 <button
                   data-testid="tutorial-compare"
                   ref={compareBtnRef}
                   onClick={openCompare}
                   style={{
                    ...btnStyle(theme.accent.blue),
                    background: showCompare
                      ? hexAlpha(theme.accent.blue, 0.18)
                      : draft.compareAvec.length > 0
                        ? hexAlpha(theme.accent.blue, 0.12)
                        : hexAlpha('#8A9BA8', 0.10),
                    position: 'relative',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 15, color: draft.compareAvec.length > 0 ? theme.accent.blue : theme.text.secondary }}>compare_arrows</span>
                  {draft.compareAvec.length > 0 && (
                    <span style={{
                      position: 'absolute', top: 2, right: 2,
                      fontSize: 8, fontWeight: 700, color: '#fff',
                      background: theme.accent.blue, borderRadius: '50%',
                      width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}>{draft.compareAvec.length}</span>
                  )}
                </button>
                 {draft.description && (
                   <button
                     data-testid="tutorial-description"
                     onClick={e => { e.stopPropagation(); setShowDesc(s => !s); }}
                     style={{ ...btnStyle(theme.accent.gold), background: showDesc ? hexAlpha(theme.accent.gold, 0.16) : hexAlpha(theme.accent.gold, 0.08) }}
                   >
                    <span className="material-symbols-rounded" style={{ fontSize: 14, color: theme.accent.gold }}>{showDesc ? 'expand_less' : 'notes'}</span>
                  </button>
                )}
                {onOpenReport && item.analyseIA && (
                  <button data-testid="tutorial-report" onClick={e => { e.stopPropagation(); onOpenReport(item); }} style={btnStyle(theme.accent.gold)}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: theme.accent.gold }}>receipt_long</span>
                  </button>
                )}
                {onRequestPerplexity && (
                  <button data-testid="tutorial-perplexity" onClick={e => { e.stopPropagation(); onRequestPerplexity(item); }} style={btnStyle('#0E74F4')}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#0E74F4' }}>travel_explore</span>
                  </button>
                )}
                <button onClick={() => setEditing(true)} style={btnStyle(theme.accent.gold)}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15, color: theme.accent.gold }}>edit</span>
                </button>
                {confirmDelete ? (
                  <>
                    <button onClick={() => onDelete(item.id)} style={{ ...btnStyle('#EF4444'), background: '#EF4444' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: '#fff' }}>delete_forever</span>
                    </button>
                    <button onClick={() => setConfirmDelete(false)} style={btnStyle('#8A9BA8')}>
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: theme.text.secondary }}>undo</span>
                    </button>
                  </>
                ) : (
                  <button data-testid="tutorial-delete" onClick={() => setConfirmDelete(true)} style={btnStyle('#EF4444')}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#EF4444' }}>delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description collapsible mobile */}
        {!editing && showDesc && draft.description && (
          <div style={{
            paddingInline: 12, paddingBlock: 6,
            background: hexAlpha(theme.accent.gold, 0.025),
            borderRadius: '0 0 12px 12px',
            borderTop: `1px solid ${hexAlpha(theme.accent.gold, 0.08)}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: theme.text.secondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {draft.description}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── VUE TABLEAU DESKTOP ──────────────────────────────────────────────────
  return (
    <div ref={rowRef} style={{ position: 'relative', marginBottom: 2 }}>
      {/* ── Ligne principale ── */}
      <div
        data-testid={item.id.startsWith('tutorial_mock_') ? 'tutorial-item-row' : undefined}
        style={{
          display: 'flex', alignItems: 'stretch',
          height: ROW_H,
          background: rowBg,
          borderRadius: isChild ? '0 10px 10px 0' : 10,
          boxShadow: editing
            ? `inset 3px 0 0 ${hexAlpha(accentColor, 1)}, 0 0 0 1.5px ${hexAlpha(theme.accent.gold, 0.25)}, 0 2px 8px ${hexAlpha(theme.accent.gold, 0.10)}`
            : isBest
              ? `inset 3px 0 0 ${hexAlpha(GREEN, 0.7)}, 0 0 0 1.5px ${hexAlpha(GREEN, 0.30)}`
              : `inset 3px 0 0 ${hexAlpha(accentColor, isChild ? 0.45 : 0.22)}`,
          opacity: draft.transaction === 'perdu' ? 0.65 : 1,
          transition: 'background 0.12s, box-shadow 0.12s',
          paddingLeft: isChild ? 16 : 0,
        }}
        onDoubleClick={() => !editing && setEditing(true)}
      >
        {/* ── Statut transaction ── */}
        <Tooltip text={`${transMeta.label} — cliquez pour changer`}>
          <div
            style={cell(col.transaction - (isChild ? 16 : 0), {
              justifyContent: 'center', paddingLeft: 6,
            })}
            onClick={e => { e.stopPropagation(); cycleTransaction(); }}
          >
            <span style={{
              fontSize: 15, fontWeight: 900, lineHeight: 1,
              color: transMeta.color, fontFamily: 'monospace', userSelect: 'none',
              background: hexAlpha(transMeta.color, 0.10),
              borderRadius: 6, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${hexAlpha(transMeta.color, editing ? 0.55 : 0.25)}`,
              transition: 'border 0.12s, background 0.12s',
              cursor: 'pointer', flexShrink: 0,
            }}>
              {transMeta.symbol}
            </span>
          </div>
        </Tooltip>

        {/* ── Type ── */}
        <div style={cell(col.type, { padding: '0 6px' })}>
          {editing ? (
            <select
              value={draft.type}
              onChange={e => set('type', e.target.value as ItemType)}
              style={{
                width: '100%', height: 34, fontSize: 13, fontWeight: 700,
                border: 'none', borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                background: 'transparent', outline: 'none', cursor: 'pointer',
                color: allTypeMeta[draft.type].color,
              }}
            >
              {Object.entries(allTypeMeta).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          ) : (
            <Tooltip text={typeMeta.tooltip}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: hexAlpha(typeMeta.color, 0.10),
                color: typeMeta.color,
                border: `1px solid ${hexAlpha(typeMeta.color, 0.22)}`,
                borderRadius: 7, padding: '4px 10px',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'default',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{typeMeta.icon}</span>
                {typeMeta.label}
              </span>
            </Tooltip>
          )}
        </div>

        {/* ── Titre ── */}
        <div style={{ flex: 1, minWidth: 0, height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 8px', boxSizing: 'border-box' }}>
          {editing ? (
            <input
              autoFocus
              value={draft.titre}
              onChange={e => set('titre', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              placeholder={t.rowTitlePlaceholder}
              style={{
                width: '100%', border: 'none',
                borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                background: 'transparent', outline: 'none',
                fontSize: 15, fontWeight: 600, color: theme.text.primary, padding: 0,
              }}
            />
          ) : (
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <Tooltip text={t.rowDblClickToEdit} placement="bottom">
                  <span
                    data-testid="tutorial-item-title"
                    style={{
                      fontSize: 15, fontWeight: isChild ? 500 : 600,
                      color: draft.transaction === 'perdu' ? '#8A9BA8' : theme.text.primary,
                      textDecoration: draft.transaction === 'perdu' ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block', cursor: 'text', flex: 1, minWidth: 0,
                    }}>
                    {draft.titre || <span style={{ opacity: 0.55 }}>{t.rowUntitled}</span>}
                  </span>
                </Tooltip>
                <Tooltip text={draft.description ? (showDesc ? t.rowDescHide : t.rowDescShow) : t.rowDescAdd}>
                  <button
                    onClick={e => { e.stopPropagation(); setShowDesc(s => !s); }}
                    style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: 7, border: 'none',
                      background: draft.description
                        ? (showDesc ? hexAlpha(theme.accent.gold, 0.22) : hexAlpha(theme.accent.gold, 0.12))
                        : hexAlpha('#8A9BA8', 0.09),
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                      transition: 'background 0.12s',
                      boxShadow: draft.description ? `0 1px 4px ${hexAlpha(theme.accent.gold, 0.18)}` : 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = draft.description ? hexAlpha(theme.accent.gold, 0.28) : hexAlpha('#8A9BA8', 0.16); }}
                    onMouseLeave={e => { e.currentTarget.style.background = draft.description ? (showDesc ? hexAlpha(theme.accent.gold, 0.22) : hexAlpha(theme.accent.gold, 0.12)) : hexAlpha('#8A9BA8', 0.09); }}
                  >
                    <span className="material-symbols-rounded" style={{
                      fontSize: 14,
                      color: draft.description ? theme.accent.gold : '#8A9BA8',
                    }}>
                      {showDesc ? 'expand_less' : 'notes'}
                    </span>
                  </button>
                </Tooltip>
              </div>
              {draft.platformId && (
                <span data-testid="tutorial-item-platform" style={{ fontSize: 10, color: '#000000', display: 'block' }}>
                  {platforms.find(p => p.id === draft.platformId)?.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── URL ── */}
        <div style={cell(col.url, { justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 2 })}>
          <span style={{ fontSize: 9, color: '#000000', fontWeight: 600, lineHeight: 1 }}>
            {draft.dateAjout ? new Date(draft.dateAjout).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit' }) : ''}
          </span>
          {draft.url ? (
            <Tooltip text={editing ? t.rowEditUrl(draft.url) : t.rowOpenUrl}>
              <a
                href={draft.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: hexAlpha(theme.accent.blue, 0.10),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', flexShrink: 0,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: theme.accent.blue }}>open_in_new</span>
              </a>
            </Tooltip>
          ) : (
            <span style={{ color: hexAlpha(theme.text.secondary, 0.25), fontSize: 11 }}>—</span>
          )}
        </div>

        {/* ── Finances ── */}
        <div style={cell(col.finances, { padding: '0 10px', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 0 })}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, width: 64, flexShrink: 0 }}>{t.rowPriceAchat}</span>
                <NumInput value={draft.prixAchat} onChange={v => set('prixAchat', v)} color="#EF4444" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: theme.accent.blue, fontWeight: 700, width: 64, flexShrink: 0 }}>{t.rowPriceVente}</span>
                <NumInput value={draft.prixVente} onChange={v => set('prixVente', v)} color={theme.accent.blue} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, width: 64, flexShrink: 0 }}>{t.rowPriceVendu}</span>
                <NumInput value={draft.prixVendu} onChange={v => set('prixVendu', v)} color="#16A34A" />
              </div>
            </div>
          ) : (
            <FinancesCell
              prixAchat={draft.prixAchat}
              prixVente={draft.prixVente}
              prixVendu={draft.prixVendu}
            />
          )}
        </div>

        {/* ── Comparé avec ── */}
        <Tooltip text={t.rowCompareCellTooltip}>
          <div data-testid="tutorial-compare" style={cell(col.compareAvec, { justifyContent: 'center' })}>
            {editing ? (
              <button
                ref={compareBtnRef}
                onClick={openCompare}
                style={{
                  height: 26, minWidth: 32, borderRadius: 6, border: 'none',
                  background: showCompare ? hexAlpha(theme.accent.blue, 0.18) : hexAlpha(theme.accent.blue, 0.08),
                  color: theme.accent.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 2, padding: '0 6px',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 12 }}>compare_arrows</span>
                {draft.compareAvec.length > 0 && draft.compareAvec.length}
              </button>
            ) : draft.compareAvec.length > 0 ? (
              <button
                ref={compareBtnRef}
                onClick={openCompare}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: hexAlpha(theme.accent.blue, 0.10),
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  color: theme.accent.blue, fontSize: 11, fontWeight: 700,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 13 }}>compare_arrows</span>
                {draft.compareAvec.length}
              </button>
            ) : (
              <button
                ref={compareBtnRef}
                onClick={openCompare}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: hexAlpha('#8A9BA8', 0.10),
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000000',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 13 }}>compare_arrows</span>
              </button>
            )}
          </div>
        </Tooltip>

        {/* ── Séparateur IA ── */}
        <div style={{
          width: 3, alignSelf: 'stretch', flexShrink: 0, margin: '6px 0',
          background: `linear-gradient(180deg, transparent, ${hexAlpha(theme.accent.gold, 0.25)}, transparent)`,
        }} />

        {/* ── IA ── */}
        <Tooltip text={iaComment ? t.rowIACommentTooltip : t.rowIATooltip}>
          <div data-testid="tutorial-col-ia" onClick={iaComment ? e => { e.stopPropagation(); setShowComment(s => !s); } : undefined} style={{ ...cell(col.ia, { padding: '0 8px', gap: 6 }), cursor: iaComment ? 'pointer' : 'default' }}>
            {editing ? (
              <>
                <NumInput value={draft.prixIACible} onChange={v => set('prixIACible', v)} color={theme.accent.gold} />
                <input
                  value={draft.recommandations}
                  onChange={e => set('recommandations', e.target.value)}
                  placeholder="Recommandation..."
                  style={{
                    flex: 1, border: 'none',
                    borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                    background: 'transparent', outline: 'none',
                    fontSize: 11, color: theme.text.secondary, padding: 0, minWidth: 0,
                  }}
                />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
                {hasIA ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {iaAchat !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: hexAlpha('#EF4444', 0.65), textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>{t.rowIABuy}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{iaAchat.toFixed(2)} €</span>
                      </div>
                    )}
                    {iaAchat !== null && iaProp !== null && (
                      <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.18), flexShrink: 0 }} />
                    )}
                    {iaProp !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: hexAlpha(theme.accent.gold, 0.70), textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>{t.rowIAProp}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent.gold, lineHeight: 1 }}>{iaProp.toFixed(2)} €</span>
                      </div>
                    )}
                    {iaMarge !== null && (
                      <>
                        <div style={{ width: 1, height: 22, background: hexAlpha(theme.accent.gold, 0.18), flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: hexAlpha(iaMargePos ? GREEN : RED, 0.65), textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>{t.rowMarge}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: iaMargePos ? GREEN : RED, lineHeight: 1 }}>
                            {iaMargePos ? '+' : ''}{iaMarge.toFixed(2)} €
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : item.prixIACible !== null ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent.gold, flexShrink: 0 }}>
                    {item.prixIACible.toFixed(2)} €
                  </span>
                ) : null}
                {iaComment && (
                  <span className="material-symbols-rounded" style={{
                    fontSize: 14, marginLeft: 'auto', flexShrink: 0,
                    color: showComment ? theme.accent.gold : hexAlpha(theme.accent.gold, 0.45),
                    transition: 'color 0.15s',
                  }}>
                    {showComment ? 'expand_less' : 'chat_bubble'}
                  </span>
                )}
                {!hasIA && item.prixIACible === null && !iaComment && (
                  <span style={{ opacity: 0.6, fontSize: 11 }}>—</span>
                )}
              </div>
            )}
          </div>
        </Tooltip>

        {/* ── Actions ── */}
        <div style={cell(col.actions, { justifyContent: 'center', gap: 3 })}>
          {editing ? (
            <>
              {onRequestPerplexity && (
                <Tooltip text={t.rowPerplexityTooltip}>
                  <button onClick={e => { e.stopPropagation(); save(); onRequestPerplexity(draft); }} style={btnStyle('#0E74F4')}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#0E74F4' }}>travel_explore</span>
                  </button>
                </Tooltip>
              )}
              {onRequestAI && (
                <Tooltip text={t.rowAIAnalyzeTooltip}>
                  <button onClick={e => { e.stopPropagation(); save(); onRequestAI(draft); }} style={btnStyle(theme.accent.gold)}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.accent.gold }}>auto_awesome</span>
                  </button>
                </Tooltip>
              )}
              <Tooltip text={t.rowSaveTooltip}>
                <button onClick={save} style={btnStyle('#22C55E')}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#16A34A' }}>check</span>
                </button>
              </Tooltip>
              <Tooltip text={t.rowCancelTooltip}>
                <button onClick={cancel} style={btnStyle('#8A9BA8')}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.text.secondary }}>close</span>
                </button>
              </Tooltip>
            </>
          ) : (
            <>
               {onOpenReport && item.analyseIA && (
                 <Tooltip text={t.rowReportTooltip}>
                   <button
                     data-testid="tutorial-report"
                     onClick={e => { e.stopPropagation(); onOpenReport(item); }}
                     style={btnStyle(theme.accent.gold)}
                     onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.22); }}
                     onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.08); }}
                   >
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.accent.gold }}>receipt_long</span>
                  </button>
                </Tooltip>
              )}
               {onRequestPerplexity && (
                 <Tooltip text={t.rowNewAnalysisTooltip}>
                   <button
                     data-testid="tutorial-perplexity"
                     onClick={e => { e.stopPropagation(); onRequestPerplexity(item); }}
                     style={btnStyle('#0E74F4')}
                     onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#0E74F4', 0.18); }}
                     onMouseLeave={e => { e.currentTarget.style.background = hexAlpha('#0E74F4', 0.08); }}
                   >
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#0E74F4' }}>travel_explore</span>
                  </button>
                </Tooltip>
              )}
              {onRequestAI && (
                <Tooltip text={t.rowAIAnalyzeTooltip}>
                  <button
                    onClick={e => { e.stopPropagation(); onRequestAI(item); }}
                    style={btnStyle(theme.accent.gold)}
                    onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.20); }}
                    onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.08); }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.accent.gold }}>auto_awesome</span>
                  </button>
                </Tooltip>
              )}
                <Tooltip text={t.rowEditTooltip}>
                  <button
                    data-testid="tutorial-edit"
                    onClick={() => setEditing(true)}
                    style={btnStyle(theme.accent.gold)}
                  >
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.accent.gold }}>edit</span>
                </button>
              </Tooltip>
              {confirmDelete ? (
                <>
                  <Tooltip text={t.rowDeleteConfirmTooltip}>
                    <button onClick={() => onDelete(item.id)} style={{ ...btnStyle('#EF4444'), background: '#EF4444' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: '#fff' }}>delete_forever</span>
                    </button>
                  </Tooltip>
                  <Tooltip text={t.rowDeleteCancelTooltip}>
                    <button onClick={() => setConfirmDelete(false)} style={btnStyle('#8A9BA8')}>
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: theme.text.secondary }}>undo</span>
                    </button>
                  </Tooltip>
                </>
                 ) : (
                   <Tooltip text={t.rowDeleteTooltip}>
                     <button
                       data-testid="tutorial-delete"
                       onClick={() => setConfirmDelete(true)}
                       style={btnStyle('#EF4444')}
                       onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.18); }}
                       onMouseLeave={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.08); }}
                     >
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#EF4444' }}>delete</span>
                  </button>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Commentaire IA (collapsible) ── */}
      {!editing && showComment && iaComment && (
        <div
          style={{
            padding: '8px 16px',
            background: hexAlpha(theme.accent.gold, 0.04),
            borderRadius: '0 0 10px 10px',
            borderTop: `1px solid ${hexAlpha(theme.accent.gold, 0.12)}`,
            cursor: onRequestPerplexity ? 'pointer' : 'default',
          }}
          onClick={onRequestPerplexity ? e => { e.stopPropagation(); onRequestPerplexity(item); } : undefined}
        >
          <p style={{ margin: 0, fontSize: 12, color: theme.text.secondary, lineHeight: 1.6 }}>
            {iaComment}
          </p>
        </div>
      )}

      {/* ── Description en lecture (collapsible) ── */}
      {!editing && showDesc && (
        <div style={{
          padding: '6px 16px',
          background: hexAlpha(theme.accent.gold, 0.025),
          borderRadius: '0 0 10px 10px',
          borderTop: `1px solid ${hexAlpha(theme.accent.gold, 0.08)}`,
        }}>
          {draft.description ? (
            <p style={{
              margin: 0, fontSize: 12, color: '#000000',
              lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>
              {draft.description}
            </p>
          ) : (
            <span style={{ fontSize: 11, color: '#000000', fontStyle: 'italic' }}>
              {t.rowNoDescEmpty}
            </span>
          )}
        </div>
      )}

      {/* ── Sous-ligne plateforme + URL + description en mode édition ── */}
      {editing && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          paddingLeft: isChild ? 16 + col.transaction + 6 : col.transaction + 6,
          paddingRight: col.actions + 6,
          paddingBlock: 8,
          background: hexAlpha(theme.accent.gold, 0.03),
          borderRadius: '0 0 10px 10px',
          borderTop: `1px solid ${hexAlpha(theme.accent.gold, 0.10)}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {platforms.length > 0 && (
              <>
                <span style={{ fontSize: 11, color: '#000000', flexShrink: 0 }}>{t.rowPlatform}</span>
                <select
                  value={draft.platformId ?? ''}
                  onChange={e => set('platformId', e.target.value || null)}
                  style={{
                    height: 22, fontSize: 11, border: 'none',
                    borderBottom: `1px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
                    background: 'transparent', outline: 'none', cursor: 'pointer', color: theme.text.primary,
                  }}
                >
                  <option value="">— {t.rowNoPlatform} —</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </>
            )}
            <span style={{ fontSize: 11, color: theme.text.secondary, flexShrink: 0 }}>{t.rowLink}</span>
            <input
              value={draft.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://vinted.fr/items/..."
              style={{
                flex: 1, maxWidth: 320, height: 22, border: 'none',
                borderBottom: `1px solid ${hexAlpha(theme.accent.blue, 0.28)}`,
                background: 'transparent', outline: 'none',
                fontSize: 11, color: theme.accent.blue, padding: 0,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 11, color: theme.accent.gold, flexShrink: 0, paddingTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>notes</span>
              {t.rowDescLabelIcon}
            </span>
            <textarea
              value={draft.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder={t.rowDescPlaceholderFull}
              rows={2}
              style={{
                flex: 1, border: 'none', resize: 'vertical', minHeight: 38, maxHeight: 120,
                borderBottom: `1.5px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
                background: 'transparent', outline: 'none',
                fontSize: 11, color: theme.text.primary, padding: '2px 0',
                lineHeight: 1.55, fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Dropdown comparaison (portal → échappe à tout overflow parent) ── */}
      {showCompare && comparePos && createPortal(
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: comparePos.top, left: comparePos.left,
            zIndex: 9999,
            background: theme.bg.secondary,
            border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.40)}`,
            borderRadius: 12, padding: 12, minWidth: 240,
            boxShadow: `0 8px 32px ${hexAlpha('#1A2332', 0.18)}`,
            maxHeight: 240, overflowY: 'auto',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t.rowCompareWith}
          </p>
          {allItems.filter(i => i.id !== item.id).length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: '#000000' }}>{t.rowNoOtherItem}</p>
          ) : (
            allItems.filter(i => i.id !== item.id).map(i => (
              <label key={i.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '5px 8px', borderRadius: 8, marginBottom: 2,
                background: draft.compareAvec.includes(i.id) ? hexAlpha(theme.accent.gold, 0.12) : 'transparent',
              }}>
                <input
                  type="checkbox"
                  checked={draft.compareAvec.includes(i.id)}
                  onChange={() => toggleCompare(i.id)}
                  style={{ accentColor: theme.accent.gold, width: 14, height: 14, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, fontWeight: draft.compareAvec.includes(i.id) ? 700 : 400, color: theme.text.primary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i.titre || <span style={{ color: '#000000', fontStyle: 'italic' }}>{t.rowUntitled}</span>}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                  {i.prixVente !== null ? `${i.prixVente.toFixed(2)} €` : '—'}
                </span>
              </label>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const btnStyle = (color: string): React.CSSProperties => ({
  width: 32, height: 32, borderRadius: 8, border: 'none',
  background: hexAlpha(color, 0.08), cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.12s', flexShrink: 0,
});

export default InlineRow;
