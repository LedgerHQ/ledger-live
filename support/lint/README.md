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
| `features-flow` | `features/flow/` | `any` and test-structure rules are errors; lodash, `expo-clipboard`, `navigator.clipboard` and live-common `lib/` restricted; React Compiler rules fatal in the packages that had them fatal; platform-suffix rule on; slice-selectors rule on, with waivers; Lumen's `recommended` lint preset (`@ledgerhq/lumen-lint-plugin`) on `*.web.{ts,tsx}` |
| `features-platform` | `features/platform/` | Platform-suffix rule on; slice-selectors rule on, with waivers |
| `shared` | `shared/` | Platform-suffix rule on; slice-selectors rule on, with waivers |
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

`plugins.mts` (`@support/lint/plugins`) exports `SUFFIX_IMPORTS_PLUGIN`, `REDUX_SLICES_PLUGIN` and
`DERIVATION_MIRROR_PLUGIN`, the absolute paths of the `suffix-imports`, `redux-slices` and
`derivation-mirror` JS plugins. `base` puts them in
`jsPlugins`; a config that does not extend a preset,
such as an app config, imports it by package name, as it imports `@support/lint/restricted-imports`.
It also exports `COIN_FAMILIES_PLUGIN` and `LEGACY_UI_PLUGIN`, which the apps reach through
`coinFamiliesLint` and `legacyUiLint`.

## Conformance

`lint:tool-config` rejects an oxlint config anywhere but the layer roots (the workspace root
included), a missing or edited layer config, a `-c` on an oxlint call, and a rule flag outside the
allowlist or on another script than `lint`. It also requires `"@support/lint": "workspace:*"` in a
package whose preset imports an npm package other than `oxlint`, directly or through a relative
import, as `features-flow` imports `@ledgerhq/lumen-lint-plugin`: Nx hashes that package in
`lint`, and marks the package affected when it changes, only through that edge. Subtrees that keep their own config for now (the apps, the e2e
suites, a few legacy `libs/` trees) are listed in the plugin's `exclusions.mjs`.

## The account descriptor stays at the edges

Code holds the `AccountUUID`. `@domain/entity-account-descriptor`, which carries the descriptor and
its key, `@domain/entity-account/descriptor`, which computes the `AccountUUID` from it, and
`@features/platform-account-discovery/descriptor`, whose results carry descriptors, are restricted
by `ACCOUNT_DESCRIPTOR` in `restricted-imports.mts`. They are exact `paths` names, so
tests keep the `./schema.mock` entries. `base` and `features-flow` list them, and so do the desktop
and mobile app configs, their `src/config/account-data-setup` files aside.

`ACCOUNT_DESCRIPTOR_EDGES` lists the packages allowed to import it, as paths from the repo root:
the account data router (`domain/api/account-data`), the legacy bridge (`domain/entity/account`),
`features/platform/account-data`, discovery and the account sources. `base` turns each into an
override below its layer root; `features-flow` does the same for its entries, keeping its own
restrictions. A temporary entry carries a comment naming the ticket that removes it.
`devtools`, `libs/ledger-live-common` and `apps/wallet-cli` are edges too and stay unrestricted.

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

The rule has no waiver: every preset that turns it on reports it as an error in every package of
its layer.

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

### `derivation-mirror/in-step`

[`src/derivation-mirror.js`](src/derivation-mirror.js) compares the derivation tables of
`libs/ledger-wallet-framework/src/derivation.ts` with their mirror in
`domain/entity/derivation/src/modes.internals.ts`, and reports each table that differs on the file
being linted, so either side fails on its own. It reads the other file from disk with the
TypeScript parser, loaded only for these two files. `base` turns it on as an error and `libs`
inherits it. The [`@domain/entity-derivation` README](../../domain/entity/derivation/README.md#a-mirror-of-derivationts)
says why both copies exist and how to change them.

### `coin-families/no-coin-specific-import`

[`src/coin-families.js`](src/coin-families.js) keeps generic Desktop and Mobile code from reaching
coin code other than through the families contract, which is what stops a new import from pulling
coin code into an eager chunk. It checks `import` and `export ... from` (type-only included),
`import()`, `import type`, `import x = require()`, `require` and the `jest.mock` family, with a
string or a template literal that has no substitution. A specifier built at run time
(``require(`@ledgerhq/coin-${name}`)``) cannot be checked. It reports three kinds of
specifier, each with its own message:

- **`coin-package`**: a coin module, a live-signer, a device signer kit or wallet-btc, `@ledgerhq/coin-*`,
  `@ledgerhq/live-signer-*`, `@ledgerhq/device-signer-kit-*` and `@ledgerhq/wallet-btc`, and their
  subpaths. The exclusion is by full package name (`coin-module-framework`, `coin-framework`,
  `coin-modules-monitoring`, `coin-module-boilerplate`, `coin-tester*`), because the prefix alone
  would also take them.
- **`live-common-family`**: a live-common family, `@ledgerhq/live-common/(lib/|lib-es/)?families/<x>`.
- **`app-family`**: the app's own families folder, reached by a relative path, `~/` (which both apps map to
  `src/`) or a bare `src/` specifier.

Files inside the families folder are not checked at all: importing the coin is what they are for.

An app turns the rule on with `coinFamiliesLint` from `@support/lint/coin-families`. App configs do
not extend `base`, so each key goes into the config's own:

```ts
const coinFamilies = coinFamiliesLint({
  familiesDir: "src/renderer/families",
  barrel: "contract",
  allow: ["modals-loaders"],
});
// jsPlugins: [SUFFIX_IMPORTS_PLUGIN, ...coinFamilies.jsPlugins],
// rules: { ..., ...coinFamilies.rules },
```

`familiesDir` is relative to the app root, found from the linted file as the nearest folder with a
`package.json`. `barrel` says what the folder's entry point is: `contract` (Desktop) is the lazy
contract, so importing it stays legal, as does each entry named in `allow`; `forbidden` (Mobile) is
eager, so importing it is reported like importing a family, `require("~/families")` included. Every
other file of the folder is reported unless it is in `allow`. Without `familiesDir` only
`coin-package` and `live-common-family` are checked.

`coinFamilies.rules` holds the three rules of the plugin: `no-coin-specific-import`,
`no-family-branch` and `no-currency-id-branch`. The two branch rules receive only `familiesDir`: their
schema rejects `barrel` and `allow`.

**Baseline.** An app starts from today's leaks with oxlint's own suppressions, from the app folder
and with the paths `lint:ci` uses: `oxlint --suppress-all` writes `oxlint-suppressions.json`, one
count per file and per rule. These behaviours are covered by the rule's tests (oxlint 1.93.0):

- A file at its count passes. With one violation more it fails and oxlint lists every violation of
  the file, since it cannot tell which is new.
- With one violation less it fails with "There are suppressions that do not occur anymore",
  including under `--quiet`; `oxlint --prune-suppressions` rewrites the file and the run passes. The
  `unix` format prints that error with no message, so read it in the default format.
- A baselined file that was deleted does not fail the command; its entry stays until the next
  prune. How the editor's language server treats it was not tested.

The count is per rule, not per category: replacing a `coin-package` leak by an `app-family` leak in
the same file keeps the count and passes.

**Inline disables.** A baselined violation is never silenced in the code. The plugin reports an
`oxlint-disable` or `eslint-disable` comment that names a `coin-families/` rule, but a directive
for the whole file hides that report with the rule's own. The check that cannot be hidden is
[`src/check-coin-families-disables.js`](src/check-coin-families-disables.js), run by
`pnpm lint:coin-families-disables` and part of `pnpm lint:arch`. It reads the files' real comments:
a directive spread over several lines counts, and the same text inside a string does not. A
directive is a comment that starts with `oxlint-disable` or `eslint-disable` and names the rule
before any `-- explanation`, which is what oxlint 1.93.0 honours; prose that only mentions one is
not.

The skill [`coin-families-contract`](../../.agents/skills/coin-families-contract/SKILL.md) says
where coin-specific behaviour goes instead, and every message links it.

### `coin-families/no-family-branch`

[`src/branch-rules.js`](src/branch-rules.js) keeps generic code from branching on a coin family
name, which keeps coin behaviour inside `families/`. A family name is a directory of
`libs/ledger-live-common/src/families`, read once when the plugin loads. A family expression is
`.family` (through optional chains, `as`, `!` and parentheses) or an identifier named `family`,
`currencyFamily` or ending in `CurrencyFamily`. `fontFamily` and `deviceFamily` are not matched.

- **Equality**: `===`, `!==`, `==` or `!=` between a family expression and a family name, on either side.
- **`switch`**: each `case` of a `switch` on a family expression that holds a family name.
- **Membership**: `.includes`, `.has` or `.indexOf` of a family expression on an array literal, a
  `new Set([...])` or a `const` of the same file that holds one with a family name. The `const` is
  matched by name once the file is read, so it can sit below the function that uses it, and a
  shadowing variable of the same name is not told apart.

Files inside the app's families folder are not checked, since narrowing on the family is what they are
for. The option is the `familiesDir` of `no-coin-specific-import`, which `coinFamiliesLint` passes on:
`["error", { familiesDir: "src/renderer/families" }]`. Without it every file is checked.

It does not report a comparison of two family expressions (`a.family === b.family`), a `typeof`
check, a name that is not a family, or a lookup in an object keyed by family.

Blind spots, none of which the rule can see: a family-keyed object literal, a list imported from
another module (it cannot be told from a list of currency ids), and duck typing
(`"raw" in transaction`).

The baseline and the inline disables work as for `no-coin-specific-import`, including its
directive report. A config that turns on both rules gets the comment reported once per rule.

### `coin-families/no-currency-id-branch`

The same three checks as `no-family-branch`, for a currency id, in
[`src/branch-rules.js`](src/branch-rules.js). A currency id is the `id` of a currency under
[`domain/entity/currency-crypto/src/currencies`](../../domain/entity/currency-crypto/src/currencies),
read once when the plugin loads. A currency id expression is `.currency.id`, `currency.id`, or a
name (identifier or property) that is `currencyId` or ends in `CurrencyId`. Other `*Id` names
(`accountId`, `tokenId`) are not matched.

It is a rule of its own, with its own baseline count, because a name can be both a family and a
currency id: 27 of the 31 families are also currency ids (`bitcoin`, `hedera`, `solana`, ...), while
`ethereum_classic` and `crypto_org` are currency ids only and `evm`, `xrp`, `canton` and `multiversx`
are families only. The rule tells them apart by the expression, not by the string:
`family === "bitcoin"` is reported by `no-family-branch`, `currencyId === "bitcoin"` by this rule, and
`currencyId === "evm"` by neither.

The `familiesDir` option and the exemption of the families folder are the ones of `no-family-branch`.

The blind spots of `no-family-branch` apply, and one more: a currency compared without `.id`
(`route.currency !== "tezos"`) is not a currency id expression, so it is not reported.

### `coin-families-exceptions`

A baseline entry is debt, owned by the burn-down. A file that stays on purpose is an exception, and its reason
lives in the app's `coin-families-exceptions.json` (`apps/ledger-live-desktop`, `apps/ledger-live-mobile`), because
`oxlint-suppressions.json` cannot hold one and oxlint rewrites it when it prunes. An entry is
`{ file, kind, owner, reason, ticket?, rules? }`:

- **`accepted`**: stays for good; `owner` and `reason` are required.
- **`temporary`**: goes away with a flag or a ticket; `reason` or `ticket` is required.
- **`rules`**: the `coin-families/*` rules that report the file, absent when none does (URL data, a local list).

[`src/check-coin-families-exceptions.js`](src/check-coin-families-exceptions.js), run by
`pnpm lint:coin-families-exceptions` and part of `pnpm lint:arch`, fails on a file that no longer exists, on a rule
the baseline no longer holds for the file (remove it from the entry when the leak is fixed), on a missing field and
on a file listed twice. It does not ask a reason for each baseline entry: the rest of the baseline is debt, tracked
by its tickets.

### `legacy-ui`

[`src/legacy-ui.js`](src/legacy-ui.js) stops the growth of the legacy UI stack in the apps: the
pre-Lumen design systems (`@ledgerhq/native-ui`, `@ledgerhq/react-ui`), `styled-components` and the
Desktop `Box` and `Text` components. Each app starts from a baseline of today's usage, so a count can
only shrink. It has four rules:

- **`legacy-ui/no-legacy-import`**: one report per `import` or `export ... from` declaration of a
  legacy module, `import type` included.
- **`legacy-ui/no-legacy-element`**: one report per JSX element whose name, or the root object of a
  member name (`<Icons.Close />`), is a binding imported from a legacy module. The message names the
  component.
- **`legacy-ui/no-styled-definition`**: one report per `styled.tag`, `styled(X)` or chained
  `.attrs(...)` definition, counted once, where `styled` is the default import of
  `styled-components` or `styled-components/native`.
- **`legacy-ui/no-banned-component`**: reports each import and JSX element of a component listed in
  `bannedComponents`, imported from a legacy module. A component goes on the list once its count
  reaches zero, so the rule never enters a baseline.

An app turns them on with `legacyUiLint` from `@support/lint/legacy-ui` and spreads each key into
its config, next to `coinFamilies`:

```ts
const legacyUi = legacyUiLint({
  modules: ["@ledgerhq/native-ui", "styled-components"],
  exemptPaths: [{ glob: "src/screens/Settings/**", reason: "newSettings" }],
});
// jsPlugins: [..., ...legacyUi.jsPlugins],
// rules: { ..., ...legacyUi.rules },
```

Every rule reads the same options:

- **`modules`**: a specifier matches an entry or a subpath of it (`styled-components` covers
  `styled-components/native`). An entry starting with `~/` also matches any specifier that the app's
  `tsconfig.json` resolves to the same file or folder (a relative path, `src/...` through `paths`); the
  files of that entry may import each other.
- **`exemptPaths`**: `{ glob, reason }` entries, globs relative to the app root (the nearest folder
  with a `package.json`). No rule checks a matching file. `reason` names the feature flag whose
  cleanup deletes the folder, or `dev-only`.
- **`bannedComponents`**: component names, the imported name of a named import or the local name
  of a default import. It ships empty.

**Baseline.** Each app's `oxlint-suppressions.json` holds the `legacy-ui/*` counts next to the
`coin-families/*` ones, written by `oxlint --suppress-all` from the app folder with the paths of
`lint:ci`. The suppression behaviours described for `no-coin-specific-import` apply. A PR that
removes legacy usage runs `oxlint --prune-suppressions` from the app folder, with the same paths, to
lower the counts. The suppressions files hold the `coin-families/*` baseline too, so a change to
them needs a review by Coin Integration.

Run the rules' tests with `nx run @support/lint:test`.
