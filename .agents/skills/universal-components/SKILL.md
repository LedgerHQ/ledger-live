---
name: universal-components
description: |
  Give each public React component of a dual-platform package one shape (logic only, universal
  or platform entry) and a universal one a single props contract `X.types.ts`, as
  `lint:structure` checks with rules R1 to R5. Use when writing or reviewing `*.web.tsx`,
  `*.native.tsx` or `*.types.ts` under `shared/`, `domain/` or `features/`, when adding a `./web`
  or `./native` subpath, or when `lint:structure` reports R1 to R5 or a stale waiver.
---

# Universal components

A package whose entries resolve per platform (a `react-native` condition, a `./web` or `./native`
subpath, or `.web` / `.native` files behind an entry) is dual-platform. Each component its
`package.json#exports` reaches takes one props API on both platforms, or names its platform in
the import path. The [ADR](../../../docs/adr/universal-components.md) holds the reasoning; this
skill holds the rules you write against. Internal components, single-platform packages and test
support entries (a subpath segment starting with `test` or `mock`) are out of scope.

## Pick the shape first

| Shape | When | Entry | Example |
| --- | --- | --- | --- |
| **Logic only** | The entry exports hooks, view models, selectors, no component | any entry, no contract: R1 to R4 find nothing to check | `.` of `@features/flow-lazy-onboarding-banner` |
| **Universal** (default) | Both platforms need it and every prop it needs has a neutral type | universal entry, one contract, R1 to R5 | `ContactAvatar` in `@features/platform-contacts` |
| **Platform entry** | One platform needs it, or a prop it cannot work without has no neutral type (a surface style, a bundler asset) | `./native` and/or `./web` alone, R5 only | `@shared/lottie`; `./native` of `@features/flow-pay-card-widget` |

A platform entry is an exit for a component that cannot be universal, not a way around the
contract. An awkward prop is not a reason: keep the quirk in the implementation, or add an
optional `@platform` prop (R3).

## Scaffold, do not hand-write

```sh
pnpm exec nx g @ledgerhq/generators:universal-component <Name> \
  --project features/platform/contacts --directory components/<Name>
```

`--directory` is relative to `src/`.

It writes the contract with a `testID` prop, both implementations, a test per platform and the
two barrel lines, in the barrel the entries already reach, never a new one. `--platform-entry web`
or `--platform-entry native` writes a platform component behind `./web` or `./native` instead,
and adds the subpath when it is missing. It refuses a name an entry already exports.

## The contract `X.types.ts`

```text
components/ContactAvatar/
├── ContactAvatar.types.ts   # export type ContactAvatarProps = Readonly<{ … }>
├── ContactAvatar.web.tsx    # export function ContactAvatar(props: ContactAvatarProps)
├── ContactAvatar.native.tsx # same name, same annotation
└── index.ts                 # export * from "./ContactAvatar";
                             # export type * from "./ContactAvatar.types";
```

```ts
// features/platform/contacts/src/components/ContactAvatar/ContactAvatar.types.ts
import type { ContactId } from "@domain/entity-contact";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  isMe: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** @platform web Hides a decorative avatar from assistive technologies. */
  ariaHidden?: boolean;
  testID?: string;
}>;
```

Each implementation maps the contract onto Lumen in one line per prop: `testID` to `data-testid`
on web, an intent callback to `onClick` on web and `onPress` on native. How to use Lumen itself is
in [ldls-web](../ldls-web/SKILL.md) and [ldls-native](../ldls-native/SKILL.md).

## R1 to R5, linted

`pnpm exec nx run <project>:lint:structure` checks all five on every package under `shared/`,
`domain/` and `features/`, and CI blocks on it. The rules are stated in the
[ADR's decision](../../../docs/adr/universal-components.md#decision); in short:

- **R1 Parity.** Exported on both platforms under the same name.
- **R2 One contract.** Both implementations take the same props type from one `X.types.ts`.
- **R3 Neutral contract.** The contract names no platform type, prop or gesture.
- **R4 Types in the contract only.** A `.web` / `.native` module exports its component alone.
- **R5 One entry per component.** Universal entries or platform entries, never both. The import
  side is the `suffix-imports/no-platform-suffix` rule of
  [`@support/lint`](../../../support/lint/README.md).

Each failure prints the rule and a message. [references/rules.md](references/rules.md) maps each
code to its fix and lists [what R3 follows](references/rules.md#what-r3-follows) and what it
leaves to review.

## Review-only checks

The linter reads names and modules, not intent. A reviewer checks these four:

1. **Untagged platform-only prop.** A prop that only one implementation reads must carry
   `@platform web` or `@platform native`. Untagged, it passes the lint. It belongs in the
   contract only when the caller alone knows its value: a native bottom inset the implementation
   can read with `useSafeAreaInsets()` stays inside it.
2. **The outnumber heuristic.** When `@platform` props outnumber the shared ones, the component is
   not universal: move it to platform entries.
3. **A real intent name.** `onAction` passes the gesture check yet says nothing. The name states
   what the user wants, plus an object when the component exposes several actions or the verb
   alone is ambiguous (`onEdit`, `onOpenContacts`, `onSelectAddress`).
4. **An earned platform entry.** The linter checks that a component has one entry, not that it
   needed a platform one. Ask whether a neutral contract was possible.

## Clearing a waiver

Existing violations are waived in
[exceptions.js](../../../tools/nx-plugins/enforce-package-structure/exceptions.js), per package
root, then per component name or, for an R5 entry check, per subpath (`"./native"`), each with the
rules it waives. The list only shrinks.

1. Fix the component until it meets the waived rule.
2. In the same change, remove that rule from the component's waiver; delete the component when
   no rule is left, and the package when it has no component left.
3. Run `lint:structure` on the package. A waiver that matches no violation fails as
   `stale-waiver`, so a fix that leaves its waiver behind does not pass.

Never add a waiver for new code: a new component conforms from the start.

## Related

- [package-public-api](../package-public-api/SKILL.md): barrels and internals, the other half of
  `lint:structure`.
- [structure-flow](../structure-flow/SKILL.md): which layer a package belongs in.
- [flow-package](../flow-package/SKILL.md): `useXViewModel.ts` plus `XView.web.tsx` /
  `XView.native.tsx` inside a flow.
