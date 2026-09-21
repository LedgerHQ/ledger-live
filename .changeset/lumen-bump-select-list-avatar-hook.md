---
"live-mobile": patch
"ledger-live-desktop": patch
"@features/platform-contacts": patch
---

Bump lumen-design-core to 0.1.29, lumen-ui-react to 0.1.59, lumen-ui-rnative to 0.1.62, and lumen-utils-shared to 0.1.13. In lumen-ui-rnative, `OptionList` (and its subcomponents, e.g. `OptionListItem`) is renamed to `SelectList`/`SelectListItem`, and `resolveAvatarColor` is renamed to `useResolveAvatarColor`, now a theme-reactive hook instead of a plain function; call sites in live-mobile and `@features/platform-contacts` are migrated accordingly. `resolveAvatarColor` in lumen-ui-react is unaffected by this bump.
