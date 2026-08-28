---
"@shared/i18n": minor
"@features/flow-pay-feature-tour": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `@shared/i18n`, a thin i18n context bridge so `features/*` and `domain/*` components can call `useTranslation()` and render `<Trans>` instead of receiving translated strings as props.

Both apps now build their i18next engine with an explicit `createInstance()` rather than the global singleton, and mount `<I18nProvider>` at their root alongside the existing `<I18nextProvider>`. Non-React call sites import the app instance (`~/renderer/i18n/init` on Desktop, `~/i18n/instance` on Mobile) instead of `i18next`, enforced by a lint rule.

`@features/flow-pay-feature-tour` is the pilot: it resolves its own `payTab.featureTour.*` copy and no longer takes any copy props.
