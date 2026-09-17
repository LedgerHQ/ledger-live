# @support/lint-rules

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

Custom oxlint JS plugins for monorepo-wide lint rules.

## Usage

Reference a rule file from the `.oxlintrc.json` that should enforce it:

```json
{
  "jsPlugins": ["../support/lint-rules/src/suffix-imports"],
  "rules": {
    "suffix-imports/no-platform-suffix": "error"
  }
}
```

The path is relative to the config file that declares it, and an extension is optional.

> [!IMPORTANT]
> **Declare `jsPlugins` in every config that needs the rule. Do not inherit it through `extends`.**
> An inherited relative `jsPlugins` path is re-based onto the *extending* config rather than the one
> that declared it, so a config one directory deeper fails with `Cannot find module`. A bare package
> specifier such as `@support/lint-rules/src/suffix-imports.js` does not resolve either. The cost is
> one duplicated line per config, and the failure is loud rather than silent.

Comments are allowed in `.oxlintrc.json`.

## Rules

### `suffix-imports/no-platform-suffix`

Platform variants are carried by *file names* (`Foo.web.tsx` / `Foo.native.tsx`) and resolved by
configuration: `moduleSuffixes` in tsc, `moduleFileExtensions` in jest, `resolve.extensions` in
rspack, `preferNativePlatform` in Re.Pack. A suffix in the specifier itself is redundant, hides
cross-platform contamination from tsc, and rots silently on a rename. See `docs/tsconfig-in-ddd.md`.

The rule reports three shapes, across `import`, `export`, dynamic `import()`, `require()` and the
`jest.mock` family.

**A trailing `.web` or `.native` on a relative specifier.** Autofixable.

```ts
// ✗
import Foo from "./Foo.native";
export * from "./hooks/useBar.web";
jest.mock("./internals/digest.native");

// ✓
import Foo from "./Foo";
export * from "./hooks/useBar";
jest.mock("./internals/digest");
```

**A `/web` or `/native` subpath of a workspace package.** Autofixable. Limited to `@features/`,
`@shared/` and `@domain/`, because the root `exports` condition already resolves the platform.

```ts
// ✗
import { ContactsListView } from "@features/flow-contacts-list/native";

// ✓
import { ContactsListView } from "@features/flow-contacts-list";
```

**A relative `web.ts` or `native.ts` module.** Reported, but *not* autofixable: dropping the segment
resolves to a different module, so the fix is to rename the file.

```ts
// ✗
export * from "./steps/Detail/native";   // steps/Detail/native.ts

// ✓
export * from "./steps/Detail";          // steps/Detail/index.native.ts
```

**Deliberately not reported**, because these are real platform entry points rather than redundant
suffixes: third-party packages (`styled-components/native`, `@ledgerhq/crypto-icons/native`,
`@react-navigation/native`) and `@support/*` test tooling, whose `./native` and `./web` subpaths are
its documented API.

`docs/tsconfig-in-ddd.md` sanctions pinning one platform from shared code when a use case genuinely
requires it. Use `// oxlint-disable-next-line suffix-imports/no-platform-suffix` with a reason.

## Tests

```sh
nx run @support/lint-rules:test
```
