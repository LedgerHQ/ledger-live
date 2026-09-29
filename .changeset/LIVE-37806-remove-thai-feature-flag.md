---
"@ledgerhq/types-live": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(i18n): keep Thai selected across app restarts

Removes the `llmThai` / `lldThai` feature flags. Flags resolve on their `enabled: false` default
until the first remote fetch settles, so on every cold start the locale guard saw Thai as
unsupported and persisted English over the user's choice.
