---
name: react-general
description: General React and React Native engineering rules for Ledger Live. Read when writing or reviewing any .ts/.tsx file.
---

# General React & React Native Patterns

_These rules apply to all files, including those inside `src/mvvm/`. See [`mvvm-architecture`](../mvvm-architecture/SKILL.md) for MVVM-specific structure._

## Component Architecture

- Prefer functional components.
- Keep components focused and reasonably sized.
- Decompose large UI into smaller reusable elements.
- Use composition for extensibility.

## State Management

- Prioritize local state for UI-only concerns.
- Use RTK Query (with slices) only when necessary for app-wide state. See [`rtk-query-api`](../rtk-query-api/SKILL.md).
- Apply optimized selectors to limit re-rendering.
- Connect Redux at the lowest component level when possible.

## Styling

- **Mobile**: use Lumen UI React Native — see [`ldls-native`](../ldls-native/SKILL.md).
- **Desktop**: use Lumen UI React — see [`ldls-web`](../ldls-web/SKILL.md).
- All styles must support theme switching (dark/light mode).

## Performance

- Memoize expensive operations with `useMemo`.
- Stabilize callbacks with `useCallback`.
- Wrap costly components in `React.memo`.
- Apply list virtualization where needed.
- Use lazy loading for large screens or modules.

## Navigation

- **Mobile**: use React Navigation; ensure correct deep-link support; keep navigation types strict.
- **Desktop**: use React Router; implement route guards when necessary; maintain clear history logic.

## Data Fetching

- Use RTK Query. See [`rtk-query-api`](../rtk-query-api/SKILL.md).
- Use consistent loading, retry, and error states.
- Prefer optimistic UI when appropriate.
- Apply caching and stale-time strategies.

## Accessibility

- **Mobile**: provide accessible labels for all interactive elements; support screen reader flows; ensure proper focus transitions.
- **Desktop**: use semantic HTML tags; implement full keyboard navigation; apply meaningful ARIA attributes when required.

## Error Boundaries

- Wrap critical areas in error boundaries.
- Report errors to monitoring services.
- Provide clean, user-friendly fallback UIs.

## Platform-Specific Code

- **React Native**: use `Platform.select` for small platform variations; ensure behavior parity across iOS and Android.
- **Desktop**: use environment flags for Electron/Web differences; keep platform abstraction consistent.

## Animations

- **Mobile**: use the native driver whenever feasible; prefer `Animated` and layout animations for performance.
- **Desktop**: use CSS transitions for lightweight animations; use Framer Motion for complex animations; respect reduced-motion system preferences.

## Internationalization (i18n)

- Use `react-i18next` consistently.
- Keep translation keys descriptive and structured.
- Support pluralization, gender, and variable interpolation.
- Validate components across multiple locales.
