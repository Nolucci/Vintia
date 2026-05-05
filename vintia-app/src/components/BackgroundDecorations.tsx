import React from 'react';
import { theme, hexAlpha } from '../theme';

const DotGrid: React.FC<{
  rows: number; cols: number; dotSize: number; padding: number;
  color: string; alpha: number;
  style?: React.CSSProperties;
}> = ({ rows, cols, dotSize, padding, color, alpha, style }) => (
  <div style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display: 'flex', gap: padding }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} style={{
            width: dotSize, height: dotSize, borderRadius: '50%',
            background: hexAlpha(color, alpha),
            marginBottom: padding,
          }} />
        ))}
      </div>
    ))}
  </div>
);

const BackgroundDecorations: React.FC = () => (
  <>
    {/* Arc top-right outer */}
    <div style={{
      position: 'absolute', top: -60, right: -60,
      width: 200, height: 200, borderRadius: '50%',
      border: `1.5px solid ${hexAlpha(theme.accent.gold, 0.12)}`,
      pointerEvents: 'none',
    }} />

    {/* Arc top-right inner */}
    <div style={{
      position: 'absolute', top: -30, right: -30,
      width: 120, height: 120, borderRadius: '50%',
      background: hexAlpha(theme.accent.gold, 0.06),
      pointerEvents: 'none',
    }} />

    {/* Arc bottom-left */}
    <div style={{
      position: 'absolute', bottom: -50, left: -50,
      width: 180, height: 180, borderRadius: '50%',
      border: `1.5px solid ${hexAlpha(theme.accent.blue, 0.10)}`,
      pointerEvents: 'none',
    }} />

    {/* Dot grid top-left */}
    <DotGrid
      rows={4} cols={3} dotSize={3} padding={4}
      color={theme.accent.gold} alpha={0.18}
      style={{ top: '8%', left: 20 }}
    />

    {/* Dot grid bottom-right */}
    <DotGrid
      rows={3} cols={4} dotSize={3} padding={4}
      color={theme.accent.blue} alpha={0.20}
      style={{ bottom: '18%', right: 20 }}
    />
  </>
);

export default BackgroundDecorations;
