# @shared/i18n

> [!CAUTION]
> **Status: UNSTABLE** — New package; the contract is still being validated against the first
> `features/*` migrations.

A thin i18n **context bridge**. Each app mounts one `<I18nProvider>` at its root with its own
i18next instance; `features/*`, `domain/*` and `shared/*` components then call `useTranslation()`
and render `<Trans>` exactly like app-layer components do — no props-drilling of strings, no
per-package translation context.

This package owns **no** i18next instance, no resources, and no configuration. It only carries
whatever the app injects.

## Exports

| Export | Description |
| --- | --- |
| `I18nProvider` | Mounted once per app root. Takes the app's i18next instance. |
| `useTranslation` | `react-i18next`'s hook bound to the injected instance. `i18n` is not accepted in the options — the provider decides. |
| `Trans` | `react-i18next`'s component bound to the injected instance. |
| `useI18n` | The raw instance, for `language` / `changeLanguage` / `exists`. |
| `I18nInstance`, `I18nNamespace`, `I18nProviderProps`, `TransProps` | Types. |
| `MissingI18nProviderError` | Thrown when a consumer renders outside a provider. |
| `createI18nTestInstance`, `I18nTestProvider` (`@shared/i18n/testing`) | Test-only helpers. |

## App wiring

```tsx
// apps/<app>/…/i18n.ts
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

export const i18n = createInstance();
i18n.use(initReactI18next).init({ resources, defaultNS: "app", /* … */ });
```

```tsx
// app root
import { I18nProvider } from "@shared/i18n";
import { I18nextProvider } from "react-i18next";

<I18nextProvider i18n={i18n}>
  <I18nProvider i18n={i18n}>
    <App />
  </I18nProvider>
</I18nextProvider>;
```

Two providers, one instance, on purpose:

- `I18nextProvider` serves the app's own `react-i18next` call sites (thousands of them today).
- `I18nProvider` serves DDD packages. It deliberately does **not** re-mount `I18nextProvider`
  itself: if a DDD package ever resolved a second physical copy of `react-i18next`, a shared
  context would silently split in two, whereas passing the instance explicitly cannot.

### The instance must be `createInstance()`

Never hand `I18nProvider` the module-level `i18next` default export. A single global singleton is
the failure mode the [Module Federation i18n guide](https://module-federation.io/integrations/practice/react/i18n-react.html)
warns about: once host and remotes all `init()` the same object, their namespaces clobber each
other. With an explicit instance, splitting a feature into its own remote is a wiring change and
nothing else — feature code does not move.

## Feature usage

```tsx
import { useTranslation } from "@shared/i18n";

export function FeatureTour() {
  const { t } = useTranslation();
  return <h2>{t("payTab.featureTour.title")}</h2>;
}
```

### Namespaces and key typing

Keys are typed as `string` inside DDD packages: `react-i18next`'s `CustomTypeOptions` augmentation
is app-owned, and a shared package cannot see either app's resource shape. Passing a namespace
works (`useTranslation("myNamespace")`), but until translation keys are colocated per feature
(a follow-up epic), features resolve keys in the host app's **default** namespace — `app` on
Desktop, `common` on Mobile — so a migrated feature needs its keys present in both apps under the
same path.

## Testing

`useTranslation` throws `MissingI18nProviderError` outside a provider rather than falling back to
the global singleton. Wrap the component under test:

```tsx
import { I18nTestProvider } from "@shared/i18n/testing";

render(
  <I18nTestProvider resources={{ en: { translation: { "payTab.featureTour.title": "Pay" } } }}>
    <FeatureTour />
  </I18nTestProvider>,
);
```

With no `resources`, every key resolves to itself — convenient when the assertion is about which
key was rendered rather than its wording.
