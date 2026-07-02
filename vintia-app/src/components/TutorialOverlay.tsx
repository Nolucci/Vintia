import React from 'react';
import { Joyride, type Step, type EventData, STATUS } from 'react-joyride';
import { useTutorial } from '../contexts/TutorialContext';
import { useLang } from '../contexts/LanguageContext';
import { theme } from '../theme';

interface TutorialOverlayProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const h4: React.CSSProperties = { margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#1A2332' };
const p: React.CSSProperties = { margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.55 };
const tag: React.CSSProperties = {
  display: 'inline-block', padding: '1px 7px', borderRadius: 5,
  fontSize: 11, fontWeight: 700, marginRight: 4, marginBottom: 3,
};

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, onSkip }) => {
  const { isTutorialActive, setIsTutorialActive, markTutorialSeen, cleanupMocks } = useTutorial();
  const { t } = useLang();

  const handleCallback = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      cleanupMocks();
      markTutorialSeen();
      setIsTutorialActive(false);
      if (status === STATUS.FINISHED) onComplete?.();
      else onSkip?.();
    }
  };

  const iconBadge = (icon: string) => (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px',
      boxShadow: `0 4px 16px ${theme.accent.gold}40`,
    }}>
      <span className="material-symbols-rounded" style={{ fontSize: 30, color: theme.accent.buttonText }}>{icon}</span>
    </div>
  );

  const steps: Step[] = [
    // ── 0. Intro ──────────────────────────────────────────────────────────────
    {
      target: 'body',
      skipBeacon: true,
      placement: 'center',
      content: (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          {iconBadge('auto_awesome')}
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1A2332' }}>
            {t.tutorialWelcomeTitle}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            {t.tutorialWelcomeBody}
          </p>
        </div>
      ),
    },

    // ── 1. Vue globale ────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-all-items"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialAllTitle}</h4>
          <p style={p}>{t.tutorialAllBody}</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 2. Ajouter une plateforme ─────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-add-platform"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialAddPlatTitle}</h4>
          <p style={p}>{t.tutorialAddPlatBody}</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 3. Reco IA ────────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-refresh-reco"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialRecoTitle}</h4>
          <p style={p}>{t.tutorialRecoBody}</p>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 4. Stats bar ──────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-stats-bar"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialStatsTitle}</h4>
          <p style={p}>{t.tutorialStatsBody}</p>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div><span style={{ ...tag, background: '#F3F4F6', color: '#374151' }}>{t.tutorialStatsArticles}</span><span style={p}>{t.tutorialStatsArticlesDesc}</span></div>
            <div><span style={{ ...tag, background: '#FEE2E2', color: '#DC2626' }}>{t.tutorialStatsAchats}</span><span style={p}>{t.tutorialStatsAchatsDesc}</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>{t.tutorialStatsVentes}</span><span style={p}>{t.tutorialStatsVentesDesc}</span></div>
            <div><span style={{ ...tag, background: '#FEF9C3', color: '#B45309' }}>{t.tutorialStatsAttente}</span><span style={p}>{t.tutorialStatsAttenteDesc}</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>{t.tutorialStatsCA}</span><span style={p}>{t.tutorialStatsCADesc}</span></div>
            <div><span style={{ ...tag, background: '#F3F4F6', color: '#374151' }}>{t.tutorialStatsTotalAchats}</span><span style={p}>{t.tutorialStatsTotalAchatsDesc}</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>{t.tutorialStatsMarge}</span><span style={p}>{t.tutorialStatsMargeDesc}</span></div>
          </div>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 5. Ajouter une ligne (vue d'ensemble de la ligne) ───────────────────────
    {
      target: '[data-testid="tutorial-item-row"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialAddRowTitle}</h4>
          <p style={p}>{t.tutorialAddRowBody}</p>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div><span style={{ ...tag, background: '#F3F4F6', color: '#374151' }}>{t.tutorialAddRowTitleField}</span><span style={p}>{t.tutorialAddRowTitleFieldDesc}</span></div>
            <div><span style={{ ...tag, background: '#DBEAFE', color: '#1D4ED8' }}>{t.tutorialAddRowPlatform}</span><span style={p}>{t.tutorialAddRowPlatformDesc}</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>{t.tutorialAddRowPrices}</span><span style={p}>{t.tutorialAddRowPricesDesc}</span></div>
          </div>
        </div>
      ),
      placement: 'bottom',
      spotlightPadding: 4,
    },

    // ── 6. Colonnes prix ──────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-col-prices"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialPricesTitle}</h4>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div><span style={{ ...tag, background: '#FEE2E2', color: '#DC2626' }}>{t.tutorialPricesAchat}</span><span style={p}>{t.tutorialPricesAchatDesc}</span></div>
            <div><span style={{ ...tag, background: '#FEF9C3', color: '#B45309' }}>{t.tutorialPricesPropo}</span><span style={p}>{t.tutorialPricesPropoDesc}</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>{t.tutorialPricesVente}</span><span style={p}>{t.tutorialPricesVenteDesc}</span></div>
          </div>
          <p style={{ ...p, marginTop: 8 }}>{t.tutorialPricesNote}</p>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 6. Ajouter un article ─────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-add-item"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialAddItemTitle}</h4>
          <p style={p}>{t.tutorialAddItemBody}</p>
          <p style={{ ...p, marginTop: 6 }}>{t.tutorialAddItemNote}</p>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 7. Colonne IA (sur la ligne mock) ─────────────────────────────────────
    {
      target: '[data-testid="tutorial-col-ia"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialIAColTitle}</h4>
          <p style={p}>{t.tutorialIAColBody}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 8. Analyse Perplexity ─────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-perplexity"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialAnalyzeTitle}</h4>
          <p style={p}>{t.tutorialAnalyzeBody}</p>
          <p style={{ ...p, marginTop: 6 }}>{t.tutorialAnalyzeNote}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 9. Rapport IA ─────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-report"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialReportTitle}</h4>
          <p style={p}>{t.tutorialReportBody}</p>
          <p style={{ ...p, marginTop: 6 }}>{t.tutorialReportNote}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 10. Comparaison ───────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-compare"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialCompareTitle}</h4>
          <p style={p}>{t.tutorialCompareBody}</p>
          <p style={{ ...p, marginTop: 6 }}>{t.tutorialCompareNote}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 11. Modifier ──────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-edit"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialEditTitle}</h4>
          <p style={p}>{t.tutorialEditBody}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 12. Supprimer ─────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-delete"]',
      targetWaitTimeout: 3000,
      content: (
        <div>
          <h4 style={h4}>{t.tutorialDeleteTitle}</h4>
          <p style={p}>{t.tutorialDeleteBody}</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 13. Paramètres ────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-settings"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialSettingsTitle}</h4>
          <p style={p}>{t.tutorialSettingsBody}</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 14. Déconnexion ───────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-logout"]',
      content: (
        <div>
          <h4 style={h4}>{t.tutorialLogoutTitle}</h4>
          <p style={p}>{t.tutorialLogoutBody}</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 15. Fin ───────────────────────────────────────────────────────────────
    {
      target: 'body',
      placement: 'center',
      content: (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          {iconBadge('check_circle')}
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1A2332' }}>
            {t.tutorialEndTitle}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            {t.tutorialEndBody}
          </p>
        </div>
      ),
    },
  ];

  return (
    <Joyride
      key={isTutorialActive ? 'running' : 'idle'}
      run={isTutorialActive}
      steps={steps}
      continuous
      locale={t.tutorialLocale}
      options={{
        primaryColor: theme.accent.gold,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        textColor: '#1A2332',
        buttons: ['back', 'skip', 'primary'],
        loaderDelay: 0,
      }}
      floatingOptions={{
        flipOptions: { fallbackPlacements: ['top', 'bottom', 'left', 'right'] },
        shiftOptions: { padding: 12 },
      }}
      styles={{
        tooltip: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backgroundColor: '#FFFFFF',
          maxWidth: 320,
          width: 'max-content',
        },
        buttonPrimary: {
          backgroundColor: theme.accent.gold,
          color: theme.accent.buttonText,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 8,
          fontSize: 13,
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: 12,
        },
      }}
      onEvent={handleCallback}
    />
  );
};

export default TutorialOverlay;
