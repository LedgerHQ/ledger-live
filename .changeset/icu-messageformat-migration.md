---
"live-mobile": patch
"ledger-live-desktop": patch
---

Migrate i18n to ICU MessageFormat (LIVE-31440). All translation keys use ICU: single-brace `{var}` interpolation and `{count, plural, …}` / `{…, select, …}` instead of i18next `{{var}}` and `_one`/`_other` suffix keys, so Smartling can auto-expand per-language plural categories (e.g. Russian few/many). Runtime uses the official `i18next-icu` plugin; rendered output is unchanged (verified old vs new across all locales). See LIVE-31440-icu-migration.md.
