# Architecture lint fixes

The usual fix for each code that `pnpm lint:arch` reports. The checks live in
`tools/nx-plugins/enforce-boundaries/`, `tools/nx-plugins/enforce-package-structure/` and
`tools/nx-plugins/enforce-tool-config/`.

Fix the code. The exception and waiver lists of those plugins record debt that only shrinks: a new
entry needs a reason, an exit condition and the plugin owners' review, and comes after the code
fix was ruled out.

## lint:boundaries

Rerun with `pnpm lint:boundaries`. Each kind of violation prints its own heading.

| Heading | Meaning | Usual fix |
| --- | --- | --- |
| `module-boundary violation` | A project depends on a project its tags do not allow, printed as `source [tags] → target [tags]`. Allowed edges are in `constraints.js`: `shared` reaches `shared`; `domain` adds `domain`; `features` adds `features`; `type:domain-entity` reaches no `domain/api`; `type:feature-platform` reaches no flow; `support` reaches `support` and `shared` only. | Move the code to the lowest layer both sides may depend on, or invert the dependency: the lower package exposes a port and the app or a higher package provides it. Place it with the `structure-flow` skill. |
| `legacy source-import violation` | A file under `shared/`, `domain/` or `features/` imports a legacy `@ledgerhq/*` package (`libs/`, or one listed in `LEGACY_PACKAGES`) or reaches into `libs/` with a relative path. | Import the layer replacement, such as `@domain/entity-contact` or `@shared/schema-primitives`. If none exists, move the needed code into a layer package first; follow the `legacy-migration` skill. |
| `banned-external violation` | A tagged package declares or imports a third-party package its tag bans: a `domain/entity` package uses `react` or `react-native`. | Keep schemas, types and state in the entity. Put hooks in `domain/api` (it may expose RTK Query hooks) and UI in `features/` or `shared/ui-*`. |
| `banned-dependency violation` | A manifest declares a package no workspace may depend on, with the reason printed. | Remove the dependency and use the replacement the reason names. |

## lint:structure

Rerun one package with `pnpm nx run <project>:lint:structure`. The barrel codes apply to every
package of `shared/`, `domain/` and `features/`; the public API rules are in the
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

These rules hold for a package with web and native implementations of a component. The design is
in [docs/adr/universal-components.md](../../../../docs/adr/universal-components.md).

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

Rerun one package with `pnpm nx run <project>:lint:tool-config`. Each line is printed as
`[rule] file: message`. A package carries only what its tool cannot inherit from its `support/`
preset; see [support/README.md](../../../../support/README.md).

| Rule | Message | Usual fix |
| --- | --- | --- |
| `fmt` | `oxfmt config outside support/fmt` | Delete the package config; add a pattern the package needs to `support/fmt/oxfmt.config.mts`, relative to the workspace root. |
| `fmt` | `script "..." passes a config to oxfmt` | Drop the config flag; oxfmt finds the repository config. |
| `lint` | `oxlint config outside a layer root` | Delete it; set the rule in the layer's `support/lint` preset. |
| `lint` | `layer config missing` | Restore it as the printed `export { default } from "@support/lint/<preset>";`. |
| `lint` | `a layer config only re-exports its preset` | Reduce the layer config to that one re-export. |
| `lint` | `script "..." passes a config to oxlint` | Drop the flag; oxlint finds the layer config. |
| `lint` | `script "..." sets ...: rule flags go on the "lint" script only`, `... not in the allowlist` | Move the rule to the layer preset, or onto the `lint` script if it is allowlisted. |
| `tsconfig` | `must extend a @support/tsconfig preset`, `inherits no ... archetype` | Extend the archetype that fits the package before any `lib/build`, `lib/esm` or `lib/tests` mixin. |
| `tsconfig` | `"<key>" is not allowed in a package tsconfig`, `compilerOptions.<key> belongs to a preset` | Remove the key and extend the preset that sets it. |
| `tsconfig` | `repeats what the config inherits` | Remove the repeated option. |
| `tsconfig` | `may only relax the preset`, `relaxes the strictness of its preset` | Fix the code under the preset's strictness. A relaxation that must stay goes in the debt file the message names. |
| `tsconfig` | `lists ..., which does not exist`, `which the config no longer relaxes` | Remove the stale debt entry. |
| `tsconfig` | `cannot be parsed`, `does not resolve` | Fix the JSON or the `extends` path. |
| `jest` | `has no jest config built by one of its presets`, `exports no config`, `exports something other than a single config` | Export one `create*Config(overrides)` call from an `@support/jest/<preset>` in `jest.config.*`. See the `testing` skill. |
