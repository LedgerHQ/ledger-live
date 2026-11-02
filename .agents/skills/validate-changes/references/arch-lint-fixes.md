# Architecture lint fixes

The usual fix for each code that `pnpm lint:arch` reports. The checks live in
`tools/nx-plugins/enforce-boundaries/`, `tools/nx-plugins/enforce-package-structure/` and
`tools/nx-plugins/enforce-tool-config/`.

Fix the code. The exception and waiver lists of those plugins record debt that only shrinks: a new
entry needs a reason, an exit condition and the plugin owners' review, and comes after the code
fix was ruled out.

## lint:boundaries

Rerun with `pnpm lint:boundaries`. The checks are the `find*Violations` functions of
[validate.js](../../../../tools/nx-plugins/enforce-boundaries/validate.js), which print one group
per check.

| Check | What it rejects | Usual fix |
| --- | --- | --- |
| `findViolations` | A project dependency its tags do not allow, by the edges of [constraints.js](../../../../tools/nx-plugins/enforce-boundaries/constraints.js). | Move the code to the lowest layer both sides may depend on, or invert the dependency: the lower package exposes a port and the app or a higher package provides it. Place it with the `structure-flow` skill. |
| `findSourceImportViolations` | An import of a legacy `@ledgerhq/*` package, or a relative path into `libs/`, from `shared/`, `domain/` or `features/`. | Import the layer replacement, such as `@domain/entity-contact` or `@shared/schema-primitives`. If none exists, move the needed code into a layer package first; follow the `legacy-migration` skill. |
| `findBannedExternalViolations` | A third-party package the project's tag bans, such as `react` in a `domain/entity` package. | Keep schemas, types and state in the entity. Put hooks in `domain/api` (it may expose RTK Query hooks) and UI in `features/` or `shared/ui-*`. |
| `findBannedDependencyViolations` | A dependency no workspace may declare. | Remove the dependency and use the replacement its ban entry names. |

## lint:structure

Rerun one package with `pnpm nx run <project>:lint:structure`. Each line names its code. The barrel
codes come from [rules.js](../../../../tools/nx-plugins/enforce-package-structure/rules.js), and
`stale-waiver` from [validate.js](../../../../tools/nx-plugins/enforce-package-structure/validate.js);
they apply to every package of `shared/`, `domain/` and `features/`; the public API rules are in the
`package-public-api` skill.

### Barrels

| Code | Meaning | Usual fix |
| --- | --- | --- |
| `not-a-barrel` | An `index.*` holds something other than `export * from "./x"` and an optional default re-export: a declaration, an import, a named or namespaced re-export. | Move the code to its own module and `export *` it. A named re-export means the target mixes public and private: move the private part to an internals location (`internals/`, `internals.ts` or `<name>.internals.ts`). |
| `internals-reexport` | A barrel, or a public module, re-exports an internals location. | Drop the re-export. Move what another package needs out of internals into a public module. |
| `cross-package-reexport` | A barrel or public module re-exports another workspace package, making this one a proxy. | Delete the re-export and import the original provider, for example `@features/platform-feature-flags`, at every consumer. |
| `external-reexport` | Same, for a third-party package. | Consumers import the third-party package themselves, or this package wraps it behind its own API (see the `wrap-third-party-libs` skill). |
| `hidden-barrel` | A module reached through `export *` or named in `package.json#exports` has a named re-export, so it hides barrel sorting outside `index.*`. | Same as `not-a-barrel`: declare in place or `export *`, and move the private part to internals. |
| `orphan-barrel` | No entry reaches this `index.*` through `export *`. | If another package uses what it groups, add `export * from "./dir"` to the entry. Otherwise delete the barrel and import the files directly, or move the folder under `internals/`. |
| `nested-barrel` | The barrel sits more than one `export *` level below its entry. | Re-export the files from the first-level barrel instead of chaining barrels. |
| `stale-waiver` | A waiver in `exceptions.js` or `intermediate-barrels.js` no longer matches a violation. | Delete the waiver: the debt is paid. |

### Universal components (R1 to R5)

These rules hold for a package with web and native implementations of a component. The codes come
from [components.js](../../../../tools/nx-plugins/enforce-package-structure/components.js); the
design is in [docs/adr/universal-components.md](../../../../docs/adr/universal-components.md).

| Rule | Code | Usual fix |
| --- | --- | --- |
| R1 | `universal-parity` | Export the component from the universal entry on both platforms under one name, or move it to a platform entry (`./web`, `./native`), make it internal, or move it to the app that renders it. |
| R2 | `props-unnamed` | Annotate the first parameter of each implementation with a named props type. |
| R2 | `props-unreadable` | Declare the wrapped function next to the component, or name the props in `forwardRef<Ref, Props>` / `memo<Props>`. |
| R2 | `props-parameter-mismatch`, `props-name-mismatch` | Give both implementations the same props type name. |
| R2 | `contract-not-found`, `contract-reexported`, `contract-outside-package` | Declare the props type in one unsuffixed module of the package, such as `XView.types.ts`, and import it from there in both implementations. |
| R2 | `contract-mismatch` | Make both implementations import the props type from the same contract module. |
| R2 | `contract-suffixed`, `contract-shadowed` | Move the props type out of the `.web` / `.native` module into the unsuffixed contract, and delete the platform-suffixed sibling of that contract. |
| R3 | `contract-platform-import`, `contract-react-type`, `contract-global-type` | Keep `react-native`, `react-dom`, Lumen and DOM types in the implementations. The contract uses only the neutral React types (`ReactNode`, `ComponentType`, ...) listed in `components.config.json`. |
| R3 | `contract-platform-prop` | Remove `className` and `style` from the contract; style inside each implementation. |
| R3 | `contract-gesture-callback` | Name the callback after the user's intent (`onSelectContact`), not the gesture or DOM event (`onPress`, `onClick`, `onChange`). |
| R3 | `platform-prop-tag`, `platform-prop-shape` | Tag a platform-only prop `@platform web` or `@platform native`, make it optional, and type it boolean, number, string or a union of string literals. |
| R4 | `platform-module-export` | Export only components from the platform module: move its props type to the contract and helpers to an unsuffixed module. |
| R5 | `component-in-both-entries` | Export the component from universal entries or from platform entries, not both. |
| R5 | `platform-entry-shared-module`, `platform-entry-unsuffixed` | Point the platform entry at a module of its own with the platform suffix, such as `index.web.ts`, or drop the subpath and move its importers to the universal entry. |

A waiver in `COMPONENT_EXCEPTIONS` that the change makes stale fails as `stale-waiver`: delete it in
the same change.

## lint:tool-config

Rerun one package with `pnpm nx run <project>:lint:tool-config`. Each line starts with the rule
that reported it, one rule per file of
[enforce-tool-config/rules/](../../../../tools/nx-plugins/enforce-tool-config/rules/); the message
says what is wrong, and the rule file shows why. A package carries only what its tool cannot
inherit from its `support/` preset; see [support/README.md](../../../../support/README.md).

| Rule | What it checks | Usual fix |
| --- | --- | --- |
| [`fmt`](../../../../tools/nx-plugins/enforce-tool-config/rules/fmt.mjs) | No oxfmt config in the package and no config flag in its scripts. | Delete the package config and the flag; add a pattern the package needs to `support/fmt/oxfmt.config.mts`, relative to the workspace root. |
| [`lint`](../../../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs) | oxlint configs exist only at layer roots, each re-exporting its `@support/lint` preset; scripts pass no config flag, and rule flags only on the `lint` script, from an allowlist. | Delete a package config and set the rule in the layer's `support/lint` preset. Reduce a layer config to its preset re-export. Drop config flags; move rule flags to the preset, or to the `lint` script when allowlisted. |
| [`tsconfig`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig.mjs) | Every tsconfig parses, extends a `@support/tsconfig` archetype, sets only the options a package may set, repeats nothing it inherits and relaxes no strictness outside [tsconfig-debt.mjs](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs). | Extend the archetype that fits the package before any `lib/build`, `lib/esm` or `lib/tests` mixin. Remove keys the preset owns and repeated options. Fix the code under the preset's strictness; remove debt entries the config no longer needs. |
| [`jest`](../../../../tools/nx-plugins/enforce-tool-config/rules/jest.mjs) | A package that depends on `@support/jest` has a jest config that exports a single preset factory call. | Export one `create*Config(overrides)` call from an `@support/jest/<preset>` in `jest.config.*`. See the `testing` skill. |
