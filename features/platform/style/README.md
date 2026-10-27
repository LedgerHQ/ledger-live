# @features/platform-style

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Single source of truth for the React theme provider across Ledger Live apps, following the `features/platform` architecture.

## Entries

| Entry | Exports | Imported from |
|---|---|---|
| `@features/platform-style/web` | `StyleProvider`, `StyleProviderProps` (web shape) | Web code only: desktop, web-tools, `.web` files |
| `@features/platform-style/native` | `StyleProvider`, `StyleProviderProps` (native shape) | Native code only: mobile, `.native` files |
| `@features/platform-style` | `useTheme`, `useThemeVariant`, `resolveThemeVariant`, `withStyleProvider` | Both platforms |
| `@features/platform-style/hooks` | `useTheme`, `useThemeVariant`, `resolveThemeVariant` | Both platforms |

`StyleProvider` is a platform component (see [the universal components ADR](../../../docs/adr/universal-components.md)): the web one takes a `styled-components` theme and an optional Lumen color scheme, the native one a `styled-components/native` theme, a palette and a Lumen RN locale. Each app augments a different `DefaultTheme`, so the two props types cannot share a contract, and each platform imports its own entry.

- `StyleProvider` wraps children with the theme contexts (styled-components, plus Lumen when configured).
- `useTheme` reads the current theme from context (re-exported from styled-components).
- `useThemeVariant` reads `light` or `dark` from the mounted theme, `light` without a provider.
- `withStyleProvider` is a HOC that re-injects the theme into isolated React roots.

## Platform variants

Imports carry no platform suffix: the bundlers, the TypeScript projects and the jest projects resolve `./X` to `X.web` or `X.native`.

| File | Used by |
|---|---|
| `StyleProvider.web.tsx` | Web (desktop, web-tools) |
| `StyleProvider.native.tsx` | Mobile (React Native) |
| `useTheme.web.ts` | Web |
| `useTheme.native.ts` | Mobile |
| `useThemeVariant.web.ts` | Web |
| `useThemeVariant.native.ts` | Mobile |
| `withStyleProvider.web.tsx` | Web |
| `withStyleProvider.native.tsx` | Mobile |

`jest.config.js` runs two projects, `web` for `*.web.test.ts(x)` and `native` for `*.native.test.ts(x)`, each resolving its own platform files.

## Boundary

This package does **not** import from `@ledgerhq/react-ui` or `@ledgerhq/native-ui` (monorepo workspace libs). Apps provide the pre-merged `theme` object as a prop. The Lumen design system packages (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`, `@ledgerhq/lumen-design-core`) are external catalog packages and are imported directly.

## Usage

### Web: desktop (styled-components)

```tsx
import { StyleProvider } from "@features/platform-style/web";
// theme merging stays in app (requires @ledgerhq/react-ui)
<StyleProvider theme={mergedTheme}>
  <GlobalStyle />
  {children}
</StyleProvider>
```

### Web: web-tools (Lumen color scheme only, no SC theme prop)

```tsx
import { StyleProvider } from "@features/platform-style/web";
<StyleProvider colorScheme="system">{children}</StyleProvider>
```

### Native: mobile (styled-components + Lumen)

```tsx
import { StyleProvider } from "@features/platform-style/native";
// theme merging stays in app (requires @ledgerhq/native-ui)
// locale derived from Redux in the app
<StyleProvider theme={mergedTheme} selectedPalette={selectedPalette} locale={locale}>
  {children}
</StyleProvider>
```

### Isolated React roots (desktop)

```tsx
import { withStyleProvider } from "@features/platform-style";
export const MyWrapped = withStyleProvider(MyComponent);
```
