import React from 'react';
import { theme, hexAlpha } from '../theme';
import { useTutorial } from '../contexts/TutorialContext';
import { useLang } from '../contexts/LanguageContext';
import Tooltip from './ItemTable/Tooltip';

const HelpButton: React.FC = () => {
  const { startTutorial, isFirstVisit } = useTutorial();
  const { t } = useLang();
  const handleStart = () => startTutorial(t);

  return (
    <Tooltip text={isFirstVisit ? t.startTutorial : t.reviewTutorial}>
      <button
        onClick={handleStart}
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          background: isFirstVisit
            ? `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`
            : hexAlpha(theme.accent.gold, 0.10),
          border: isFirstVisit ? 'none' : `1.5px solid ${hexAlpha(theme.accent.gold, 0.25)}`,
          transition: 'all 0.15s',
          boxShadow: isFirstVisit
            ? `0 4px 12px ${hexAlpha(theme.accent.gold, 0.30)}`
            : 'none',
        }}
        onMouseEnter={e => {
          if (!isFirstVisit) {
            e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.20);
          }
        }}
        onMouseLeave={e => {
          if (!isFirstVisit) {
            e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.10);
          }
        }}
      >
        <span className="material-symbols-rounded" style={{
          fontSize: 20,
          color: isFirstVisit ? theme.accent.buttonText : theme.accent.gold,
        }}>
          help_outline
        </span>
      </button>
    </Tooltip>
  );
};

export default HelpButton;
