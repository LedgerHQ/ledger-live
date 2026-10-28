---
name: package-public-api
description: |
  A new-architecture package (shared/, domain/, features/) exposes its API through barrels that
  contain nothing but `export *`, and keeps its private code in an internals location.
  Read this when creating a package under shared/, domain/ or features/, when editing any
  `index.*` file, or when a `lint:structure` check fails.
---

# Barrels and internals

An `index.*` file is a **barrel**: a pure regrouping point, nothing else.

```ts
// ✅
export * from "./schema";
export type * from "./types";
export { default } from "./useEnv"; // the one tolerated exception

// ❌  sorting in the export proves ./slice mixes public and private
export { accountNamesSlice, bulkSetAccountNames as setAccountNames } from "./slice";

// ❌  an index that contains code is not an index
export const CurrencySchema = z.discriminatedUnion("type", [...]);
```

**Why the sorting matters.** If you need to pick which names leave a file, that file holds both
public and private code. The fix is never a longer export list — it is moving the private part to
an internals location. `export *` then becomes honest: everything in that file is public.

Enforced by `nx run <project>:lint:structure`
([the plugin](../../../tools/nx-plugins/enforce-package-structure/)), on every `index.*` under
`src/`, at any depth.

The rule follows a file's role, not its name. It follows every relative `export *` from a barrel,
through any number of files, resolved as the web and native bundlers do, and it reads every
source file named in `package.json#exports`, under any condition. Test support entries (a subpath
segment starting with `test` or `mock`) are left out. Such a module may declare
anything, but it re-exports like a barrel: `export *` from a relative file and an optional default
re-export only. So `export * from "./exports"` in the index with the sorting or the proxy in
`exports.ts` fails the same way (`hidden-barrel`, `cross-package-reexport`, …).

## Where a barrel may sit

Under `src/`, an `index.*` (platform variants included) is allowed in three places:

1. **An entry**: `src/index.*`, or the target of a `package.json#exports` entry. Test support
   entries count.
2. **Below an entry through a pure `export *` chain down the folders**: an entry reaches it through
   `export * from "./dir"`. One level below the entry, directly or through plain modules, any
   chain is fine. Deeper, the barrels of every chain to it hold only `export * from "./x"` inside
   their own folder; plain modules on the way do not count. The wording is `BARREL_LOCATION` and
   `CHAIN_BREAKS` in [`rules.js`](../../../tools/nx-plugins/enforce-package-structure/rules.js).
   <!-- rules.js: BARREL_LOCATION, CHAIN_BREAKS -->
   An entry reached from another entry counts from itself, so `jest.native.ts` re-exporting
   `index.native.ts` adds no level, and the entry may hold whatever the barrel rules allow it.
3. **An internals location**: `internals/`, as defined below.

```text
src/
├── index.ts                        # ✅ entry: export * from "./services"; export * from "./hooks";
├── services/index.ts               # ✅ one level below: export * from "./portfolio";
├── services/portfolio/index.ts     # ✅ pure chain: entry → services → services/portfolio
├── hooks/index.ts                  # ✅ one level below, but breaks the chain:
│                                   #    export * from "./useThing"; export * from "../shared";
├── hooks/useThing/index.ts         # ❌ nested-barrel: hooks/index.ts re-exports a path outside its folder
├── internals/index.ts              # ✅ internals location
└── Row/index.ts                    # ❌ orphan-barrel: imported by view.ts, re-exported by no entry
```

**Why.** A barrel only earns its place as the public face of a package or of one part of it. An
orphan is an indirection no consumer sees, and it outlives its entry: drop `"./state"` from
`exports` and `state/index.ts` stays behind as an orphan, so the same check catches it. Depth alone
hides nothing when each sub-domain has its own face and the folders show the chain. A middle
barrel that filters, renames or adds code does: the name a consumer imports is no longer the name
the folders lead to.

**Fix an orphan** (`orphan-barrel`) by asking whether another package uses what it groups:

- **Yes**: expose it with one `export * from "./dir"` line in the root barrel.
- **No**: delete the barrel and import the files directly, or move the folder under `internals/`.
  Expose only code another package imports.

**Fix a nested barrel** (`nested-barrel`) at the barrel the violation names, with its line and
reason. In the tree above, `export * from "../shared"` moves from `hooks/index.ts` to the entry, or
`hooks/index.ts` re-exports `./useThing/useThing` and the nested barrel goes. An `index.tsx` that holds code is a module, not
a barrel: rename it after what it declares (`Card/index.tsx` becomes `Card/Card.tsx`).

Purity of what a barrel reaches stays with the rules above. The debt found when the check landed
sits in
[`intermediate-barrels.js`](../../../tools/nx-plugins/enforce-package-structure/intermediate-barrels.js).
It only shrinks: fixing a listed barrel means deleting its entry, and a test fails on an entry
whose file is gone or allowed. Never add one. Packages with `skip` in `exceptions.js` are not
checked.

## Where private code goes

Three recognised forms, usable at any depth:

| Form | Use for |
| --- | --- |
| `internals/` | a private area with several files |
| `internals.ts` | one private helper in a folder |
| `<name>.internals.ts` | the private half of a file, e.g. `slice.ts` + `slice.internals.ts` |

A barrel must never re-export any of them — that would make private code public and defeat the
point. Everything else can: a test sitting next to `slice.internals.ts` imports it directly, so
private code stays fully testable without being part of the package API.

## Never re-export another package

```ts
// ❌  this package becomes a proxy
export * from "@features/flow-contacts-add-contact";
export { useContacts } from "@features/platform-contacts";
```

Two import paths for the same symbol, and a reader who cannot tell who provides it. Consumers must
import the original provider, and declare the dependency themselves. This holds for `@shared/*`,
`@domain/*`, `@features/*`, `@support/*` and `@ledgerhq/*` alike.

## Universal components

A React component exported from an entry that resolves per platform (a `react-native` condition,
or no condition but different modules on web and native) is universal: it takes one props
contract on both platforms. The [ADR](../../../docs/adr/universal-components.md) holds
the full rules and authoring steps. `lint:structure` checks them as each rule lands; until then,
review checks them.

- **R1 Parity.** Exported on both platforms under the same name.
- **R2 One contract.** `X.web.tsx` and `X.native.tsx` annotate their props with the same type,
  declared in an unsuffixed `X.types.ts` with no `.web` / `.native` sibling.
- **R3 Neutral contract.** No `react-native*`, `@ledgerhq/lumen-ui-*` or `react-dom` import, no DOM
  or native type, no `className` / `style`. Callbacks name the intent (`onOpenContacts`, never
  `onPress` or `onClick`) and receive values, not events. The test id is `testID`. A platform-only
  prop is optional, primitive and tagged `@platform native` or `@platform web`.
- **R4 Types in the contract only.** A `.web` / `.native` module exports its component, nothing else.
- **R5 One entry per component.** A component that cannot be universal goes behind a `./web` or
  `./native` subpath that points at a suffixed module of its own, and is never also exported from a
  universal entry. Only code of that platform imports it.

Scaffold a new one instead of writing it by hand:
`pnpm exec nx g @ledgerhq/generators:universal-component <Name> --project <package root> [--directory <dir under src>]`
writes the contract, both implementations, a test per platform and the barrel lines, without a new
barrel. `--platform-entry web` or `--platform-entry native` writes a platform component behind
`./web` or `./native` instead. See "Authoring a universal component" in the ADR.

**Facade is not proxy.** Wrapping a legacy lib behind a typed API — as `shared/env` does over
`@ledgerhq/live-env` — is legitimate: it owns real code and holds a declared
[`BOUNDARY_EXCEPTION`](../../../tools/nx-plugins/enforce-boundaries/constraints.js). Keeping that
wrapping in a named file rather than the barrel is the cheapest way to stay conformant; `shared/env`
instead carries a **temporary** `skip` in
[`exceptions.js`](../../../tools/nx-plugins/enforce-package-structure/exceptions.js). Entries there
are team decisions with an exit condition, not a way around a failing check — never add one to make
your own package pass. Its `FILE_EXCEPTIONS` lists the reached modules that held violations when
the rule started following `export *`. That list only shrinks: a test fails on an entry whose file
is gone or clean, so fixing a file means deleting its entry.

## Traps

- **`export *` does not propagate a rename.** `export { bulkSetAccountNames as setAccountNames }`
  cannot become `export *`. Rename at the source and update the callers, so one thing has one name.
- **`export *` does not propagate a default either.** Only the re-export form
  (`export { default } from "./x"`) is tolerated in a barrel. A local `export default myThing`
  needs an `import` above it, which is code in an index — extract it.
- **A package can have several barrels.** With a `react-native` condition in `exports`, both
  `index.ts` and `index.native.ts` are barrels and both must stay pure.
- **An `index.*` holding code is not an index.** Move the code to a named file
  (`useEnv.ts`, `schema.ts`, `CardLogin.web.tsx`) and leave `export * from "./thatFile"` behind.
  Import paths for consumers do not change.
- **A folder holding only `index.ts` should not be a folder.** `definitions/team-qaa/index.ts`
  becomes `definitions/team-qaa.ts`: same import specifier, one less file, no barrel to keep pure.

## New package

Start conformant, it costs nothing:

```text
src/
├── index.ts          # export * from "./schema";
├── schema.ts
├── schema.test.ts
└── internals.ts      # whatever schema.ts should not expose
```

See [structure-flow](../structure-flow/SKILL.md) for where the package itself belongs.

## Reviewing

Refuse and point here when you see:

- a named re-export (`export { a, b } from "./x"`) in any `index.*`, or in a file it reaches
  through `export *`, or in a file named in `package.json#exports`
- an `import`, a declaration or a local `export default` in any `index.*`
- `export * as ns from` — namespacing is still sorting
- a barrel re-exporting `internals`, or re-exporting another workspace package
- a new `index.*` below `src/` that no entry re-exports, or that a barrel below an entry re-exports
