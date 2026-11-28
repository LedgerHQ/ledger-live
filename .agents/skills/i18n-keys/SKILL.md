---
name: i18n-keys
description: |
  Write wording keys the i18n key check can verify. Read when adding or changing
  t() / Trans i18nKey calls, key tables (titleKey, labelKey, ...) or English catalog
  entries in features/, domain/ or shared/, or when `lint:i18n-keys` fails.
---

# i18n keys

`pnpm lint:i18n-keys` (tools/nx-plugins/enforce-i18n-keys) checks that every key used in
`features/`, `domain/` and `shared/` exists in the English catalog of each app consuming the
package: Desktop `static/i18n/en/app.json`, Mobile `src/locales/en/common.json`.
`.web.*` files are checked against Desktop only, `.native.*` against Mobile only.
Other locales are not checked: only edit English.

## Principle: the feature owns its keys

A feature resolves its own wording with `useTranslation()`. Apps must not inject keys or labels
into features: pass a domain id or variant (`stage`, `status`) and let the feature map it to wording.
A key prop coming from `apps/*` is a smell; key props between components of the same package are fine.

## Write keys the check can verify

A key is verified when its type is a finite set of literals. A key typed `string` is
**unverifiable** and fails the check. Prefer, in this order:

1. **Literal at the call site**: `t("payTab.login.title")`. Greppable, needs no types.
2. **Domain union, key derived in one place**: a new member fails the check until its key exists.
   A literal union, an `as const` array or object, or a TS string enum all expand.
   ```ts
   type Stage = "intro" | "login";
   declare const stage: Stage;
   t(`payTab.login.${stage}.title`); // every Stage member is expanded and checked
   ```
3. **Internal prop typed as a union of full keys**: last resort, it duplicates key strings in a type.
   ```ts
   type Props = { titleKey: "x.intro.title" | "x.login.title" };
   ```

Don't map a union to full key literals when the keys share a pattern: the map duplicates every key
in the bundle, and the template is checked just as well.

```ts
const titleKeys = { intro: "x.intro.title", login: "x.login.title" } as const; // ❌
t(titleKeys[stage]);
t(`x.${stage}.title`); // ✅
```

What widens a key to `string` and hides it:

```ts
const COPY: Record<Id, { titleKey: string }> = { ... }; // annotation widens: use as const satisfies
const rows = [{ key: "a" }, { key: "b" }]; // add as const
function labelKey(kind: Kind): string { ... } // annotate the literal union
```

The check resolves workspace packages only: a type inferred from a third-party package (a
`react-native-keychain` enum) is `any` to it. Pass it through a parameter typed with a workspace union.

**Zod caveat**: `z.infer` of a `z.enum` is `any` to the check. Type the span with the `as const`
tuple the schema is built from: `const STAGES = ["intro", "login"] as const; z.enum(STAGES);
type Stage = (typeof STAGES)[number];`.

Template spans must be unions or literal consts, not `string` or `number`. Template keys are not
greppable: the check, not search, protects a "dead" key from deletion.

## When the check fails

- **missing in an app**: add the key to that app's English catalog.
- **unverifiable site**: narrow the key type (above).
- **a union member has no key in an app**: add the key, or remove the member if that app never uses it.
