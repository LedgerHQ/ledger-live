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

A React component exported from an entry with a `react-native` condition is universal: it takes
one props contract on both platforms. The [ADR](../../../docs/adr/universal-components.md) holds
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
