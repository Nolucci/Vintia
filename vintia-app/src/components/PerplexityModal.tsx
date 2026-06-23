import React from 'react';
import { createPortal } from 'react-dom';
import { theme, hexAlpha } from '../theme';
import { useLang } from '../contexts/LanguageContext';
import type { WebSearchResult, SimilarItem } from '../services/webSearch';

const FONT = "'Roboto', system-ui, -apple-system, sans-serif";

interface PerplexityModalProps {
  itemTitle: string;
  itemUrl?: string;
  providerLabel: string;
  loading: boolean;
  result: WebSearchResult | null;
  savedResult?: string;
  error: string | null;
  onClose: () => void;
  onApply?: (prixIACible: number | null, recommandation: string) => void;
}

// Section identique aux cards de l'app
const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{
    background: hexAlpha('#FFFFFF', 0.72),
    border: `1px solid ${hexAlpha(theme.accent.gold, 0.14)}`,
    borderRadius: theme.radius.md,
    padding: '12px 14px',
    fontFamily: FONT,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 13, color: hexAlpha(theme.text.secondary, 0.7) }}>{icon}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, color: hexAlpha(theme.text.secondary, 0.65),
        letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: FONT,
      }}>{title}</span>
    </div>
    {children}
  </div>
);

// ── Carte prix ─────────────────────────────────────────────────────────────
const PriceCard: React.FC<{ label: string; value: string | null; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div style={{
    background: value ? hexAlpha(color, 0.05) : hexAlpha('#1A2332', 0.03),
    border: `1px solid ${value ? hexAlpha(color, 0.18) : hexAlpha('#1A2332', 0.07)}`,
    borderRadius: theme.radius.sm,
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 4,
    fontFamily: FONT,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 13, color: value ? color : hexAlpha(theme.text.secondary, 0.35) }}>{icon}</span>
      <span style={{
        fontSize: 9, fontWeight: 700,
        color: hexAlpha(theme.text.secondary, 0.55),
        letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: FONT,
      }}>{label}</span>
    </div>
    <span style={{ fontSize: 14, fontWeight: 800, color: value ? color : hexAlpha(theme.text.secondary, 0.25), fontFamily: FONT }}>
      {value ?? '—'}
    </span>
  </div>
);

const PerplexityModal: React.FC<PerplexityModalProps> = ({
  itemTitle, itemUrl, providerLabel, loading, result, savedResult, error, onClose, onApply,
}) => {
  const { t } = useLang();

  const scoreStyle = (score: number): { color: string; label: string } => {
    if (score >= 75) return { color: '#16A34A', label: t.perplexityScoreGood };
    if (score >= 50) return { color: '#F59E0B', label: t.perplexityScoreOk };
    return { color: '#EF4444', label: t.perplexityScoreBad };
  };

  const effectiveResult: WebSearchResult | null = result ?? (savedResult
    ? (() => { try { return { summary: '', structured: JSON.parse(savedResult) }; } catch { return null; } })()
    : null);
  const isFromSaved = !result && !!savedResult;
  const s = effectiveResult?.structured;

  const handleApply = () => {
    if (!onApply || !s) return;
    const priceNum = s.recommendedPrice
      ? parseFloat(s.recommendedPrice.replace(/[^\d.,]/g, '').replace(',', '.'))
      : null;
    onApply(isNaN(priceNum as number) ? null : priceNum, s.tips?.[0] ?? '');
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(26, 35, 50, 0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        fontFamily: FONT,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.bg.secondary,
          borderRadius: theme.radius.xl,
          border: `1px solid ${hexAlpha(theme.accent.gold, 0.20)}`,
          width: '100%', maxWidth: 580,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: `0 20px 56px ${hexAlpha('#1A2332', 0.22)}`,
          overflow: 'hidden',
          animation: 'tooltipFadeIn 0.16s ease-out both',
          fontFamily: FONT,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${hexAlpha(theme.accent.gold, 0.16)}`,
          background: hexAlpha('#FFFFFF', 0.72),
          display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: theme.radius.sm, flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 17, color: theme.accent.buttonText }}>travel_explore</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: hexAlpha(theme.accent.gold, 0.85),
                letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: FONT,
              }}>
                {t.perplexityAnalyzeLabel} · {s?.usedProvider ?? providerLabel}
              </span>
              {isFromSaved && (
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: FONT,
                  color: hexAlpha(theme.accent.teal ?? '#0EA5E9', 0.85),
                  background: hexAlpha(theme.accent.teal ?? '#0EA5E9', 0.10),
                  border: `1px solid ${hexAlpha(theme.accent.teal ?? '#0EA5E9', 0.22)}`,
                  borderRadius: 4, padding: '2px 6px', letterSpacing: 0.4, textTransform: 'uppercase',
                }}>{t.perplexitySavedReport}</span>
              )}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: theme.text.primary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: FONT,
            }}>
              {s?.objectName || itemTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: theme.radius.sm, border: 'none',
              background: hexAlpha(theme.text.secondary, 0.09), cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(theme.text.secondary, 0.16); }}
            onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(theme.text.secondary, 0.09); }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: theme.text.secondary }}>close</span>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 10,
          fontFamily: FONT,
        }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '36px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: `3px solid ${hexAlpha(theme.accent.gold, 0.18)}`,
                borderTopColor: theme.accent.gold,
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: theme.text.secondary, fontFamily: FONT }}>{t.perplexityLoading}</span>
            </div>
          )}

          {/* Erreur */}
          {error && !loading && (
            <div style={{
              background: hexAlpha('#EF4444', 0.06),
              border: `1px solid ${hexAlpha('#EF4444', 0.20)}`,
              borderRadius: theme.radius.md, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 4, fontFamily: FONT }}>{t.perplexityErrorTitle}</div>
              <div style={{ fontSize: 12, color: theme.text.secondary, lineHeight: 1.6, fontFamily: FONT }}>{error}</div>
            </div>
          )}

          {/* ── Résultat structuré ── */}
          {effectiveResult && !loading && s && (
            <>
              {/* Bandeau fallback / accès impossible */}
              {(s.accessError || s.usedFallback) && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 12px', borderRadius: theme.radius.sm,
                  background: s.accessError ? hexAlpha('#EF4444', 0.05) : hexAlpha('#F59E0B', 0.06),
                  border: `1px solid ${s.accessError ? hexAlpha('#EF4444', 0.20) : hexAlpha('#F59E0B', 0.22)}`,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: s.accessError ? '#DC2626' : '#D97706', flexShrink: 0, marginTop: 1 }}>
                    {s.accessError ? 'wifi_off' : 'swap_horiz'}
                  </span>
                  <span style={{ fontSize: 12, color: s.accessError ? '#B91C1C' : '#92400E', lineHeight: 1.55, fontFamily: FONT }}>
                    {s.accessError
                      ? t.perplexityAccessError(s.usedProvider ?? '')
                      : t.perplexityFallbackMsg(s.usedProvider ?? '')}
                  </span>
                </div>
              )}

              {/* Bloc principal : objet + URL + score */}
              <div style={{
                background: hexAlpha('#FFFFFF', 0.80),
                border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.22)}`,
                borderRadius: theme.radius.lg,
                padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: `0 2px 8px ${hexAlpha(theme.accent.gold, 0.07)}`,
              }}>
                {/* Objet + URL + prix affiché */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: hexAlpha(theme.accent.gold, 0.75),
                      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT,
                    }}>{t.perplexityObject}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text.primary, fontFamily: FONT }}>{s.objectName || itemTitle}</div>
                    {itemUrl && (
                      <a href={itemUrl} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 11, color: theme.accent.blue, textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3,
                        fontFamily: FONT,
                      }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 12 }}>open_in_new</span>
                        {t.perplexityViewListing}
                      </a>
                    )}
                  </div>
                  {s.platformPrice && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: hexAlpha(theme.text.secondary, 0.6),
                        letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT,
                      }}>{t.perplexityDisplayedPrice}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: theme.text.primary, fontFamily: FONT }}>{s.platformPrice}</div>
                    </div>
                  )}
                </div>

                {/* Score d'approbation */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: hexAlpha(scoreStyle(s.approvalScore).color, 0.07),
                  border: `1px solid ${hexAlpha(scoreStyle(s.approvalScore).color, 0.20)}`,
                  borderRadius: theme.radius.sm, padding: '9px 12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: hexAlpha(theme.text.secondary, 0.65),
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: FONT,
                    }}>
                      {s.actionType.charAt(0).toUpperCase() + s.actionType.slice(1)}
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: hexAlpha(theme.text.secondary, 0.12), overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${s.approvalScore}%`,
                        background: scoreStyle(s.approvalScore).color,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: scoreStyle(s.approvalScore).color, lineHeight: 1, fontFamily: FONT }}>
                      {s.approvalScore}%
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: scoreStyle(s.approvalScore).color, fontFamily: FONT }}>
                      {scoreStyle(s.approvalScore).label}
                    </div>
                  </div>
                </div>

                {/* Résumé */}
                <p style={{ margin: 0, fontSize: 13, color: theme.text.secondary, lineHeight: 1.65, fontFamily: FONT }}>
                  {s.shortSummary}
                </p>
              </div>

              {/* Prix conseillés */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <PriceCard label={t.perplexityBuyPrice}        value={s.suggestedBuyPrice} icon="shopping_cart" color="#EF4444" />
                <PriceCard label={t.perplexitySellPrice}       value={s.recommendedPrice}  icon="sell"          color="#16A34A" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <PriceCard label={t.perplexityMarketRange}     value={s.priceRange}        icon="trending_up"   color={theme.accent.blue} />
                <PriceCard label={t.perplexityPotentialMargin} value={s.potentialMargin}   icon="savings"       color={theme.accent.gold} />
              </div>

              {/* Conseils */}
              {s.tips.length > 0 && (
                <Section title={t.perplexityTips} icon="lightbulb">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {s.tips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          background: hexAlpha(theme.accent.gold, 0.13),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: theme.accent.gold, marginTop: 1,
                          fontFamily: FONT,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: theme.text.primary, lineHeight: 1.55, fontFamily: FONT }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Articles similaires */}
              {s.similarItems.length > 0 && (
                <Section title={t.perplexitySimilarItems} icon="compare_arrows">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {s.similarItems.map((si: SimilarItem, i: number) => (
                      <a
                        key={i}
                        href={si.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          background: hexAlpha('#FFFFFF', 0.80),
                          border: `1px solid ${hexAlpha(theme.accent.gold, 0.12)}`,
                          borderRadius: theme.radius.sm, padding: '7px 10px',
                          textDecoration: 'none', transition: 'background 0.10s, border-color 0.10s',
                          fontFamily: FONT,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = hexAlpha(theme.accent.blue, 0.05);
                          e.currentTarget.style.borderColor = hexAlpha(theme.accent.blue, 0.22);
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = hexAlpha('#FFFFFF', 0.80);
                          e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.12);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 13, color: theme.accent.blue, flexShrink: 0 }}>open_in_new</span>
                          <span style={{
                            fontSize: 12, color: theme.text.primary, fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontFamily: FONT,
                          }}>{si.title}</span>
                        </div>
                        {si.price && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', flexShrink: 0, fontFamily: FONT }}>{si.price}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {/* Sources Perplexity */}
              {effectiveResult.sources && effectiveResult.sources.length > 0 && (
                <Section title={t.perplexitySources} icon="link">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {effectiveResult.sources!.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          background: hexAlpha('#FFFFFF', 0.80),
                          border: `1px solid ${hexAlpha(theme.accent.gold, 0.12)}`,
                          borderRadius: theme.radius.sm, padding: '7px 10px',
                          textDecoration: 'none', fontFamily: FONT,
                        }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 13, color: theme.accent.gold, flexShrink: 0 }}>open_in_new</span>
                        <span style={{
                          fontSize: 12, color: theme.text.primary, fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: FONT,
                        }}>{src.title}</span>
                      </a>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* Fallback texte brut si JSON non parsé */}
          {effectiveResult && !loading && !s && (
            <div style={{
              background: hexAlpha('#FFFFFF', 0.72),
              border: `1px solid ${hexAlpha(theme.accent.gold, 0.18)}`,
              borderRadius: theme.radius.md, padding: '14px 16px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: hexAlpha(theme.accent.gold, 0.8),
                letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT,
              }}>{t.perplexityAnalyzeSection}</div>
              <div style={{ fontSize: 13, color: theme.text.secondary, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: FONT }}>
                {effectiveResult.summary}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 18px',
          borderTop: `1px solid ${hexAlpha(theme.accent.gold, 0.14)}`,
          background: hexAlpha('#FFFFFF', 0.60),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: 8, fontFamily: FONT,
        }}>
          <span style={{ fontSize: 11, color: hexAlpha(theme.text.secondary, 0.50), fontFamily: FONT }}>
            {s?.usedProvider ? t.perplexityAnalyzedBy(s.usedProvider) : t.perplexityVia(providerLabel)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {onApply && s && !s.accessError && s.recommendedPrice && (
              <button
                onClick={handleApply}
                style={{
                  height: 34, borderRadius: theme.radius.sm, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
                  color: theme.accent.buttonText, fontSize: 13, fontWeight: 700,
                  paddingInline: 16,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 2px 8px ${hexAlpha(theme.accent.gold, 0.30)}`,
                  fontFamily: FONT,
                  transition: 'box-shadow 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${hexAlpha(theme.accent.gold, 0.42)}`; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 8px ${hexAlpha(theme.accent.gold, 0.30)}`; }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>check_circle</span>
                {t.perplexityApply}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                height: 34, borderRadius: theme.radius.sm, border: 'none',
                background: hexAlpha(theme.text.secondary, 0.09),
                color: theme.text.primary, fontSize: 13, fontWeight: 600,
                paddingInline: 16, cursor: 'pointer', fontFamily: FONT,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(theme.text.secondary, 0.16); }}
              onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(theme.text.secondary, 0.09); }}
            >
              {t.perplexityClose}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PerplexityModal;
