# @shared/platform-linking

> [!CAUTION]
> **Status: UNSTABLE** — New package; API may change as features adopt it.

Cross-platform external link opening with URL safety validation, localization, and optional tracking.

## Problem

Both apps (LLD/LLM) duplicate the same concerns when opening external links:

- URL safety validation (`isUrlSafe`)
- URL localization (`useLocalizedUrl`)
- Analytics tracking (`track("OpenURL", ...)`)
- Platform-specific open call (Electron `shell.openExternal` / RN `Linking.openURL`)

This package abstracts those into a single provider that each app wires once.

## Usage

### App setup (wire once at root)

```tsx
// apps/ledger-live-desktop
import { LinkingProvider } from "@shared/platform-linking";
import { shell } from "electron";
import { track } from "~/renderer/analytics/segment";

<LinkingProvider
  config={{
    openExternal: (url) => shell.openExternal(url),
    onLinkOpened: (url) => track("OpenURL", { url }),
    localization: {
      currentLanguage: language,
      defaultLanguage: "en",
      languages: { en: "", fr: "fr", es: "es" },
    },
  }}
>
  <App />
</LinkingProvider>
```

### Feature usage

```tsx
import { useOpenLink, useLocalizedUrl } from "@shared/platform-linking";

function MyComponent() {
  const openLink = useOpenLink();
  const supportUrl = useLocalizedUrl(FEATURE_URLS.support);

  return <Link onPress={() => openLink(supportUrl)}>Help</Link>;
}
```

### Feature-colocated URLs

Each feature owns its URLs:

```ts
// features/flow/<feature>/src/urls.ts
export const FEATURE_URLS = {
  support: "https://support.ledger.com/article/...",
} as const satisfies Record<string, `https://${string}`>;
```

## Exports

| Export            | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `LinkingProvider`  | React context provider — wire once per app                    |
| `useOpenLink`      | Hook returning a fire-and-forget function that validates, tracks, and opens a URL |
| `useLocalizedUrl`  | Hook returning a localized version of a URL                   |
| `assertSafeUrl`    | Throws if a URL uses a disallowed protocol (https/mailto only) |
| `localizeUrl`      | Pure function to localize Ledger URLs by language             |
| `LinkingConfig`    | Config type for the provider                                  |
| `LocalizationConfig` | Localization subset of the config                          |
| `OpenExternal`     | Type for the platform-specific open function                  |
