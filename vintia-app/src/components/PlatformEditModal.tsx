import React, { useState } from 'react';
import type { Platform } from '../types';
import { theme, hexAlpha } from '../theme';
import { useLang } from '../contexts/LanguageContext';

const ICON_OPTIONS = [
  'store', 'storefront', 'checkroom', 'shopping_bag', 'sell', 'local_shipping',
  'inventory_2', 'deployed_code', 'style', 'diamond', 'favorite', 'star',
  'bolt', 'category', 'label', 'attach_money', 'card_giftcard', 'redeem',
  'recycling', 'eco', 'auto_awesome', 'palette', 'brush', 'camera_alt',
  'devices', 'headphones', 'sports_esports', 'sports', 'fitness_center',
  'menu_book', 'toys', 'child_care', 'home', 'chair', 'kitchen',
];

interface PlatformEditModalProps {
  platform: Platform;
  onClose: () => void;
  onSave: (p: Platform) => void;
  onDelete: (id: string) => void;
}

const PlatformEditModal: React.FC<PlatformEditModalProps> = ({ platform, onClose, onSave, onDelete }) => {
  const { t } = useLang();
  const [form, setForm] = useState({
    label: platform.label,
    icon: platform.icon,
    accentColor: platform.accentColor,
    url: platform.url ?? '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSave({ ...platform, ...form, url: form.url || undefined });
    onClose();
  };

  const handleDelete = () => {
    onDelete(platform.id);
    onClose();
  };

  const color = form.accentColor;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: hexAlpha('#1A2332', 0.45),
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 460, background: '#FFFFFF', borderRadius: 20,
          boxShadow: `0 24px 60px ${hexAlpha('#1A2332', 0.18)}`,
          padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
          animation: 'fadeSlideUp 0.25s ease-out both',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: hexAlpha(color, 0.12),
              border: `2px solid ${hexAlpha(color, 0.30)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color }}>{form.icon}</span>
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: theme.text.primary }}>
                {t.platformEditTitle}
              </span>
              <p style={{ margin: 0, fontSize: 11, color: theme.text.secondary, marginTop: 1 }}>
                {platform.label}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: hexAlpha(theme.text.secondary, 0.08), cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: theme.text.secondary }}>close</span>
          </button>
        </div>

        {/* Nom */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 6 }}>
            {t.platformEditName}
          </label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder={t.platformEditNamePlaceholder}
            style={{
              width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
              border: `1.5px solid ${hexAlpha(color, 0.35)}`,
              fontSize: 13, color: theme.text.primary, outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = color; }}
            onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(color, 0.35); }}
          />
        </div>

        {/* URL */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 6 }}>
            {t.platformEditUrl}
          </label>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
            style={{
              width: '100%', height: 40, borderRadius: 10, padding: '0 12px',
              border: `1.5px solid ${hexAlpha(color, 0.35)}`,
              fontSize: 13, color: theme.text.primary, outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = color; }}
            onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(color, 0.35); }}
          />
        </div>

        {/* Couleur */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 8 }}>
            {t.platformEditColor}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="color"
              value={form.accentColor}
              onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
              style={{ width: 44, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['#09B1BA','#F97316','#E53E3E','#FF9900','#3B82F6','#8B5CF6','#22C55E','#EC4899','#D79A2A','#2A9D8F'].map(c => (
                <div
                  key={c}
                  onClick={() => setForm(f => ({ ...f, accentColor: c }))}
                  style={{
                    width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer',
                    border: form.accentColor === c ? `2px solid ${theme.text.primary}` : '2px solid transparent',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Icône */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, display: 'block', marginBottom: 8 }}>
            {t.platformEditIcon}
          </label>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6,
            maxHeight: 140, overflowY: 'auto', padding: 4,
          }}>
            {ICON_OPTIONS.map(ic => (
              <div
                key={ic}
                onClick={() => setForm(f => ({ ...f, icon: ic }))}
                title={ic}
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  background: form.icon === ic ? hexAlpha(color, 0.15) : hexAlpha('#8A9BA8', 0.06),
                  border: `1.5px solid ${form.icon === ic ? color : 'transparent'}`,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (form.icon !== ic) e.currentTarget.style.background = hexAlpha(color, 0.07); }}
                onMouseLeave={e => { if (form.icon !== ic) e.currentTarget.style.background = hexAlpha('#8A9BA8', 0.06); }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: form.icon === ic ? color : hexAlpha(theme.text.secondary, 0.7) }}>
                  {ic}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {confirmDelete ? (
            <>
              <span style={{ flex: 1, fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                {t.platformEditConfirmDelete}
              </span>
              <button onClick={() => setConfirmDelete(false)} style={{
                height: 40, paddingInline: 16, borderRadius: 10, border: `1.5px solid ${hexAlpha('#8A9BA8', 0.25)}`,
                background: 'transparent', cursor: 'pointer', fontSize: 13, color: theme.text.secondary, fontWeight: 600,
              }}>
                {t.platformEditCancel}
              </button>
              <button onClick={handleDelete} style={{
                height: 40, paddingInline: 16, borderRadius: 10, border: 'none',
                background: '#EF4444', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700,
              }}>
                {t.platformEditDelete}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} style={{
                height: 40, paddingInline: 14, borderRadius: 10,
                border: `1.5px solid ${hexAlpha('#EF4444', 0.25)}`,
                background: hexAlpha('#EF4444', 0.06), cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#EF4444', fontWeight: 600, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.12); }}
              onMouseLeave={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.06); }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                {t.platformEditDelete}
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={{
                height: 40, paddingInline: 16, borderRadius: 10,
                border: `1.5px solid ${hexAlpha('#8A9BA8', 0.25)}`,
                background: 'transparent', cursor: 'pointer', fontSize: 13, color: theme.text.secondary, fontWeight: 600,
              }}>
                {t.platformEditCancel}
              </button>
              <button onClick={handleSave} style={{
                height: 40, paddingInline: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${color}, ${hexAlpha(color, 0.75)})`,
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: `0 4px 12px ${hexAlpha(color, 0.30)}`,
              }}>
                {t.platformEditSave}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformEditModal;
