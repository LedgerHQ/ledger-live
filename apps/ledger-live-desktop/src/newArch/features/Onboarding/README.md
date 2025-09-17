# Onboarding Feature (New Architecture)

This feature contains the onboarding screens following the new architecture guidelines.

## Structure

```
Onboarding/
├── README.md
└── screens/
    └── Welcome/
        ├── __tests__/
        │   ├── Welcome.test.tsx
        │   ├── useWelcomeViewModel.test.ts
        │   └── useVideoCarouselViewModel.test.ts
        ├── assets/
        │   ├── buyNanoX.webm
        │   ├── ledgerWalletBuySell.webm
        │   ├── ledgerWalletThousandsCrypto.webm
        │   └── ledgerWalletSecureWallet.webm
        ├── components/
        │   ├── WelcomeNewStyles.ts
        │   └── WelcomeOldStyles.ts
        ├── index.tsx
        ├── useVideoCarouselViewModel.ts
        ├── useWelcomeViewModel.ts
        ├── WelcomeNew.tsx
        └── WelcomeOld.tsx
```

## Architecture Compliance

This implementation follows the new architecture guidelines:

### ✅ Folder Organization
- Feature-based structure under `src/newArch/features/`
- Screens organized under `screens/` directory
- Components shared within the feature are in `components/`
- Tests are colocated with their respective components in `__tests__/`

### ✅ viewModel Pattern
- **`useWelcomeViewModel`**: Handles all business logic, Redux state management, navigation, and external API calls
- **`useVideoCarouselViewModel`**: Handles video carousel specific logic and state management
- Components are pure and receive all data/handlers as props from the viewModel

### ✅ Component Structure
- **`Welcome`**: Main entry point that handles feature flag logic
- **`WelcomeNew`**: New design component (video carousel version)
- **`WelcomeOld`**: Legacy design component
- Both components use their respective viewModels and styled components

### ✅ Imports
- Uses relative imports within the feature
- Uses TypeScript aliases for external dependencies
- Follows the established patterns from other newArch features

### ✅ Index Convention
- Main component exported from `index.tsx`
- Clean import paths from external modules

### ✅ Styled Components
- Styles are separated into dedicated files
- `WelcomeNewStyles.ts` and `WelcomeOldStyles.ts`
- Reusable styled components are exported

### ✅ Testing
- Comprehensive test coverage for all viewModels
- Component integration tests
- Mocked dependencies following established patterns
- Tests use `@testing-library/react` and Jest

## Usage

```tsx
import { Welcome } from "~/newArch/features/Onboarding/screens/Welcome";

// Component automatically handles feature flag logic
<Welcome />
```

## Migration Notes

The original Welcome screen has been migrated to follow the new architecture:

1. **Business Logic Extraction**: All Redux logic, navigation, and side effects moved to viewModel hooks
2. **Component Separation**: UI components are now pure and focused on rendering
3. **Test Coverage**: Added comprehensive tests for all business logic
4. **Style Organization**: Styled components separated into dedicated files
5. **Asset Management**: Video assets copied to the new structure

## Feature Flag

The component respects the `welcomeScreenVideoCarousel` feature flag:
- `enabled: true` → Shows `WelcomeNew` (video carousel version)
- `enabled: false` → Shows `WelcomeOld` (legacy version)

## Key Features

- **Video Carousel**: Rotating background videos with progress indicators
- **Analytics Integration**: Opt-in prompt handling
- **Ledger Sync**: Entry point for wallet synchronization
- **Terms & Privacy**: Links to legal documents
- **Easter Egg**: Hidden feature flags access for development
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
