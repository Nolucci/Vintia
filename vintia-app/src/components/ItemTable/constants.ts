import type { ItemType, Transaction } from '../../types';

export const TRANSACTION_META: Record<Transaction, { symbol: string; color: string; label: string; tooltip: string }> = {
  achat: {
    symbol: '−',
    color: '#EF4444',
    label: 'Achat',
    tooltip: 'Achat — vous avez dépensé de l\'argent pour acquérir cet article',
  },
  vente: {
    symbol: '+',
    color: '#22C55E',
    label: 'Vente',
    tooltip: 'Vente — vous avez vendu ou vous mettez en vente cet article',
  },
  attente: {
    symbol: '?',
    color: '#F59E0B',
    label: 'En attente',
    tooltip: 'En attente — vous étudiez cet article avant de décider de l\'acheter ou non',
  },
  perdu: {
    symbol: '✕',
    color: '#8A9BA8',
    label: 'Perdu',
    tooltip: 'Perdu — cet article en attente a été vendu à quelqu\'un d\'autre',
  },
};

// Cycle de transition entre statuts au clic
export const TRANSACTION_CYCLE: Transaction[] = ['vente', 'achat', 'attente', 'perdu'];

export const TYPE_META: Record<ItemType, { color: string; label: string; icon: string; tooltip: string }> = {
  vetement:     { color: '#D79A2A', label: 'Vêtement',     icon: 'checkroom',     tooltip: 'Vêtement — habits, manteaux, pulls...' },
  chaussures:   { color: '#C084FC', label: 'Chaussures',   icon: 'steps',         tooltip: 'Chaussures — baskets, bottes, sandales...' },
  accessoires:  { color: '#F472B6', label: 'Accessoires',  icon: 'watch',         tooltip: 'Accessoires — sacs, ceintures, bijoux...' },
  electronique: { color: '#818CF8', label: 'Électronique', icon: 'devices',       tooltip: 'Électronique — audio, photo, télévision...' },
  informatique: { color: '#60A5FA', label: 'Informatique', icon: 'computer',      tooltip: 'Informatique — ordinateurs, périphériques...' },
  maison:       { color: '#F97316', label: 'Maison',       icon: 'home',          tooltip: 'Maison — mobilier, cuisine, rangement...' },
  decoration:   { color: '#FB923C', label: 'Décoration',   icon: 'format_paint',  tooltip: 'Décoration — cadres, vases, plantes...' },
  sport:        { color: '#2A9D8F', label: 'Sport',        icon: 'sports_soccer', tooltip: 'Sport — équipements, vêtements sportifs...' },
  loisirs:      { color: '#34D399', label: 'Loisirs',      icon: 'casino',        tooltip: 'Loisirs — jeux, instruments, collections...' },
  livres:       { color: '#A78BFA', label: 'Livres',       icon: 'menu_book',     tooltip: 'Livres — romans, BD, manuels, magazines...' },
  jouets:       { color: '#FCA5A5', label: 'Jouets',       icon: 'toys',          tooltip: 'Jouets — enfants, figurines, jeux de société...' },
  cosmetique:   { color: '#F9A8D4', label: 'Cosmétique',   icon: 'spa',           tooltip: 'Cosmétique — parfums, soins, maquillage...' },
  alimentation: { color: '#86EFAC', label: 'Alimentation', icon: 'restaurant',    tooltip: 'Alimentation — produits alimentaires, boissons...' },
  business:     { color: '#0EA5E9', label: 'Business',     icon: 'trending_up',   tooltip: 'Business — articles suivis pour la performance commerciale' },
  autre:        { color: '#94A3B8', label: 'Autre',        icon: 'category',      tooltip: 'Autre — catégorie non listée' },
};

// Largeurs fixes minimales — s'adaptent au contenu via useColWidths()
export const COL_MIN = {
  transaction:     58,
  type:           148,
  titre:            0,   // flex: 1
  url:             56,   // icône + date courte
  finances:       260,   // 3 sous-colonnes fixes : Achat | Vente | Marge
  compareAvec:     72,
  ia:             260,   // achat + proposition + marge + recommandation
  actions:        156,
};

// Padding interne d'une cellule (gauche + droite)
export const CELL_PAD = 18;

// Estime la largeur en pixels d'un texte (Roboto 14px bold)
export function estimateTextWidth(text: string, fontSizePx = 14, bold = false): number {
  const coeff = bold ? 0.60 : 0.52;
  return Math.ceil(text.length * fontSizePx * coeff) + CELL_PAD * 2;
}
