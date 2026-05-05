import React from 'react';
import { Joyride, type Step, type EventData, STATUS } from 'react-joyride';
import { useTutorial } from '../contexts/TutorialContext';
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
            Bienvenue sur Vintia 🎉
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Je vais vous guider à travers les principales fonctionnalités.
            Deux articles d'exemple ont été ajoutés pour illustrer le tutoriel.
          </p>
        </div>
      ),
    },

    // ── 1. Vue globale ────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-all-items"]',
      content: (
        <div>
          <h4 style={h4}>Vue globale</h4>
          <p style={p}>Cliquez ici pour afficher tous vos articles, quelle que soit la plateforme. C'est votre vue d'ensemble.</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 2. Ajouter une plateforme ─────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-add-platform"]',
      content: (
        <div>
          <h4 style={h4}>Ajouter une plateforme</h4>
          <p style={p}>Connectez Vinted, Leboncoin, eBay ou autres pour synchroniser vos ventes. Vous pouvez les réorganiser par glisser-déposer.</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 3. Reco IA ────────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-refresh-reco"]',
      content: (
        <div>
          <h4 style={h4}>Recommandation IA du jour</h4>
          <p style={p}>
            Votre IA analyse connectée à vos données vous propose chaque jour des conseils personnalisés.
            Cliquez sur "Actualiser" pour régénérer l'analyse.
          </p>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 4. Stats bar ──────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-stats-bar"]',
      content: (
        <div>
          <h4 style={h4}>Vos chiffres en un coup d'œil</h4>
          <p style={p}>Ce bandeau résume votre activité en temps réel :</p>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div><span style={{ ...tag, background: '#F3F4F6', color: '#374151' }}>Articles</span><span style={p}>total actifs</span></div>
            <div><span style={{ ...tag, background: '#FEE2E2', color: '#DC2626' }}>Achats</span><span style={p}>articles achetés (−)</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>Ventes</span><span style={p}>mis en vente (+)</span></div>
            <div><span style={{ ...tag, background: '#FEF9C3', color: '#B45309' }}>En attente</span><span style={p}>en cours d'étude</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>CA</span><span style={p}>chiffre d'affaires réalisé</span></div>
            <div><span style={{ ...tag, background: '#F3F4F6', color: '#374151' }}>Total achats</span><span style={p}>dépenses cumulées</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>Marge</span><span style={p}>CA − Achats</span></div>
          </div>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 5. Colonnes prix ──────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-col-prices"]',
      content: (
        <div>
          <h4 style={h4}>Les trois prix d'un article</h4>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div><span style={{ ...tag, background: '#FEE2E2', color: '#DC2626' }}>Achat</span><span style={p}>prix payé pour acquérir l'objet</span></div>
            <div><span style={{ ...tag, background: '#FEF9C3', color: '#B45309' }}>Proposition</span><span style={p}>prix affiché sur votre annonce</span></div>
            <div><span style={{ ...tag, background: '#DCFCE7', color: '#16A34A' }}>Vente</span><span style={p}>prix réellement encaissé à la vente</span></div>
          </div>
          <p style={{ ...p, marginTop: 8 }}>La marge se calcule automatiquement : Vente − Achat.</p>
        </div>
      ),
      placement: 'bottom',
    },

    // ── 6. Ajouter un article ─────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-add-item"]',
      content: (
        <div>
          <h4 style={h4}>Ajouter un article</h4>
          <p style={p}>
            Cliquez ici pour créer un nouvel article. Une ligne de saisie apparaît directement dans le tableau.
          </p>
          <p style={{ ...p, marginTop: 6 }}>
            Renseignez le titre, le prix d'achat et le prix de proposition.
            Plus la fiche est complète, plus l'analyse IA sera précise.
          </p>
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
          <h4 style={h4}>Colonne IA</h4>
          <p style={p}>
            Affiche le prix cible suggéré par l'IA et une recommandation courte (baisser, maintenir, relancer...).
            Elle se remplit après une analyse sur cet article.
          </p>
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
          <h4 style={h4}>Analyse marché</h4>
          <p style={p}>
            Lance une analyse IA sur cet article : prix moyens constatés sur le marché, niveau de demande, tendances et conseils de prix personnalisés.
          </p>
          <p style={{ ...p, marginTop: 6 }}>Nécessite une clé API configurée dans les Paramètres.</p>
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
          <h4 style={h4}>Rapport IA complet</h4>
          <p style={p}>
            Après une analyse, ce bouton donne accès au rapport détaillé : fourchette de prix, popularité, conseils de mise en valeur et estimation de délai de vente.
          </p>
          <p style={{ ...p, marginTop: 6 }}>
            L'article exemple a déjà un rapport — essayez en cliquant dessus !
          </p>
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
          <h4 style={h4}>Comparer des articles</h4>
          <p style={p}>
            Liez plusieurs articles entre eux pour les comparer côte à côte — utile pour ajuster vos prix quand vous avez des objets similaires sur plusieurs plateformes.
          </p>
          <p style={{ ...p, marginTop: 6 }}>
            Le chiffre indique le nombre d'articles liés. Les deux articles exemples sont déjà liés entre eux.
          </p>
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
          <h4 style={h4}>Modifier un article</h4>
          <p style={p}>Double-cliquez sur n'importe quelle ligne ou utilisez ce bouton pour modifier un article directement dans le tableau.</p>
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
          <h4 style={h4}>Supprimer</h4>
          <p style={p}>Supprimez un article après confirmation. Attention, cette action est irréversible.</p>
        </div>
      ),
      placement: 'left',
    },

    // ── 13. Paramètres ────────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-settings"]',
      content: (
        <div>
          <h4 style={h4}>Paramètres & Profil</h4>
          <p style={p}>Accédez à votre profil, configurez vos clés API IA et gérez vos préférences.</p>
        </div>
      ),
      placement: 'right',
    },

    // ── 14. Déconnexion ───────────────────────────────────────────────────────
    {
      target: '[data-testid="tutorial-logout"]',
      content: (
        <div>
          <h4 style={h4}>Déconnexion</h4>
          <p style={p}>Déconnectez-vous de votre compte. Vos données restent sauvegardées.</p>
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
            Vous êtes prêt ! 🚀
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Les articles d'exemple ont été supprimés. Vous pouvez relancer ce tutoriel à tout moment via le bouton d'aide en haut à droite.
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
      locale={{
        skip: 'Passer',
        next: 'Suivant',
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminer',
      }}
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
