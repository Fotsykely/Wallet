frontend/
├── public/
├── src/
│   ├── assets/              # Images, polices, etc.
│   ├── components/          # Composants réutilisables
│   │   ├── charts/          # Composants de graphiques
│   │   ├── cards/           # Cartes de dashboard
│   │   ├── ui/              # Éléments UI de base
│   │   └── layout/          # Layout principal
│   ├── pages/               # Pages de l'application
│   │   ├── Dashboard/       # Page principale
│   │   ├── Transactions/    # Gestion des transactions
│   │   ├── Accounts/        # Gestion des comptes
│   │   └── Settings/        # Paramètres
│   ├── hooks/               # Hooks personnalisés
│   ├── contexts/            # Contextes React
│   ├── services/            # Services API
│   ├── utils/               # Utilitaires
│   ├── styles/              # Styles globaux
│   ├── App.jsx              # Point d'entrée
│   └── index.js             # Rendu React
├── .eslintrc                # Configuration ESLint
├── .prettierrc              # Configuration Prettier
└── package.json