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

## Rules of Hooks

- Never call hooks conditionally — all hooks must be called in the same order on every render.
- Never call hooks inside loops, conditions, or nested functions.
- Never invoke side effects (state updates, callbacks) during render — use `useEffect` instead.
- Never update state during the render phase — this triggers "Cannot update a component while rendering" warnings.

## State Management

- Prioritize local state for UI-only concerns.
- Use RTK Query (with slices) only when necessary for app-wide state. See [`rtk-query-api`](../rtk-query-api/SKILL.md).
- Apply optimized selectors to limit re-rendering.
- Connect Redux at the lowest component level when possible.
- Never reset state by calling `setState` during render — use an effect keyed by the reset trigger instead.

## Styling

- **Mobile**: use Lumen UI React Native — see [`ldls-native`](../ldls-native/SKILL.md).
- **Desktop**: use Lumen UI React — see [`ldls-web`](../ldls-web/SKILL.md).
- All styles must support theme switching (dark/light mode).

## Performance

- Memoize expensive operations with `useMemo`.
- Stabilize callbacks with `useCallback` — especially callbacks passed to child components or used in effect dependencies.
- Never create inline functions passed to callbacks in render — wrap with `useCallback`.
- Wrap costly components in `React.memo`.
- Apply list virtualization where needed.
- Use lazy loading for large screens or modules.
- Never create inline arrays for constant membership checks — hoist to module scope.

## Navigation

- **Mobile**: use React Navigation; prefer `useNavigation` and `useRoute` hooks over prop drilling `navigation` and `route`.
- **Desktop**: use React Router; implement route guards when necessary; maintain clear history logic.

## Data Fetching

- Use RTK Query. See [`rtk-query-api`](../rtk-query-api/SKILL.md).
- Use consistent loading, retry, and error states.
- Prefer optimistic UI when appropriate.
- Apply caching and stale-time strategies.
- Add `skip` or `enabled` parameters to hooks to control when queries run based on UI state.

## Accessibility

- **Mobile**: provide accessible labels for all interactive elements; support screen reader flows; ensure proper focus transitions.
- **Desktop**: use semantic HTML tags; implement full keyboard navigation; apply meaningful ARIA attributes when required.
- Never render two separate interactive controls for the same action — consolidate into one accessible control.

## Error Boundaries

- Wrap critical areas in error boundaries.
- Report errors to monitoring services.
- Provide clean, user-friendly fallback UIs.

## Platform-Specific Code

- **React Native**: use `Platform.select` for small platform variations; ensure behavior parity across iOS and Android.
- **Desktop**: use environment flags for Electron/Web differences; keep platform abstraction consistent.

## Animations

- **Mobile**: use the native driver whenever feasible; prefer `Animated` and layout animations for performance.
- Store animated values in refs to avoid stale closure issues in effects.
- **Desktop**: use CSS transitions for lightweight animations; use Framer Motion for complex animations; respect reduced-motion system preferences.

## Internationalization (i18n)

- Use `react-i18next` consistently.
- Keep translation keys descriptive and structured.
- Support pluralization, gender, and variable interpolation.
- Validate components across multiple locales.
- Name i18n key props clearly (e.g., `labelKey` or `translationKey`) — never name them `label` if they hold a key rather than user-facing text.
