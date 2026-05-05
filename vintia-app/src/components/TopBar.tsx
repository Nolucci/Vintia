import React from 'react';
import { theme, hexAlpha } from '../theme';
import HelpButton from './HelpButton';

const TopBar: React.FC = () => {
  return (
    <div className="top-bar" style={{
      height: 56, flexShrink: 0,
      background: hexAlpha('#FFFFFF', 0.6),
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${hexAlpha(theme.accent.gold, 0.10)}`,
      display: 'flex', alignItems: 'center',
      position: 'relative', zIndex: 10,
    }}>
      <div className="top-bar-logo" data-testid="tutorial-logo" style={{ width: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src="/logo.png" alt="Vintia" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'contain' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="top-bar-title" data-testid="tutorial-title" style={{ fontSize: 20, fontWeight: 700, color: theme.text.primary, letterSpacing: 0.5 }}>
          Vos Ventes
        </span>
      </div>

      <div className="top-bar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HelpButton />
      </div>
    </div>
  );
};

export default TopBar;
