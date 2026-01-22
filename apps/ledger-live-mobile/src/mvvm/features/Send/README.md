# Send Flow - MVVM Architecture (React Native)

Ce dossier contient l'implémentation du flux d'envoi utilisant l'architecture MVVM adaptée pour React Native.

## Architecture générique

### Composants principaux

#### 1. `FlowStackNavigator` (générique)

- **Localisation**: `~/mvvm/features/FlowWizard/FlowStackNavigator.tsx`
- **Responsabilité**: Générateur générique de Stack Navigator basé sur un registry de steps
- **Fonctionnalités**:
  - Mappe automatiquement sur le `stepRegistry` pour générer les `Stack.Screen`
  - Injecte les options de navigation (header, back button, gestures)
  - Gère les paramètres initiaux et listeners
  - Adapte l'architecture FlowWizard de desktop pour React Native

#### 2. `Registry System`

- **Source of truth**: `stepRegistry` dans `index.tsx`
- **Configuration**: `SEND_FLOW_CONFIG` dans `constants.ts`
- **Avantages**:
  - Configuration centralisée des étapes
  - Contrôle conditionnel des écrans (affichage/masquage)
  - Gestion dynamique de la navigation (back button, gestures)

#### 3. `Navigator.tsx` (spécialisé)

- Utilise le `FlowStackNavigator` générique
- Configure les écrans Send spécifiques
- Gère la logique de navigation personnalisée

### Différences avec Desktop

| Aspect          | Desktop           | React Native          |
| --------------- | ----------------- | --------------------- |
| UI Container    | Dialog/Modal      | Stack Navigator       |
| Navigation      | FlowWizard render | React Navigation      |
| Step Components | Render direct     | Stack.Screen          |
| Back/Close      | onClick handlers  | Navigation actions    |
| Gestures        | N/A               | Native gestures (iOS) |

## Configuration des étapes

### Types étendus

```typescript
// types.native.ts
export type ReactNativeFlowStepConfig<TStep> = FlowStepConfig<TStep> & {
  screenName?: string; // Nom d'écran React Navigation
  screenOptions?: NavigationOptions; // Options de navigation
  initialParams?: Record<string, unknown>; // Paramètres initiaux
  listeners?: Record<string, unknown>; // Event listeners
};
```

### Exemple de configuration

```typescript
// constants.ts
export const SEND_STEP_CONFIGS: Record<SendFlowStep, SendStepConfig> = {
  [SEND_FLOW_STEP.RECIPIENT]: {
    id: SEND_FLOW_STEP.RECIPIENT,
    canGoBack: true, // Contrôle du bouton back
    screenName: ScreenName.NewSendRecipient,
    screenOptions: {
      ...TransparentHeaderNavigationOptions,
      headerLeft: () => null, // Pas de bouton back sur premier écran
    },
  },
  // ...autres étapes
};
```

## Avantages de cette architecture

### 1. **Généricité**

- Le `FlowStackNavigator` peut être réutilisé pour tout type de flux
- Configuration déclarative des étapes
- Séparation claire entre logique métier et navigation

### 2. **Flexibilité**

- Contrôle fin des options de navigation par étape
- Gestion conditionnelle des écrans selon les coin modules
- Support natif des gestures et navigation React Native

### 3. **Maintenabilité**

- Source de vérité centralisée (`stepRegistry`)
- Configuration déclarative dans `constants.ts`
- Réduction du code dupliqué

### 4. **Évolutivité**

- Ajout facile de nouvelles étapes
- Modification simple des comportements de navigation
- Support des variations par coin module

## Usage

### Création d'un nouveau flux

1. Définir les étapes dans `types.ts`
2. Créer le registry dans `index.tsx`
3. Configurer les étapes dans `constants.ts`
4. Utiliser `FlowStackNavigator` dans `Navigator.tsx`

### Personnalisation

- `getScreenName()`: Personnaliser les noms d'écrans
- `getScreenOptions()`: Options de navigation dynamiques
- `getInitialParams()`: Paramètres initiaux personnalisés

Cette architecture respecte les principes MVVM tout en s'adaptant aux spécificités de React Native et React Navigation.
