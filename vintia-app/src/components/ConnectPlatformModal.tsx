import React, { useState } from 'react';
import type { Platform } from '../types';
import { theme, hexAlpha } from '../theme';
import { useLang } from '../contexts/LanguageContext';

const PRESET_PLATFORMS = [
  { label: 'Vinted',     icon: 'store',         accentColor: '#09B1BA', url: 'https://www.vinted.fr' },
  { label: 'Shein',      icon: 'checkroom',      accentColor: '#2A9D8F', url: 'https://www.shein.com' },
  { label: 'Temu',       icon: 'shopping_bag',   accentColor: '#3B82F6', url: 'https://www.temu.com' },
  { label: 'Leboncoin',  icon: 'sell',            accentColor: '#F97316', url: 'https://www.leboncoin.fr' },
  { label: 'eBay',       icon: 'storefront',      accentColor: '#E53E3E', url: 'https://www.ebay.fr' },
  { label: 'Amazon',     icon: 'local_shipping',  accentColor: '#FF9900', url: 'https://www.amazon.fr' },
];

interface ConnectPlatformModalProps {
  onClose: () => void;
  onAdd: (platform: Omit<Platform, 'id'>) => void;
}

const ConnectPlatformModal: React.FC<ConnectPlatformModalProps> = ({ onClose, onAdd }) => {
  const { t } = useLang();
  const [step, setStep] = useState<'choose' | 'custom'>('choose');
  const [custom, setCustom] = useState({ label: '', icon: 'storefront', accentColor: '#D79A2A', url: '' });

  const handlePreset = (p: typeof PRESET_PLATFORMS[0]) => {
    onAdd({ label: p.label, icon: p.icon, accentColor: p.accentColor, url: p.url, connected: false, sortOrder: 0 });
    onClose();
  };

  const handleCustomSubmit = () => {
    if (!custom.label.trim()) return;
    onAdd({ ...custom, connected: false, sortOrder: 0 });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: hexAlpha('#1A2332', 0.45),
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, background: '#FFFFFF', borderRadius: 20,
          boxShadow: `0 24px 60px ${hexAlpha('#1A2332', 0.18)}`,
          padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
          animation: 'fadeSlideUp 0.3s ease-out both',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: theme.text.primary }}>
              {t.connectTitle}
            </span>
            <p style={{ margin: 0, fontSize: 12, color: theme.text.secondary, marginTop: 2 }}>
              {t.connectSubtitle}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: hexAlpha(theme.text.secondary, 0.08), cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: theme.text.secondary }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['choose', 'custom'] as const).map(tab => (
            <button key={tab} onClick={() => setStep(tab)} style={{
              flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: step === tab ? hexAlpha(theme.accent.gold, 0.12) : hexAlpha('#8A9BA8', 0.06),
              color: step === tab ? theme.accent.gold : theme.text.secondary,
              fontWeight: step === tab ? 700 : 500, fontSize: 13,
              transition: 'all 0.15s',
            }}>
              {tab === 'choose' ? t.connectTabPreset : t.connectTabCustom}
            </button>
          ))}
        </div>

        {step === 'choose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PRESET_PLATFORMS.map(p => (
              <button key={p.label} onClick={() => handlePreset(p)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `1.5px solid ${hexAlpha(p.accentColor, 0.25)}`,
                background: hexAlpha(p.accentColor, 0.05), cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(p.accentColor, 0.12); }}
              onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(p.accentColor, 0.05); }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: hexAlpha(p.accentColor, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: p.accentColor }}>{p.icon}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.text.primary }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: theme.text.secondary }}>{p.url.replace('https://', '')}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 6 }}>
                {t.connectCustomName}
              </label>
              <input
                value={custom.label}
                onChange={e => setCustom(prev => ({ ...prev, label: e.target.value }))}
                placeholder={t.connectCustomNamePlaceholder}
                style={{
                  width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
                  border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                  fontSize: 13, color: theme.text.primary, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 6 }}>
                {t.connectCustomUrl}
              </label>
              <input
                value={custom.url}
                onChange={e => setCustom(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                style={{
                  width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
                  border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.30)}`,
                  fontSize: 13, color: theme.text.primary, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 6 }}>
                {t.connectCustomColor}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={custom.accentColor}
                  onChange={e => setCustom(prev => ({ ...prev, accentColor: e.target.value }))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }}
                />
                <span style={{ fontSize: 12, color: theme.text.secondary }}>{custom.accentColor}</span>
              </div>
            </div>
            <button onClick={handleCustomSubmit} style={{
              height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
              color: theme.accent.buttonText, fontSize: 14, fontWeight: 700,
              boxShadow: `0 4px 12px ${hexAlpha(theme.accent.gold, 0.30)}`,
            }}>
              {t.connectCustomAdd}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectPlatformModal;
