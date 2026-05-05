# Vintia

Application de gestion de ventes multi-plateformes avec analyse IA intégrée.

## Fonctionnalités

- **Suivi des ventes** : Gestion des articles avec statuts (en attente, vendu, acheté, perdu) sur plusieurs plateformes (Vinted, Shein, Teemu, etc.)
- **Tableau de bord** : Vue 3 colonnes avec filtrage, tri et comparaison de prix en temps réel
- **IA intégrée** : Recommandations quotidiennes et analyse des prix via plusieurs fournisseurs (Gemini, Anthropic, OpenAI, Perplexity, Mistral)
- **Authentification** : Inscription / connexion via Supabase Auth
- **Multi-appareils** : Interface responsive desktop et mobile

## Stack technique

| Couche          | Technologie                    |
| --------------- | ------------------------------ |
| Framework       | React 19 + TypeScript          |
| Build           | Vite 8                         |
| Base de données | Supabase (PostgreSQL + RLS)    |
| Edge Functions  | Deno (Supabase Functions)      |
| Déploiement     | Vercel                         |

## Installation

### Prérequis

- Node.js 20+
- Un projet Supabase (créez-en un sur [supabase.com](https://supabase.com))

### Étapes

1. Cloner le dépôt :

   ```bash
   git clone <url-du-repo>
   cd Vintia
   ```

2. Installer les dépendances :

   ```bash
   cd vintia-app
   npm install
   ```

3. Configurer les variables d'environnement :

   ```bash
   cp .env.example .env.local
   ```

   Remplir `.env.local` avec vos clés Supabase (Settings → API dans votre dashboard) :

   ```env
   VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
   VITE_SUPABASE_ANON_KEY=<votre-clé-anon>
   ```

4. Appliquer le schéma de base de données :

   Dans l'éditeur SQL de Supabase, exécuter le contenu de `supabase_schema.sql`.

5. Lancer en développement :

   ```bash
   npm run dev
   ```

## Scripts disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run preview  # Prévisualisation du build
npm run lint     # Vérification ESLint
```

## Structure du projet

```text
Vintia/
├── vintia-app/          # Application React (frontend)
│   └── src/
│       ├── screens/     # Pages principales
│       ├── components/  # Composants réutilisables
│       ├── services/    # Intégrations API (Supabase, IA)
│       ├── hooks/       # Hooks React personnalisés
│       ├── types/       # Types TypeScript
│       └── utils/       # Utilitaires
├── supabase/
│   └── functions/       # Edge functions Deno
├── supabase_schema.sql  # Schéma PostgreSQL
├── .env.example         # Template de configuration
└── vercel.json          # Configuration déploiement
```

## Variables d'environnement

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `VITE_SUPABASE_URL`     | URL de votre projet Supabase       |
| `VITE_SUPABASE_ANON_KEY`| Clé anonyme publique Supabase      |

> Ne jamais committer `.env.local` ni aucun fichier contenant des clés réelles.

## Déploiement

Le projet est configuré pour Vercel avec des règles de réécriture SPA. Connecter le dépôt à Vercel et définir les variables d'environnement dans le dashboard Vercel.
