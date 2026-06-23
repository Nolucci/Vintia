import React, { useRef, useState } from 'react';
import type { Item, Platform, UserProfile } from '../types';
import { theme, hexAlpha } from '../theme';
import Tooltip from './ItemTable/Tooltip';
import { useLang } from '../contexts/LanguageContext';

// ── Entrée "Tout afficher" ────────────────────────────────────────────────
const AllItem: React.FC<{ isSelected: boolean; onClick: () => void }> = ({ isSelected, onClick }) => {
  const { t } = useLang();
  return (
  <Tooltip text={t.allItemsTooltip} placement="bottom">
    <div
      data-testid="tutorial-all-items"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'pointer', position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
        width: 3, height: isSelected ? 28 : 0, borderRadius: 2,
        background: theme.accent.gold,
        transition: 'height 0.18s ease',
      }} className="side-indicator" />

      <div className="side-icon" style={{
        width: 44, height: 44, borderRadius: 13,
        background: isSelected
          ? `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`
          : hexAlpha(theme.accent.gold, 0.08),
        border: `2px solid ${isSelected ? theme.accent.gold : hexAlpha(theme.accent.gold, 0.20)}`,
        boxShadow: isSelected
          ? `0 4px 16px ${hexAlpha(theme.accent.gold, 0.40)}`
          : `0 2px 6px ${hexAlpha(theme.accent.gold, 0.08)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s ease',
      }}>
        <span className="material-symbols-rounded" style={{
          fontSize: 20,
          color: isSelected ? theme.accent.buttonText : theme.accent.gold,
        }}>
          apps
        </span>
      </div>
      <span className="side-label" style={{
        fontSize: 9, fontWeight: isSelected ? 800 : 600,
        color: isSelected ? theme.accent.gold : '#000000',
        letterSpacing: 0.3, marginTop: 3, textAlign: 'center',
      }}>
        {t.allItems}
      </span>
    </div>
  </Tooltip>
  );
};

// ── Entrée plateforme (draggable) ─────────────────────────────────────────
const PlatformItem: React.FC<{
  platform: Platform;
  isSelected: boolean;
  isDragOver: boolean;
  itemCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}> = ({ platform, isSelected, isDragOver, itemCount, onClick, onEdit, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }) => {
  const color = platform.accentColor;
  const [gearHover, setGearHover] = useState(false);
  const [gearSpin, setGearSpin] = useState(false);
  const { t } = useLang();

  const handleGearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGearSpin(true);
    setTimeout(() => setGearSpin(false), 600);
    onEdit();
  };

  return (
    <Tooltip text={t.platformTooltip(platform.label, platform.url ?? '', itemCount)}>
      <div
        draggable
        onClick={onClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          cursor: 'grab', position: 'relative',
          opacity: isDragOver ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <div style={{
          position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: isSelected ? 28 : 0, borderRadius: 2,
          background: color,
          transition: 'height 0.18s ease',
        }} className="side-indicator" />

        <div className="side-icon" style={{
          width: 44, height: 44, borderRadius: 13,
          background: isSelected ? hexAlpha(color, 0.18) : hexAlpha(color, 0.07),
          border: `2px solid ${isSelected ? color : hexAlpha(color, 0.18)}`,
          boxShadow: isSelected
            ? `0 4px 16px ${hexAlpha(color, 0.35)}`
            : `0 2px 6px ${hexAlpha(color, 0.08)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease', position: 'relative',
        }}>
          <span className="material-symbols-rounded" style={{
            fontSize: 22,
            color: isSelected ? color : hexAlpha(color, 0.85),
          }}>
            {platform.icon}
          </span>
          <div style={{
            position: 'absolute', bottom: 3, right: 3,
            width: 8, height: 8, borderRadius: '50%',
            background: platform.connected ? '#22C55E' : '#8A9BA8',
            border: '1.5px solid #fff',
          }} />
        </div>

        <span className="side-label" style={{
          fontSize: 9, fontWeight: isSelected ? 800 : 600,
          color: isSelected ? color : '#000000',
          letterSpacing: 0.3, marginTop: 3, textAlign: 'center',
          maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.18s',
        }}>
          {platform.label}
        </span>

        {/* Roue crantée — visible uniquement si sélectionnée */}
        {isSelected && (
          <Tooltip text={`${t.platformEditTitle} — ${platform.label}`} placement="bottom">
            <div
              onClick={handleGearClick}
              onMouseEnter={() => setGearHover(true)}
              onMouseLeave={() => setGearHover(false)}
              style={{
                marginTop: 4,
                width: 22, height: 22, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: gearHover ? hexAlpha(color, 0.15) : hexAlpha(color, 0.07),
                border: `1px solid ${gearHover ? hexAlpha(color, 0.40) : hexAlpha(color, 0.15)}`,
                transition: 'all 0.15s',
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: 13,
                  color: gearHover ? color : hexAlpha(color, 0.60),
                  display: 'block',
                  transition: 'color 0.15s, transform 0.6s ease',
                  transform: gearSpin ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                settings
              </span>
            </div>
          </Tooltip>
        )}
      </div>
    </Tooltip>
  );
};

// ── SideNav ───────────────────────────────────────────────────────────────
interface SideNavProps {
  platforms: Platform[];
  items: Item[];
  selectedPlatformId: string | null;
  user: UserProfile;
  onSelectPlatform: (id: string) => void;
  onAddPlatform: () => void;
  onOpenSettings: () => void;
  onEditPlatform: (p: Platform) => void;
  onLogout: () => void;
  onReorderPlatforms: (ordered: Platform[]) => void;
}

const SideNav: React.FC<SideNavProps> = ({
  platforms, items, selectedPlatformId, user,
  onSelectPlatform, onAddPlatform, onOpenSettings, onEditPlatform, onLogout, onReorderPlatforms,
}) => {
  const dragSrcId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const { t } = useLang();

  const handleAll = () => {
    if (selectedPlatformId !== null) onSelectPlatform(selectedPlatformId);
  };

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragSrcId.current) setDragOverId(id);
  };

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) { setDragOverId(null); return; }

    const list = [...platforms];
    const srcIdx = list.findIndex(p => p.id === srcId);
    const tgtIdx = list.findIndex(p => p.id === targetId);
    const [moved] = list.splice(srcIdx, 1);
    list.splice(tgtIdx, 0, moved);
    setDragOverId(null);
    onReorderPlatforms(list);
  };

  const handleDragEnd = () => {
    dragSrcId.current = null;
    setDragOverId(null);
  };

  return (
    <div
      className="side-nav"
      style={{
        width: 72, flexShrink: 0,
        background: hexAlpha('#FFFFFF', 0.50),
        borderRight: `1px solid ${hexAlpha(theme.accent.gold, 0.28)}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 12, paddingBottom: 12,
      }}
    >
      {/* Liste plateformes */}
      <div
        className="side-nav-platforms"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          overflowY: 'auto', width: '100%', paddingInline: 14,
        }}
      >
        <AllItem isSelected={selectedPlatformId === null} onClick={handleAll} />

        {platforms.length > 0 && (
          <div style={{ width: 28, height: 1, background: hexAlpha(theme.accent.gold, 0.40), marginBlock: 2 }} />
        )}

        {platforms.map(p => (
          <PlatformItem
            key={p.id}
            platform={p}
            isSelected={selectedPlatformId === p.id}
            isDragOver={dragOverId === p.id}
            itemCount={items.filter(i => i.platformId === p.id).length}
            onClick={() => onSelectPlatform(p.id)}
            onEdit={() => onEditPlatform(p)}
            onDragStart={handleDragStart(p.id)}
            onDragOver={handleDragOver(p.id)}
            onDragLeave={() => setDragOverId(null)}
            onDrop={handleDrop(p.id)}
            onDragEnd={handleDragEnd}
          />
        ))}

        <Tooltip text={t.addPlatformTooltip}>
          <div
            data-testid="tutorial-add-platform"
            onClick={onAddPlatform}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <div
              className="side-icon"
              style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'transparent',
                border: `1.5px dashed ${hexAlpha(theme.accent.gold, 0.35)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = hexAlpha(theme.accent.gold, 0.07))}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: hexAlpha(theme.accent.gold, 0.6) }}>add</span>
            </div>
            <span className="side-label" style={{ fontSize: 9, fontWeight: 600, color: 'transparent', marginTop: 3 }}>+</span>
          </div>
        </Tooltip>
      </div>

      {/* Séparateur bas */}
      <div className="side-sep" style={{ width: 36, height: 1, background: hexAlpha(theme.accent.gold, 0.14), margin: '10px 0' }} />

      {/* Crédits Vintia */}
      <Tooltip text={
        <div style={{ textAlign: 'center' }}>
          <img
            src="/qr-code.png"
            alt="QR Code"
            style={{ width: 80, height: 80, borderRadius: 6, display: 'block', marginBottom: 6 }}
          />
          <span style={{ fontSize: 10, color: '#8A9BA8' }}>nandbots.com</span>
        </div>
      } placement="bottom">
        <a
          href="https://nandbots.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', marginBottom: 4, opacity: 0.75,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
        >
          <img
            src="/logo_or_texte_1.png"
            alt="Vintia"
            style={{ width: 40, height: 28, borderRadius: 4, objectFit: 'contain' }}
          />
        </a>
      </Tooltip>

      {/* Bas */}
      <div className="side-nav-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Tooltip text={t.logout}>
          <div
            data-testid="tutorial-logout"
            onClick={onLogout}
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'transparent', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexAlpha('#EF4444', 0.10); }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#EF4444' }}>logout</span>
          </div>
        </Tooltip>

        <Tooltip text={`${user.name} — ${t.settingsTitle}`}>
          <div data-testid="tutorial-settings" onClick={onOpenSettings} style={{ cursor: 'pointer' }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl} alt={user.name}
                style={{
                  width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${hexAlpha(theme.accent.gold, 0.40)}`,
                  boxShadow: `0 2px 8px ${hexAlpha(theme.accent.gold, 0.22)}`,
                  display: 'block', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.borderColor = theme.accent.gold; }}
                onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.borderColor = hexAlpha(theme.accent.gold, 0.40); }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.accent.gold}, ${theme.accent.goldLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${hexAlpha(theme.accent.gold, 0.28)}`,
                border: `2px solid ${hexAlpha(theme.accent.gold, 0.35)}`,
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${hexAlpha(theme.accent.gold, 0.50)}`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 8px ${hexAlpha(theme.accent.gold, 0.28)}`; }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: theme.accent.buttonText }}>
                  {user.avatarInitials}
                </span>
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default SideNav;
