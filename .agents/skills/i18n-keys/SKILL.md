---
name: i18n-keys
description: |
  Write wording keys the i18n key check can verify. Read when adding or changing
  t() / Trans i18nKey calls, key tables (titleKey, labelKey, ...) or English catalog
  entries in features/, domain/ or shared/, or when `lint:i18n-keys` fails.
globs: ["features/**/*.{ts,tsx}", "domain/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}"]
---

# i18n keys

`pnpm lint:i18n-keys` (tools/nx-plugins/enforce-i18n-keys) checks that every key used in
`features/`, `domain/` and `shared/` exists in the English catalog of each app that consumes
the package: Desktop `static/i18n/en/app.json`, Mobile `src/locales/en/common.json`.
Add each new key to both catalogs. `.web.*` files are checked against Desktop only, `.native.*` against Mobile only.

## What the check can verify

It reads the TypeScript types, so a key is verified when its type is a finite set of literals.

```ts
t("payTab.card.title"); // literal
t(`${PREFIX}.title`); // const PREFIX = "payTab.card" (literal-typed const)
t(isOpen ? "a.hide" : "a.show"); // each branch
type Stage = "intro" | "login";
t(`payTab.login.${stage}.title`); // every Stage member is expanded and checked
```

## Make dynamic keys verifiable

A key typed `string` is **unverifiable**: it is counted, and the count may never go up
(`unverifiable-baseline.json`). Narrow the type instead.

```ts
// ❌ widened to string
type Props = { titleKey: string };
const COPY: Record<Id, { titleKey: string }> = { ... };
const rows = [{ key: "a" }, { key: "b" }];
function labelKey(kind: Kind): string { ... }

// ✅ keep the literals
type Props = { titleKey: "x.intro.title" | "x.login.title" };
const COPY = { intro: { titleKey: "x.intro.title" } } as const satisfies Record<Id, Copy>;
const rows = [{ key: "a" }, { key: "b" }] as const;
function labelKey(kind: Kind): "x.face" | "x.touch" { ... }
```

- Prop or parameter taking a key: type it as the union of keys, never `string`.
- Key table: `as const satisfies Record<Id, Shape>`, never a `Record<Id, {k: string}>` annotation.
- Helper returning a key: annotate the literal union as return type.
- Template spans must be unions or literal consts, not `string` or `number`.
- Prefer a literal key per call site over building keys from runtime data.

## Supported call shapes

`t` from `useTranslation()` (renamed destructuring, `useTranslation().t`), `i18n.t`, `i18next.t`,
`<Trans i18nKey>`; `as const`, parentheses and `satisfies` are unwrapped; `ns:key`, the
`keyPrefix` option and `context` (`key_ctx`) are handled; plural suffixes (`_one`, `_other`, ...) count.
A function parameter named `translate` is ignored: its keys are relative to the caller.

## When the check fails

- **missing in App**: add the key to that app's English catalog.
- **unverifiable count went up**: narrow the type (above). Do not raise the baseline to silence it.
- **count went down**: run `node tools/nx-plugins/enforce-i18n-keys/validate.js --update-baseline`.
- **A union member has no key in an app**: add the key, or remove the member if it is never used there.
  `allowMissing` in `unverifiable-baseline.json` is a last resort and needs a reviewer-visible reason in the PR.

Other locales are not checked: only edit English, translations are synced separately.
