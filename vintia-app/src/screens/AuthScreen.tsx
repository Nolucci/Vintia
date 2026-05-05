import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { theme, hexAlpha } from '../theme';
import BackgroundDecorations from '../components/BackgroundDecorations';

const gradientBg = `linear-gradient(180deg, ${theme.bg.secondary} 0%, ${theme.bg.primary} 50%, ${theme.bg.bottom} 100%)`;

const inputBase: React.CSSProperties = {
  width: '100%', height: 48, borderRadius: 12, padding: '0 16px',
  border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.28)}`,
  background: hexAlpha('#FFFFFF', 0.85),
  fontSize: 14, color: theme.text.primary, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};

// ── Indicateur de force du mot de passe ───────────────────────────────────
const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    { label: '8+ caractères',     ok: password.length >= 8 },
    { label: 'Majuscule',         ok: /[A-Z]/.test(password) },
    { label: 'Chiffre',           ok: /[0-9]/.test(password) },
    { label: 'Caractère spécial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];

  if (!password) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < score ? colors[score - 1] : hexAlpha('#8A9BA8', 0.20),
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : theme.text.secondary, fontWeight: 600 }}>
          {score > 0 ? labels[score - 1] : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {checks.map(c => (
            <span key={c.label} style={{
              fontSize: 10, color: c.ok ? '#16A34A' : hexAlpha(theme.text.secondary, 1),
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 11 }}>
                {c.ok ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="auth-card" style={{
    background: hexAlpha('#FFFFFF', 0.72),
    borderRadius: 24, padding: 36,
    border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.22)}`,
    boxShadow: `0 20px 60px ${hexAlpha('#1A2332', 0.10)}`,
    width: '100%', maxWidth: 440,
    backdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column', gap: 20,
    animation: 'fadeSlideUp 0.35s ease-out both',
    maxHeight: '92vh', overflowY: 'auto',
  }}>
    {children}
  </div>
);

const PasswordInput: React.FC<{
  value: string; onChange: (v: string) => void;
  visible: boolean; onToggle: () => void;
  placeholder?: string;
  onKeyDown?: React.KeyboardEventHandler;
}> = ({ value, onChange, visible, onToggle, placeholder = 'Mot de passe', onKeyDown }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      style={{ ...inputBase, paddingRight: 48 }}
      onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
      onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
    />
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center',
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 18, color: hexAlpha(theme.text.secondary, 1) }}>
        {visible ? 'visibility_off' : 'visibility'}
      </span>
    </button>
  </div>
);

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type View = 'welcome' | 'login' | 'register';

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<View>('welcome');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPw2, setRegPw2] = useState('');
  const [regPwVisible, setRegPwVisible] = useState(false);
  const [regPw2Visible, setRegPw2Visible] = useState(false);
  const [regError, setRegError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPw) return;
    setLoading(true);
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPw,
    });
    setLoading(false);
    if (error) {
      setLoginError('Email ou mot de passe incorrect.');
      return;
    }
    onAuthSuccess();
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regName.trim()) { setRegError('Le nom est requis'); return; }
    if (!regEmail.includes('@')) { setRegError('Adresse e-mail invalide'); return; }
    if (regPw.length < 8) { setRegError('Mot de passe trop court (8 caractères min)'); return; }
    if (regPw !== regPw2) { setRegError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    const initials = regName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim().toLowerCase(),
      password: regPw,
      options: {
        data: {
          name: regName.trim(),
          avatar_initials: initials,
        },
      },
    });
    setLoading(false);
    if (error) {
      setRegError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet e-mail.'
        : error.message);
      return;
    }
    // Si la confirmation email est désactivée dans Supabase, la session est
    // créée immédiatement — onAuthStateChange s'en charge. Sinon on force.
    if (data.session) {
      onAuthSuccess();
    } else {
      setRegError('Vérifie ta boîte mail pour confirmer ton compte.');
    }
  };

  // ── Vue : onboarding ─────────────────────────────────────────────────────
  if (view === 'welcome') {
    const steps = [
      { icon: 'storefront',        title: 'Connectez vos plateformes',  desc: 'Vinted, Leboncoin, eBay… ajoutez vos plateformes de revente.' },
      { icon: 'add_shopping_cart', title: 'Ajoutez vos articles',        desc: 'Enregistrez achats, ventes et articles en attente en quelques secondes.' },
      { icon: 'auto_awesome',      title: 'Laissez l\'IA travailler',    desc: 'Analyse de marché, prix conseillés et recommandation quotidienne générés automatiquement.' },
      { icon: 'savings',           title: 'Optimisez vos marges',        desc: 'Comparez, ajustez vos prix et suivez vos gains en temps réel.' },
    ];
    return (
      <div style={{
        width: '100vw', height: '100vh', background: gradientBg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '24px 16px',
      }}>
        <BackgroundDecorations />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36,
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
          animation: 'fadeSlideUp 0.4s ease-out both',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Vintia" style={{
              width: 96, height: 96, borderRadius: 22, objectFit: 'contain',
              border: `2.5px solid ${hexAlpha(theme.accent.gold, 0.40)}`,
              boxShadow: `0 10px 34px ${hexAlpha(theme.accent.gold, 0.24)}`,
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: theme.text.primary, letterSpacing: 0.5 }}>Vintia</div>
              <div style={{ fontSize: 15, color: theme.text.secondary, marginTop: 4 }}>
                Votre gestionnaire de revente intelligent
              </div>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: hexAlpha('#FFFFFF', 0.72),
                border: `1px solid ${hexAlpha(theme.accent.gold, 0.18)}`,
                borderRadius: 14, padding: '12px 16px',
                boxShadow: `0 2px 8px ${hexAlpha('#1A2332', 0.05)}`,
                animation: `fadeSlideUp 0.4s ${0.08 * i}s ease-out both`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${hexAlpha(theme.accent.gold, 0.18)}, ${hexAlpha(theme.accent.goldLight, 0.12)})`,
                  border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.28)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 22, color: theme.accent.gold }}>{step.icon}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.text.primary, marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: theme.text.secondary, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: hexAlpha(theme.accent.gold, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: theme.accent.gold,
                }}>{i + 1}</div>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setView('register')}
              style={{
                height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
                color: theme.accent.buttonText, fontSize: 16, fontWeight: 800,
                boxShadow: `0 6px 20px ${hexAlpha(theme.accent.gold, 0.35)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'box-shadow 0.15s, transform 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${hexAlpha(theme.accent.gold, 0.48)}`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${hexAlpha(theme.accent.gold, 0.35)}`; e.currentTarget.style.transform = 'none'; }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person_add</span>
              Créer mon compte gratuitement
            </button>
            <button
              onClick={() => setView('login')}
              style={{
                height: 44, borderRadius: 12, cursor: 'pointer',
                background: 'none',
                border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.35)}`,
                color: theme.text.secondary, fontSize: 14, fontWeight: 600,
              }}
            >
              J'ai déjà un compte — Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vue : connexion ──────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: gradientBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '16px',
      }}>
        <BackgroundDecorations />
        <Card>
          <button
            onClick={() => setView('welcome')}
            style={{
              alignSelf: 'flex-start', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              color: theme.text.secondary, fontSize: 13, fontWeight: 600, padding: 0,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
            Retour
          </button>

          <div>
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: theme.text.primary }}>Se connecter</p>
            <p style={{ margin: 0, fontSize: 13, color: theme.text.secondary }}>Accédez à votre espace Vintia</p>
          </div>

          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder="Adresse e-mail"
            style={inputBase}
            onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
            onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
          />

          <PasswordInput
            value={loginPw} onChange={setLoginPw}
            visible={loginPwVisible} onToggle={() => setLoginPwVisible(v => !v)}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
          />

          {loginError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: hexAlpha('#EF4444', 0.08),
              border: `1px solid ${hexAlpha('#EF4444', 0.22)}`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#EF4444' }}>error</span>
              <span style={{ fontSize: 13, color: '#DC2626' }}>{loginError}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !loginEmail || !loginPw}
            style={{
              height: 48, borderRadius: 12, border: 'none',
              background: loading || !loginEmail || !loginPw
                ? hexAlpha(theme.accent.gold, 0.30)
                : `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
              color: theme.accent.buttonText, fontSize: 15, fontWeight: 700,
              cursor: loading || !loginEmail || !loginPw ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 14px ${hexAlpha(theme.accent.gold, 0.28)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading
              ? <span className="material-symbols-rounded" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>progress_activity</span>
              : <span className="material-symbols-rounded" style={{ fontSize: 18 }}>login</span>
            }
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: theme.text.secondary }}>
            Pas encore de compte ?{' '}
            <button
              onClick={() => setView('register')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent.gold, fontWeight: 700, fontSize: 13 }}
            >
              Créer un compte
            </button>
          </p>
        </Card>
      </div>
    );
  }

  // ── Vue : inscription ────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh', background: gradientBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '16px',
    }}>
      <BackgroundDecorations />
      <Card>
        <button
          onClick={() => setView('welcome')}
          style={{
            alignSelf: 'flex-start', background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            color: theme.text.secondary, fontSize: 13, fontWeight: 600, padding: 0,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
          Retour
        </button>

        <div>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: theme.text.primary }}>
            Créer un compte
          </p>
          <p style={{ margin: 0, fontSize: 13, color: theme.text.secondary }}>
            Gérez vos ventes sur toutes vos plateformes
          </p>
        </div>

        <input
          value={regName} onChange={e => setRegName(e.target.value)}
          placeholder="Votre prénom et nom"
          style={inputBase}
          onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
          onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
        />

        <input
          type="email"
          value={regEmail} onChange={e => setRegEmail(e.target.value)}
          placeholder="Adresse e-mail"
          style={inputBase}
          onFocus={e => { e.currentTarget.style.borderColor = theme.accent.gold; }}
          onBlur={e => { e.currentTarget.style.borderColor = hexAlpha(theme.accent.gold, 0.28); }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PasswordInput
            value={regPw} onChange={setRegPw}
            visible={regPwVisible} onToggle={() => setRegPwVisible(v => !v)}
            placeholder="Mot de passe"
          />
          <PasswordStrength password={regPw} />
        </div>

        <PasswordInput
          value={regPw2} onChange={setRegPw2}
          visible={regPw2Visible} onToggle={() => setRegPw2Visible(v => !v)}
          placeholder="Confirmer le mot de passe"
          onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
        />

        {regError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: hexAlpha('#EF4444', 0.08),
            border: `1px solid ${hexAlpha('#EF4444', 0.22)}`,
            borderRadius: 8, padding: '8px 12px',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#EF4444' }}>error</span>
            <span style={{ fontSize: 13, color: '#DC2626' }}>{regError}</span>
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            height: 48, borderRadius: 12, border: 'none',
            background: loading
              ? hexAlpha(theme.accent.gold, 0.30)
              : `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
            color: theme.accent.buttonText, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 14px ${hexAlpha(theme.accent.gold, 0.28)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <span className="material-symbols-rounded" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>progress_activity</span>
            : <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
          }
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: theme.text.secondary }}>
          Déjà un compte ?{' '}
          <button
            onClick={() => setView('login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent.gold, fontWeight: 700, fontSize: 13 }}
          >
            Se connecter
          </button>
        </p>
      </Card>
    </div>
  );
};

export default AuthScreen;
