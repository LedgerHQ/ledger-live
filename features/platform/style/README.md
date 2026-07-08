# @features/platform-style

Single source of truth for the React theme provider across Ledger Live apps, following the DDD `features/platform` architecture.

## What it provides

- `StyleProvider` — wraps children with the appropriate theme context (styled-components + optional Lumen)
- `useTheme` — reads the current theme from context (re-exported from styled-components)
- `withStyleProvider` — HOC that re-injects the theme into isolated React roots

## Platform variants

The package uses the standard React Native file extension convention:

| File | Used by |
|---|---|
| `StyleProvider.tsx` | Web (desktop, web-tools) |
| `StyleProvider.native.tsx` | Mobile (React Native) |
| `useTheme.ts` | Web |
| `useTheme.native.ts` | Mobile |
| `withStyleProvider.tsx` | Web |
| `withStyleProvider.native.tsx` | Mobile |

## Boundary

This package does **not** import from `@ledgerhq/react-ui` or `@ledgerhq/native-ui` (monorepo workspace libs). Apps provide the pre-merged `theme` object as a prop. The Lumen design system packages (`@ledgerhq/lumen-ui-react`, `@ledgerhq/lumen-ui-rnative`, `@ledgerhq/lumen-design-core`) are external catalog packages and are imported directly.

## Usage

### Web — desktop (styled-components)

```tsx
import { StyleProvider } from "@features/platform-style";
// theme merging stays in app (requires @ledgerhq/react-ui)
<StyleProvider theme={mergedTheme}>
  <GlobalStyle />
  {children}
</StyleProvider>
```

### Web — web-tools (Lumen only, no styled-components)

```tsx
import { StyleProvider } from "@features/platform-style";
<StyleProvider colorScheme="system">{children}</StyleProvider>
```

### Native — mobile (styled-components + Lumen)

```tsx
import { StyleProvider } from "@features/platform-style";
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
