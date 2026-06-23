import type { ItemType, Transaction } from '../../types';
import type { Translations } from '../../contexts/LanguageContext';

export type TransactionMeta = Record<Transaction, { symbol: string; color: string; label: string; tooltip: string }>;
export type TypeMeta = Record<ItemType, { color: string; label: string; icon: string; tooltip: string }>;

export function getTransactionMeta(t: Translations): TransactionMeta {
  return {
    achat: {
      symbol: '−',
      color: '#EF4444',
      label: t.transactionAchat,
      tooltip: t.transactionTooltipAchat,
    },
    vente: {
      symbol: '+',
      color: '#22C55E',
      label: t.transactionVente,
      tooltip: t.transactionTooltipVente,
    },
    attente: {
      symbol: '?',
      color: '#F59E0B',
      label: t.transactionAttente,
      tooltip: t.transactionTooltipAttente,
    },
    perdu: {
      symbol: '✕',
      color: '#8A9BA8',
      label: t.transactionPerdu,
      tooltip: t.transactionTooltipPerdu,
    },
  };
}

// Cycle de transition entre statuts au clic
export const TRANSACTION_CYCLE: Transaction[] = ['vente', 'achat', 'attente', 'perdu'];

export function getTypeMeta(t: Translations): TypeMeta {
  return {
    vetement:     { color: '#D79A2A', label: t.typeVetement,     icon: 'checkroom',     tooltip: t.typeTooltipVetement },
    chaussures:   { color: '#C084FC', label: t.typeChaussures,   icon: 'steps',         tooltip: t.typeTooltipChaussures },
    accessoires:  { color: '#F472B6', label: t.typeAccessoires,  icon: 'watch',         tooltip: t.typeTooltipAccessoires },
    electronique: { color: '#818CF8', label: t.typeElectronique, icon: 'devices',       tooltip: t.typeTooltipElectronique },
    informatique: { color: '#60A5FA', label: t.typeInformatique, icon: 'computer',      tooltip: t.typeTooltipInformatique },
    maison:       { color: '#F97316', label: t.typeMaison,       icon: 'home',          tooltip: t.typeTooltipMaison },
    decoration:   { color: '#FB923C', label: t.typeDecoration,   icon: 'format_paint',  tooltip: t.typeTooltipDecoration },
    sport:        { color: '#2A9D8F', label: t.typeSport,        icon: 'sports_soccer', tooltip: t.typeTooltipSport },
    loisirs:      { color: '#34D399', label: t.typeLoisirs,      icon: 'casino',        tooltip: t.typeTooltipLoisirs },
    livres:       { color: '#A78BFA', label: t.typeLivres,       icon: 'menu_book',     tooltip: t.typeTooltipLivres },
    jouets:       { color: '#FCA5A5', label: t.typeJouets,       icon: 'toys',          tooltip: t.typeTooltipJouets },
    cosmetique:   { color: '#F9A8D4', label: t.typeCosmetique,   icon: 'spa',           tooltip: t.typeTooltipCosmetique },
    alimentation: { color: '#86EFAC', label: t.typeAlimentation, icon: 'restaurant',    tooltip: t.typeTooltipAlimentation },
    business:     { color: '#0EA5E9', label: t.typeBusiness,     icon: 'trending_up',   tooltip: t.typeTooltipBusiness },
    autre:        { color: '#94A3B8', label: t.typeAutre,        icon: 'category',      tooltip: t.typeTooltipAutre },
  };
}

// Static fallback (FR) — kept for backward compat; prefer getTypeMeta(t) in components
export const TYPE_META: TypeMeta = {
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

// Static fallback (FR)
export const TRANSACTION_META: TransactionMeta = {
  achat:   { symbol: '−', color: '#EF4444', label: 'Achat',      tooltip: "Achat — vous avez dépensé de l'argent pour acquérir cet article" },
  vente:   { symbol: '+', color: '#22C55E', label: 'Vente',      tooltip: 'Vente — vous avez vendu ou vous mettez en vente cet article' },
  attente: { symbol: '?', color: '#F59E0B', label: 'En attente', tooltip: "En attente — vous étudiez cet article avant de décider de l'acheter ou non" },
  perdu:   { symbol: '✕', color: '#8A9BA8', label: 'Perdu',      tooltip: "Perdu — cet article en attente a été vendu à quelqu'un d'autre" },
};

// Largeurs fixes minimales — s'adaptent au contenu via useColWidths()
export const COL_MIN = {
  transaction:     58,
  type:           148,
  titre:            0,   // flex: 1
  url:             56,
  finances:       260,
  compareAvec:     72,
  ia:             260,
  actions:        156,
};

// Padding interne d'une cellule (gauche + droite)
export const CELL_PAD = 18;

// Estime la largeur en pixels d'un texte (Roboto 14px bold)
export function estimateTextWidth(text: string, fontSizePx = 14, bold = false): number {
  const coeff = bold ? 0.60 : 0.52;
  return Math.ceil(text.length * fontSizePx * coeff) + CELL_PAD * 2;
}
