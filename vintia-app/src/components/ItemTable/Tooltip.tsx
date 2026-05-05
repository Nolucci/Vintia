import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { hexAlpha } from '../../theme';

interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, placement = 'top' }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
  const handleMove  = (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
  const handleLeave = () => setPos(null);

  return (
    <>
      <span
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ display: 'contents' }}
      >
        {children}
      </span>
      {pos && createPortal(
        <TooltipBubble text={text} x={pos.x} y={pos.y} placement={placement} />,
        document.body
      )}
    </>
  );
};

interface BubbleProps {
  text: React.ReactNode;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

const CURSOR_OFFSET = 18; // gap entre le curseur et la bulle
const SCREEN_MARGIN = 10; // marge min par rapport aux bords de l'écran
const ARROW_SIZE    = 6;  // demi-largeur de la flèche

const TooltipBubble: React.FC<BubbleProps> = ({ text, x, y, placement }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Après rendu, on connaît la vraie taille — on clamp horizontalement
  // et on vérifie qu'on ne sort pas de l'écran verticalement
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Position horizontale : centré sur le curseur, clampé aux bords
    const rawLeft = x - w / 2;
    const clampedLeft = Math.max(SCREEN_MARGIN, Math.min(rawLeft, vw - w - SCREEN_MARGIN));
    el.style.left = `${clampedLeft}px`;

    // Position verticale : si placement=top et ça sort en haut, basculer en bas
    let top = placement === 'top'
      ? y - h - CURSOR_OFFSET
      : y + CURSOR_OFFSET;

    if (placement === 'top' && top < SCREEN_MARGIN) {
      top = y + CURSOR_OFFSET; // flip to bottom
      el.dataset.flipped = 'bottom';
    } else if (placement === 'bottom' && top + h > vh - SCREEN_MARGIN) {
      top = y - h - CURSOR_OFFSET; // flip to top
      el.dataset.flipped = 'top';
    } else {
      el.dataset.flipped = placement;
    }

    el.style.top = `${top}px`;

    // Repositionner la flèche selon le côté réel et la position horizontale
    const arrow = el.querySelector<HTMLElement>('[data-arrow]');
    if (arrow) {
      const arrowX = x - clampedLeft; // position du curseur relative à la bulle
      const clampedArrowX = Math.max(12, Math.min(arrowX, w - 12));
      arrow.style.left = `${clampedArrowX}px`;
      arrow.style.transform = 'translateX(-50%)';

      const flipped = el.dataset.flipped as 'top' | 'bottom';
      if (flipped === 'top') {
        arrow.style.bottom = `-${ARROW_SIZE}px`;
        arrow.style.top = '';
        arrow.style.clipPath = 'polygon(0 0, 100% 0, 50% 100%)';
      } else {
        arrow.style.top = `-${ARROW_SIZE}px`;
        arrow.style.bottom = '';
        arrow.style.clipPath = 'polygon(50% 0, 0 100%, 100% 100%)';
      }
    }
  });

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        // top et left sont définis dans useLayoutEffect
        top: -9999,
        left: -9999,
        maxWidth: 300,
        background: '#1E2D3D',
        color: '#F0F4FA',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'Roboto', system-ui, sans-serif",
        lineHeight: 1.5,
        padding: '7px 12px',
        borderRadius: 9,
        zIndex: 99999,
        pointerEvents: 'none',
        boxShadow: `0 4px 20px ${hexAlpha('#000', 0.28)}, 0 1px 4px ${hexAlpha('#000', 0.15)}`,
        border: `1px solid ${hexAlpha('#FFFFFF', 0.08)}`,
        animation: 'tooltipFadeIn 0.12s ease-out both',
        wordBreak: 'break-word',
      }}
    >
      {text}
      {/* Flèche — positionnée dynamiquement dans useLayoutEffect */}
      <div
        data-arrow=""
        style={{
          position: 'absolute',
          width: ARROW_SIZE * 2,
          height: ARROW_SIZE,
          background: '#1E2D3D',
          // position initiale, corrigée dans useLayoutEffect
          bottom: -ARROW_SIZE,
          left: '50%',
          transform: 'translateX(-50%)',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}
      />
    </div>
  );
};

export default Tooltip;
