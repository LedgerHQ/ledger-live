# @support/lint

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

The repository's oxlint presets, one per layer that differs, and its custom lint rules.

## How a package gets its config

Each layer root carries a one-line `oxlint.config.mts` that re-exports a preset:

```ts
// features/flow/oxlint.config.mts
export { default } from "@support/lint/features-flow";
```

oxlint finds it by walking up from the file it lints, as the editor extension does, so a package
runs plain `oxlint src` and carries no config file and no `-c`. The package resolves from the
workspace root, so consumers do not list it in their dependencies.

A package that needs one rule of its own passes it on its `lint` script, for example
`oxlint ./src -A no-console`. Only the flags in the allowlist of the
[conformance rule](../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs) are accepted there; a
rule that several packages of a layer need belongs in that layer's preset.

## Presets

| Preset | Layer | Differs from `base` |
| --- | --- | --- |
| `base` | `domain/` | The baseline; slice-selectors rule on, with waivers |
| `devtools` | `devtools/` | Automatic JSX runtime, console allowed, platform-suffix rule on, `jsx-a11y/aria-role` off in native files |
| `features-flow` | `features/flow/` | `any` and test-structure rules are errors; lodash, `expo-clipboard`, `navigator.clipboard` and live-common `lib/` restricted; React Compiler rules fatal in the packages that had them fatal; platform-suffix and slice-selectors rules on, with waivers; Lumen's `recommended` lint preset (`@ledgerhq/lumen-lint-plugin`) on `*.web.{ts,tsx}` |
| `features-platform` | `features/platform/` | Platform-suffix and slice-selectors rules on, with waivers |
| `shared` | `shared/` | Platform-suffix and slice-selectors rules on, with waivers |
| `support` | `support/` | Console allowed |
| `tools` | `tools/` | Node only, console allowed, `build/` ignored |
| `libs` | `libs/` | Correctness rules as warnings, suspicious off |
| `libs-coin` | `libs/coin-modules/`, `libs/wallet-btc/` | `libs`, with correctness as errors and suspicious as warnings, import cycles fatal (warnings in coin-bitcoin and wallet-btc), direct `createApi` imports forbidden |
| `libs-coin-tester` | `libs/coin-tester-modules/` | `libs`, with correctness as errors and suspicious as warnings |

A preset never weakens a rule a package had: where some packages of a layer are stricter than the
rest, an `overrides` entry keeps them stricter. `overrides` cannot set `categories` or
`ignorePatterns`, though, which is why each layer that differs gets its own config file rather than
an override in a root one. `ignorePatterns`, `globals` and `settings` do not survive `extends`
either, so a preset that needs them declares them itself. Globs in `overrides` and `ignorePatterns`
anchor to the directory of the layer config that re-exports the preset.

The `no-restricted-imports` entries that several configs share live in `restricted-imports.mts`,
which the presets and the `.mts` configs import and which writes the JSON fragments in
`restricted-imports/` that the JSON configs extend.

`plugins.mts` (`@support/lint/plugins`) exports `SUFFIX_IMPORTS_PLUGIN` and `REDUX_SLICES_PLUGIN`,
the absolute paths of the `suffix-imports` and `redux-slices` JS plugins. `base` puts them in
`jsPlugins`; a config that does not extend a preset,
such as an app config, imports it by package name, as it imports `@support/lint/restricted-imports`.

## Conformance

`lint:tool-config` rejects an oxlint config anywhere but the layer roots (the workspace root
included), a missing or edited layer config, a `-c` on an oxlint call, and a rule flag outside the
allowlist or on another script than `lint`. It also requires `"@support/lint": "workspace:*"` in a
package whose preset imports an npm package other than `oxlint`, directly or through a relative
import, as `features-flow` imports `@ledgerhq/lumen-lint-plugin`: Nx hashes that package in
`lint`, and marks the package affected when it changes, only through that edge. Subtrees that keep their own config for now (the apps, the e2e
suites, a few legacy `libs/` trees) are listed in the plugin's `exclusions.mjs`.

## Rules

### `suffix-imports/no-platform-suffix`

Platform variants are carried by file names (`Foo.web.tsx` / `Foo.native.tsx`) and resolved by
configuration: `moduleSuffixes` in tsc, `moduleFileExtensions` in jest, `resolve.extensions` in
rspack, `preferNativePlatform` in Re.Pack. A suffix in the specifier itself is redundant, hides
cross-platform contamination from tsc, and rots on a rename. See [tsconfig.md](../../docs/tsconfig.md).

`base` registers the rule off. `devtools`, `features-flow`, `features-platform` and `shared`
turn it on, and so do the desktop and mobile app configs. It checks `import`, `export`, dynamic
`import()`, type-level `import()`, `require()` and the `jest.mock` family, and reports three shapes.

**A trailing `.web` or `.native`, before an optional JS or TS extension.** Autofixable:
`oxlint --fix` strips the suffix and keeps the extension.

```ts
// ✗
import Foo from "./Foo.native";
jest.mock("./internals/digest.web");

// ✓
import Foo from "./Foo";
jest.mock("./internals/digest");
```

**A relative `web` or `native` module, with or without a JS or TS extension.** Reported without
an autofix: dropping the segment resolves to another module, so the fix is to rename the file.

```ts
// ✗
export * from "./steps/Detail/native"; // steps/Detail/native.ts

// ✓
export * from "./steps/Detail"; // steps/Detail/index.native.ts
```

**A platform entry imported from the other platform.** A `/native` or `/web` subpath of an
`@features/*`, `@shared/*` or `@domain/*` package is a
[platform entry](../../docs/adr/universal-components.md) (R5). Only code of that platform imports
it: a `.native.*` file, a file of `apps/ledger-live-mobile/`, or a native-only package, and the
mirror for `/web` with `apps/ledger-live-desktop/`. A package is native-only when it has a
`tsconfig.native.json` and no `tsconfig.web.json`, or, with neither, when its `tsconfig.json`
extends `@support/tsconfig/native` directly or through its own configs. Reported without an
autofix, since the universal entry does not export the same components.

```ts
// Lottie.web.tsx
import { Lottie } from "@shared/lottie/native"; // ✗
import { Lottie } from "@shared/lottie/web"; // ✓
```

Third-party entry points (`styled-components/native`, `@react-navigation/native`) and `@support/*`
subpaths (`@support/jest-devtools/native`) are never reported.

Each preset waives its layer's remaining violators through `platformSuffixWaivers` in
`src/suffix-imports.js`, which states the waiver policy.

### `redux-slices/selectors-in-slice`

The rule reports [`SELECTORS_IN_SLICE_RULE`](src/redux-slices.js). RTK binds a nested selector to the
root state, so the package needs no hand-written root type and no `selectors.ts` for it, and
another mount point rebinds the same set with `getSelectors`. The
[`slice-selectors`](../../.agents/skills/slice-selectors/SKILL.md) skill states the convention;
the rule keeps it from regressing. Its scope across the presets is stated next to it in
`src/redux-slices.js`.

It reports a function, a declaration or a `const` arrow or function expression, when all of these
hold:

- its name is `select*` or `*Selector`;
- it is not in a test file (`*.test.*`, `*.spec.*`, `__tests__/`);
- it is not inside the `selectors` object of a `createSlice` call;
- it has no type parameter;
- its package declares a `createSlice` somewhere in `src/`, test files aside;
- its first parameter is read through exactly one root key (`state.contacts`), or only passed to
  one `select*` call, and no other parameter carries state (typed `*State` or passed first to a
  selector).

```ts
// ✗ in a package that declares a slice
export function selectContacts(state: { contacts: ContactsState }) {
  return state.contacts.contacts;
}

// ✓
export const contactsSlice = createSlice({
  // ...
  selectors: { selectContacts: state => state.contacts },
});
export const { selectContacts } = contactsSlice.selectors;
```

Not reported: generic selectors (`selectFeature<T>`, which RTK's `selectors` field would lose the
type parameter of), cross-slice selectors (two root keys, two selectors, or two state parameters
such as `selectAccountNameByUUID(names, accounts, uuid)`), selectors already nested, packages
that declare no slice, and test files. The rule has no autofix. An exception goes on its line with
`// oxlint-disable-next-line redux-slices/selectors-in-slice` and a reason.

Each preset waives its remaining violators through `sliceSelectorsWaivers` in
`src/redux-slices.js`, which states the waiver policy.

Run the rules' tests with `nx run @support/lint:test`.
