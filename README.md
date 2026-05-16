# 🚜 Baby Silent Ticket Bot (Premium Edition)

Le bot de support ultime pour la communauté **FS25 Modding**. Une solution auto-hébergée, robuste et ultra-complète pour gérer vos tickets avec un style professionnel et humain.

## ✨ Fonctionnalités de Pointe

### 🎫 Système de Tickets Avancé
- **6 Catégories Personnalisées** : Bug Report, Feature Request, Support Général, Collaboration, Mod Testing, Rapport Staff.
- **Auto-Revendication** : Le premier membre du staff qui répond au ticket en devient automatiquement le responsable.
- **Système de Tags** : Étiquetez vos tickets (`Urgent`, `En cours`, `Bug`) pour une organisation optimale.
- **Conseils Contextuels** : Messages de bienvenue personnalisés selon la catégorie (ex: rappel de joindre les logs pour les bugs).
- **Réouverture Intelligente** : Possibilité de réouvrir un ticket fermé (`/reopen`) si le salon n'a pas encore été supprimé.
- **Confirmation de Suppression** : Sécurité renforcée avec une confirmation par bouton avant de supprimer définitivement un ticket.

### 📜 Archivage & Transcripts
- **Auto-Archive Premium** : À la fermeture, un transcript HTML stylé (style Discord Dark) est généré et envoyé automatiquement :
  - Dans le salon de logs pour l'administration.
  - En DM à l'utilisateur pour son propre historique.
- **Support complet des Médias** : Les images et fichiers envoyés sont visibles et téléchargeables directement depuis les transcripts HTML.

### 🛡️ Outils Staff & Modération
- **Dashboard Live (`/modpanel`)** : Vue d'ensemble sur les tickets ouverts, non assignés et les statistiques du jour.
- **Relais DM Bidirectionnel** : Les rapports staff peuvent être gérés entièrement par DM, le staff répondant depuis un salon serveur dédié.
- **Réponses Rapides (`/canned`)** : Utilisez des modèles de réponses avec des variables dynamiques :
  - `{user}` : Mentionne l'auteur du ticket.
  - `{staff}` : Mentionne le modérateur.
  - `{serveur}` : Affiche le nom du serveur.
- **Notes Internes** : Ajoutez des notes invisibles pour l'utilisateur, archivées et consultables dans les infos du ticket.

### 📊 Statistiques & Leaderboard
- **Analyse de Performance** : Suivi du **temps de réponse moyen** du staff pour optimiser la qualité du support.
- **Classement Staff** : Suivez les performances de votre équipe avec un leaderboard des tickets pris en charge.
- **Stats Globales** : Visualisez l'activité totale du support (tickets ouverts, fermés, total historique).
- **Système de Feedback** : Les utilisateurs peuvent noter la qualité du support (1 à 5 étoiles) à la fermeture.

## 🚀 Installation Rapide

### 1. Dépendances
```bash
npm install
```

### 2. Configuration (`.env`)
Copiez `.env.example` vers `.env` et configurez vos IDs :
- `DISCORD_TOKEN` : Token de votre bot.
- `GUILD_ID` : ID de votre serveur.
- `MOD_ROLE_ID` : ID du rôle Staff.
- `ADMIN_ROLE_ID` : ID du rôle Admin.
- `LOG_CHANNEL_ID` : Salon pour les archives et logs.

### 3. Lancement
```bash
npm run deploy  
npm run dev     
```

## 🏗️ Architecture du Projet
- `src/utils/serviceTickets.js` : Logique métier (ouverture, fermeture, réouverture).
- `src/utils/journal.js` : Système de logs avancé.
- `src/handlers/interactionHandler.js` : Gestionnaire central des boutons et modales.
- `src/utils/base_de_donnees.js` : Stockage SQLite robuste.

---
Développé avec ❤️ pour la communauté **FS25 Modding**.
