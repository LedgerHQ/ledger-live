# @support/lint-base

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

The root of the `@support/lint-*` preset chain. It holds the baseline oxlint rules **and** the repo's
custom oxlint JS plugin, in one package, because those two things cannot be separated: see
[jsPlugins cannot be inherited](#jsplugins-cannot-be-inherited) below.

## Usage

Nothing extends `lint-base` directly except another preset. A package consumes its layer's preset:

```jsonc
{
  "scripts": { "lint": "lint-features-flow src", "lint:fix": "lint-features-flow src --fix" },
  "devDependencies": { "@support/lint-features-flow": "workspace:*" }
}
```

A layer preset is a few lines, because `lint-base` carries the rest:

```ts
import { defineConfig } from "oxlint";
import base from "@support/lint-base";

export default defineConfig({
  extends: [base],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs", "node_modules"],
  rules: { "typescript/no-explicit-any": "error" },
});
```

## What `lint-base` sets, and why most of it is a demotion

oxlint's `correctness` category is fatal by default and contains the React Compiler rules, which this
codebase treats as advice. Every layer that linted before this package existed had reached that
conclusion independently, in its own config; collecting the decisions in one place is what lets a
previously-unlinted layer switch lint on without turning red. The explicit `rules` are otherwise the
vocabulary four or more layers already named, at the value the majority of them chose.

`eslint/no-restricted-imports` is deliberately absent. Its currency and wallet-framework blocks
differ per consumer and are by volume the largest duplication in the repo; they deserve a preset of
their own.

## Mechanics that are easy to get wrong

Each was measured against the pinned oxlint, not read from documentation.

### `jsPlugins` cannot be inherited

A relative `jsPlugins` path is resolved against **the config that declares it**, and is re-based onto
any config that `extends` it, so it breaks at a different depth. A bare package specifier does not
resolve either. `lint-base` sidesteps this by resolving the plugin from its own `import.meta.url`,
which yields an absolute path that survives `extends` and works from a consumer at any depth. This is
the whole reason the plugin and the baseline rules live in one package.

### `-c` is what makes "no config file in the consumer" work

Passing `-c` disables oxlint's upward config discovery, so a package with no `.oxlintrc.json` is not
at the mercy of whatever sits above it. It also means **each preset must be complete on its own**.

### What `extends` carries, and what it does not

`extends` accepts an imported config object, not just a path, which is what makes a named preset
possible. Through it:

- `rules`, `plugins` and `overrides` **are** inherited. (A JSON-path `extends` drops `overrides`; an
  object `extends` does not.)
- `categories` is **replaced** by the child, not merged — which is how `lint-libs` keeps `libs/` opted
  out of the categories entirely.
- `ignorePatterns`, `globals` and `settings` are **not** inherited. Every preset re-declares them.

### `overrides[].files` globs anchor to the config's directory

The preset lives outside every tree it lints, so a glob like `flow/contacts/src/**` matches nothing.
A `**/`-prefixed glob works and stays precise: `**/features/flow/contacts/src/**` waives that package
and no other. A `../../`-relative glob does **not** work. This is the form a per-package waiver list
has to use — the platform-suffix rule below is enabled layer by layer that way.

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
