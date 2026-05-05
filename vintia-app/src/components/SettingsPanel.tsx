import React, { useState } from 'react';
import type { UserProfile, AISettings, AIProvider, AIFallbackKey } from '../types';
import { theme, hexAlpha } from '../theme';
import Tooltip from './ItemTable/Tooltip';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, borderRadius: 9, padding: '0 12px',
  border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.28)}`,
  fontSize: 13, color: theme.text.primary, outline: 'none',
  boxSizing: 'border-box', background: hexAlpha('#FFFFFF', 0.8),
  transition: 'border-color 0.15s',
};

const Label: React.FC<{ children: React.ReactNode; tooltip?: string }> = ({ children, tooltip }) => {
  const el = (
    <span style={{
      fontSize: 11, fontWeight: 700, color: theme.text.secondary,
      letterSpacing: 0.4, display: 'block', marginBottom: 5,
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
  return tooltip ? <Tooltip text={tooltip}>{el}</Tooltip> : el;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{
    background: hexAlpha('#FFFFFF', 0.65),
    borderRadius: 14, border: `1px solid ${hexAlpha(theme.accent.gold, 0.14)}`,
    padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
  }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: theme.text.primary }}>{title}</span>
    {children}
  </div>
);

interface ProviderMeta {
  value: AIProvider;
  label: string;
  color: string;
  icon: string;         // material symbol
  defaultModel: string;
  modelOptions: { value: string; label: string }[];
  keyPlaceholder: string;
  keyHint: string;
  hasWebSearch: boolean;
}

const PROVIDERS: ProviderMeta[] = [
  {
    value: 'gemini',
    label: 'Gemini',
    color: '#1A73E8',
    icon: 'neurology',
    defaultModel: 'gemini-2.5-flash',
    modelOptions: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-flash-lite-preview-06-17', label: 'Gemini 2.5 Flash Lite' },
    ],
    keyPlaceholder: 'AIza...',
    keyHint: 'aistudio.google.com',
    hasWebSearch: true,
  },
  {
    value: 'anthropic',
    label: 'Claude',
    color: '#C96442',
    icon: 'auto_awesome',
    defaultModel: 'claude-sonnet-4-6',
    modelOptions: [
      { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'console.anthropic.com',
    hasWebSearch: false,
  },
  {
    value: 'openai',
    label: 'ChatGPT',
    color: '#10A37F',
    icon: 'forum',
    defaultModel: 'gpt-4o',
    modelOptions: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4o-search-preview', label: 'GPT-4o Search' },
      { value: 'o3', label: 'o3' },
    ],
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.openai.com',
    hasWebSearch: true,
  },
  {
    value: 'perplexity',
    label: 'Perplexity',
    color: '#0E74F4',
    icon: 'travel_explore',
    defaultModel: 'sonar-pro',
    modelOptions: [
      { value: 'sonar-pro', label: 'Sonar Pro' },
      { value: 'sonar', label: 'Sonar' },
      { value: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
    ],
    keyPlaceholder: 'pplx-...',
    keyHint: 'perplexity.ai/settings/api',
    hasWebSearch: true,
  },
  {
    value: 'mistral',
    label: 'Mistral',
    color: '#FF7000',
    icon: 'air',
    defaultModel: 'mistral-large-latest',
    modelOptions: [
      { value: 'mistral-large-latest', label: 'Mistral Large' },
      { value: 'mistral-small-latest', label: 'Mistral Small' },
      { value: 'codestral-latest', label: 'Codestral' },
    ],
    keyPlaceholder: '...',
    keyHint: 'console.mistral.ai',
    hasWebSearch: false,
  },
  {
    value: 'grok',
    label: 'Grok',
    color: '#1DA1F2',
    icon: 'blur_on',
    defaultModel: 'grok-3',
    modelOptions: [
      { value: 'grok-3', label: 'Grok 3' },
      { value: 'grok-3-mini', label: 'Grok 3 Mini' },
    ],
    keyPlaceholder: 'xai-...',
    keyHint: 'console.x.ai',
    hasWebSearch: false,
  },
  {
    value: 'autre',
    label: 'Autre',
    color: '#8A9BA8',
    icon: 'settings_ethernet',
    defaultModel: '',
    modelOptions: [],
    keyPlaceholder: 'votre-clé...',
    keyHint: 'Compatible API OpenAI',
    hasWebSearch: false,
  },
];

interface SettingsPanelProps {
  user: UserProfile;
  aiSettings: AISettings;
  onSaveUser: (u: UserProfile) => void;
  onSaveAI: (s: AISettings) => void;
  onBack: () => void;
  onDeleteAccount: () => Promise<void>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, aiSettings, onSaveUser, onSaveAI, onBack, onDeleteAccount }) => {
  const [form, setForm] = useState<UserProfile>({ ...user });
  const [aiForm, setAiForm] = useState<AISettings>({ ...aiSettings });
  const [saved, setSaved] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setUser = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const setAi = <K extends keyof AISettings>(k: K, v: AISettings[K]) =>
    setAiForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    onSaveUser({ ...form, avatarInitials: initials });
    onSaveAI(aiForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentMeta = PROVIDERS.find(p => p.value === aiForm.provider) ?? PROVIDERS[0];

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'SUPPRIMER') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Une erreur est survenue.');
      setDeleting(false);
    }
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingInline: 40, paddingTop: 24, paddingBottom: 24,
      gap: 16, overflowY: 'auto',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Tooltip text="Retourner au tableau des articles">
          <button
            onClick={onBack}
            style={{
              height: 34, width: 34, borderRadius: 9, border: 'none',
              background: hexAlpha(theme.accent.gold, 0.10), cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.20); }}
            onMouseLeave={e => { e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.10); }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: theme.accent.gold }}>arrow_back</span>
          </button>
        </Tooltip>
        <span style={{ fontSize: 18, fontWeight: 700, color: theme.text.primary }}>Paramètres</span>
      </div>

      {/* Profil */}
      <Section title="Profil">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2.5px solid ${hexAlpha(theme.accent.gold, 0.35)}`,
            overflow: 'hidden',
          }}>
            {form.avatarUrl
              ? <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22, fontWeight: 800, color: theme.accent.buttonText }}>
                  {form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </span>
            }
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
            <div>
              <Label>Nom complet</Label>
              <input style={inputStyle} value={form.name} onChange={e => setUser('name', e.target.value)}
                placeholder="Prénom Nom"
                onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label tooltip="URL d'une image en ligne pour votre photo">Photo de profil (URL)</Label>
              <input style={inputStyle} value={form.avatarUrl ?? ''} onChange={e => setUser('avatarUrl', e.target.value || undefined)}
                placeholder="https://exemple.com/photo.jpg"
                onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }} />
            </div>
          </div>
        </div>
      </Section>

      {/* IA & Recherche web */}
      <Section title="IA & Recherche web">
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
          borderRadius: 9, background: hexAlpha(theme.accent.gold, 0.05),
          border: `1px solid ${hexAlpha(theme.accent.gold, 0.18)}`,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 15, color: theme.accent.gold, marginTop: 1 }}>info</span>
          <span style={{ fontSize: 12, color: theme.text.secondary, lineHeight: 1.6 }}>
            Choisissez votre IA préférée pour analyser vos articles et rechercher les prix du marché.
            La clé API est stockée uniquement sur cet appareil.
          </span>
        </div>

        {/* Sélecteur de provider — grille de boutons */}
        <div>
          <Label>Fournisseur d'IA</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PROVIDERS.map(p => {
              const active = aiForm.provider === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setAiForm(prev => ({
                    ...prev,
                    provider: p.value,
                    model: p.defaultModel,
                  }))}
                  style={{
                    height: 56, borderRadius: 11,
                    border: active
                      ? `2px solid ${p.color}`
                      : `1.5px solid ${hexAlpha('#000', 0.08)}`,
                    background: active ? hexAlpha(p.color, 0.08) : hexAlpha('#FFFFFF', 0.7),
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3,
                    transition: 'all 0.12s',
                    boxShadow: active ? `0 0 0 3px ${hexAlpha(p.color, 0.15)}` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = hexAlpha(p.color, 0.05); }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = hexAlpha('#FFFFFF', 0.7); }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: active ? p.color : hexAlpha(theme.text.secondary, 0.6) }}>
                    {p.icon}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? p.color : theme.text.secondary }}>
                    {p.label}
                  </span>
                  {p.hasWebSearch && (
                    <span style={{ fontSize: 9, color: active ? p.color : hexAlpha(theme.text.secondary, 0.5), fontWeight: 600, letterSpacing: 0.3 }}>
                      WEB
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modèle */}
        <div>
          <Label tooltip={`Modèle ${currentMeta.label} à utiliser`}>Modèle</Label>
          {currentMeta.modelOptions.length > 0 ? (
            <select
              value={aiForm.model}
              onChange={e => setAi('model', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => { e.currentTarget.style.borderColor = currentMeta.color; }}
              onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
            >
              {currentMeta.modelOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              style={inputStyle}
              value={aiForm.model}
              onChange={e => setAi('model', e.target.value)}
              placeholder="nom-du-modèle"
              onFocus={e => { e.currentTarget.style.borderColor = currentMeta.color; }}
              onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
            />
          )}
        </div>

        {/* Clé API */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <Label tooltip={`Clé API ${currentMeta.label} — disponible sur ${currentMeta.keyHint}`}>
              Clé API {currentMeta.label}
            </Label>
            <span style={{ fontSize: 10, color: hexAlpha(theme.text.secondary, 0.55), fontStyle: 'italic' }}>
              {currentMeta.keyHint}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={keyVisible ? 'text' : 'password'}
              style={{
                ...inputStyle, paddingRight: 44,
                borderColor: aiForm.apiKey ? hexAlpha(currentMeta.color, 0.45) : hexAlpha(theme.accent.gold, 0.28),
              }}
              value={aiForm.apiKey}
              onChange={e => setAi('apiKey', e.target.value)}
              placeholder={currentMeta.keyPlaceholder}
              onFocus={e => { e.currentTarget.style.borderColor = currentMeta.color; }}
              onBlur={e => {
                e.currentTarget.style.borderColor = aiForm.apiKey
                  ? hexAlpha(currentMeta.color, 0.45)
                  : hexAlpha(theme.accent.gold, 0.28);
              }}
            />
            <button
              type="button"
              onClick={() => setKeyVisible(v => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: hexAlpha(theme.text.secondary, 0.5) }}>
                {keyVisible ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {aiForm.apiKey ? (
            <span style={{ fontSize: 11, color: currentMeta.color, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>check_circle</span>
              Clé {currentMeta.label} configurée
              {currentMeta.hasWebSearch && (
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 700,
                  background: hexAlpha(currentMeta.color, 0.12),
                  color: currentMeta.color, borderRadius: 4, padding: '1px 5px',
                }}>
                  Recherche web activée
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: hexAlpha(theme.text.secondary, 0.55), marginTop: 5, display: 'block' }}>
              Aucune clé — les analyses ne fonctionneront pas
            </span>
          )}
        </div>
      </Section>

      {/* IA Fallback */}
      <Section title="IA de secours (fallback)">
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
          borderRadius: 9, background: hexAlpha('#0E74F4', 0.04),
          border: `1px solid ${hexAlpha('#0E74F4', 0.16)}`,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#0E74F4', marginTop: 1 }}>swap_horiz</span>
          <span style={{ fontSize: 12, color: theme.text.secondary, lineHeight: 1.6 }}>
            Si l'IA principale ne peut pas accéder au site, Vintia essaie automatiquement ces IA de secours (dans l'ordre). Maximum 2 fallbacks.
          </span>
        </div>

        {[0, 1].map(idx => {
          const fb: AIFallbackKey = aiForm.fallbackKeys?.[idx] ?? { provider: 'openai', apiKey: '', model: 'gpt-4o-search-preview' };
          const fbMeta = PROVIDERS.find(p => p.value === fb.provider) ?? PROVIDERS[0];
          const hasKey = !!fb.apiKey;

          const setFb = (patch: Partial<AIFallbackKey>) => {
            setAiForm(prev => {
              const keys = [...(prev.fallbackKeys ?? [{ provider: 'openai', apiKey: '', model: 'gpt-4o-search-preview' }, { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' }])];
              keys[idx] = { ...keys[idx], ...patch };
              return { ...prev, fallbackKeys: keys as AIFallbackKey[] };
            });
          };

          return (
            <div key={idx} style={{
              border: `1px solid ${hasKey ? hexAlpha(fbMeta.color, 0.25) : hexAlpha('#1A2332', 0.10)}`,
              borderRadius: 12, padding: '12px 14px',
              background: hasKey ? hexAlpha(fbMeta.color, 0.03) : hexAlpha('#FFFFFF', 0.5),
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: hexAlpha('#1A2332', 0.08),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: theme.text.secondary,
                }}>{idx + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text.secondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Fallback {idx + 1}
                </span>
                {hasKey && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: fbMeta.color,
                    background: hexAlpha(fbMeta.color, 0.10), borderRadius: 4, padding: '1px 6px',
                  }}>{fbMeta.label} configuré</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Provider */}
                <div>
                  <Label>Fournisseur</Label>
                  <select
                    value={fb.provider}
                    onChange={e => setFb({ provider: e.target.value as AIProvider, model: PROVIDERS.find(p => p.value === e.target.value)?.defaultModel ?? '' })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {PROVIDERS.filter(p => p.value !== 'autre').map(p => (
                      <option key={p.value} value={p.value}>{p.label}{p.hasWebSearch ? ' (Web)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Modèle */}
                <div>
                  <Label>Modèle</Label>
                  {fbMeta.modelOptions.length > 0 ? (
                    <select
                      value={fb.model}
                      onChange={e => setFb({ model: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {fbMeta.modelOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input style={inputStyle} value={fb.model} onChange={e => setFb({ model: e.target.value })} placeholder="modèle" />
                  )}
                </div>
              </div>

              {/* Clé API */}
              <div>
                <Label tooltip={`Clé API ${fbMeta.label} — ${fbMeta.keyHint}`}>Clé API {fbMeta.label}</Label>
                <input
                  type="password"
                  style={{
                    ...inputStyle,
                    borderColor: hasKey ? hexAlpha(fbMeta.color, 0.40) : hexAlpha(theme.accent.gold, 0.28),
                  }}
                  value={fb.apiKey}
                  onChange={e => setFb({ apiKey: e.target.value })}
                  placeholder={fb.apiKey ? '••••••••' : fbMeta.keyPlaceholder}
                  onFocus={e => { e.currentTarget.style.borderColor = fbMeta.color; }}
                  onBlur={e => { e.currentTarget.style.borderColor = hasKey ? hexAlpha(fbMeta.color, 0.40) : hexAlpha(theme.accent.gold, 0.28); }}
                />
              </div>
            </div>
          );
        })}
      </Section>

      {/* Compte */}
      <Section title="Compte">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary }}>Supprimer mon compte</span>
            <p style={{ fontSize: 12, color: theme.text.secondary, margin: '3px 0 0' }}>
              Supprime définitivement votre compte et toutes vos données.
            </p>
          </div>
          <button
            onClick={() => { setShowDeleteConfirm(true); setDeleteInput(''); setDeleteError(null); }}
            style={{
              height: 36, borderRadius: 9, border: '1.5px solid #EF4444',
              background: hexAlpha('#EF4444', 0.06), color: '#EF4444',
              fontSize: 13, fontWeight: 700, paddingInline: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.14); }}
            onMouseLeave={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.06); }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete_forever</span>
            Supprimer
          </button>
        </div>
      </Section>

      {/* Modale confirmation suppression */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: hexAlpha('#0A1628', 0.55),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div style={{
            background: '#FFFFFF', borderRadius: 16, padding: 28, width: 380,
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: hexAlpha('#EF4444', 0.10),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#EF4444' }}>warning</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#1A2332' }}>Supprimer mon compte</span>
            </div>

            <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données (articles, plateformes, paramètres) seront définitivement supprimées.
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                Tapez <strong style={{ color: '#EF4444' }}>SUPPRIMER</strong> pour confirmer
              </label>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="SUPPRIMER"
                style={{
                  ...inputStyle, borderColor: deleteInput === 'SUPPRIMER' ? '#EF4444' : hexAlpha('#000', 0.15),
                  color: '#1A2332',
                }}
                autoFocus
              />
            </div>

            {deleteError && (
              <span style={{ fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>error</span>
                {deleteError}
              </span>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  height: 38, borderRadius: 9, border: `1.5px solid ${hexAlpha('#000', 0.12)}`,
                  background: 'transparent', color: '#4B5563',
                  fontSize: 13, fontWeight: 600, paddingInline: 18, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'SUPPRIMER' || deleting}
                style={{
                  height: 38, borderRadius: 9, border: 'none',
                  background: deleteInput === 'SUPPRIMER' && !deleting ? '#EF4444' : hexAlpha('#EF4444', 0.35),
                  color: '#FFFFFF', fontSize: 13, fontWeight: 700, paddingInline: 18,
                  cursor: deleteInput === 'SUPPRIMER' && !deleting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {deleting
                  ? <><span className="material-symbols-rounded" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}>progress_activity</span> Suppression...</>
                  : <><span className="material-symbols-rounded" style={{ fontSize: 15 }}>delete_forever</span> Supprimer définitivement</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sauvegarder */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={handleSave}
          style={{
            height: 42, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: saved
              ? hexAlpha('#22C55E', 0.85)
              : `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
            color: saved ? '#fff' : theme.accent.buttonText,
            fontSize: 14, fontWeight: 700, paddingInline: 28,
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: `0 4px 14px ${hexAlpha(saved ? '#22C55E' : theme.accent.gold, 0.28)}`,
            transition: 'background 0.3s',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 17 }}>
            {saved ? 'check_circle' : 'save'}
          </span>
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
