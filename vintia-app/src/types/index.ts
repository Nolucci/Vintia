// Statut de la transaction
export type Transaction = 'achat' | 'vente' | 'attente' | 'perdu';

// Type/catégorie de l'objet — palette pastel étendue
export type ItemType =
  | 'vetement'
  | 'chaussures'
  | 'accessoires'
  | 'electronique'
  | 'informatique'
  | 'maison'
  | 'decoration'
  | 'sport'
  | 'loisirs'
  | 'livres'
  | 'jouets'
  | 'cosmetique'
  | 'alimentation'
  | 'business'
  | 'autre';

export interface Item {
  id: string;
  transaction: Transaction;
  type: ItemType;
  titre: string;
  url: string;              // lien vers l'annonce
  description: string;     // description libre — aide l'IA si le site est inaccessible
  prixAchat: number | null;
  prixVente: number | null;
  prixVendu: number | null;
  marge: number | null;     // calculé : prixVendu - prixAchat
  compareAvec: string[];    // ids des items liés
  prixIACible: number | null;
  recommandations: string;
  analyseIA?: string;        // JSON compact du dernier rapport IA (WebSearchResult.structured)
  platformId: string | null;
  dateAjout: string;        // ISO 8601
}

export interface Platform {
  id: string;
  label: string;
  icon: string;
  accentColor: string;
  url?: string;
  connected: boolean;
  sortOrder: number;
}

export interface UserProfile {
  name: string;
  avatarInitials: string;
  avatarUrl?: string;
}


export type AIProvider =
  | 'gemini'
  | 'anthropic'
  | 'openai'
  | 'perplexity'
  | 'mistral'
  | 'grok'
  | 'groq'
  | 'autre';

export interface AIFallbackKey {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  fallbackKeys?: AIFallbackKey[]; // jusqu'à 2 IAs de secours pour le fallback
}

export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;   // SHA-256 hex stocké en localStorage
  avatarInitials: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AppState {
  platforms: Platform[];
  selectedPlatformId: string | null;
  items: Item[];
  isLoading: boolean;
  user: UserProfile;
  currentView: 'table' | 'settings';
}
