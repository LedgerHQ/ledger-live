# @features/flow-app-lock

> [!CAUTION]
> **Status: UNSTABLE** — the public API grows with each ticket of the epic.

Flow package hosting the app lock experience for Ledger Wallet Mobile, each screen as a
container → ViewModel → View triplet, the container living in the app.

## Scope

What it holds today, from [LIVE-35961](https://ledgerhq.atlassian.net/browse/LIVE-35961):

- `components/PasswordField` — the one password input every password surface uses, so the label,
  the reveal toggle and the error treatment cannot drift between them.
- `screens/SetupPassword` and `screens/ConfirmPassword` — the two steps of adding a password.
- `state/passwordDraft` — carries the chosen password from the first step to the second in a ref,
  deliberately not in navigation state, which is serialisable and gets persisted.

**Unlock**, **DeactivatePassword** and the migration views arrive with their own tickets.

Protection state, the biometrics status unions and the errors come from
[`@features/platform-app-lock`](../../platform/app-lock/README.md); the password verifier and its
constant-time comparison come from [`@shared/password-verifier`](../../../shared/password-verifier/README.md).

## Native only

The epic is mobile only — desktop is out of scope in the product spec — so this package ships **no**
`.web.tsx` variants and no web stubs. There are no `.web` / `.native` suffixes at all: plain
`.ts` / `.tsx` files behind a single `src/index.ts` barrel. The flow-layer convention reserves those
suffixes for genuinely platform-split files, and with one platform they would be machinery for
nothing. This differs from `features/flow/pay-card-auth`, which is cross-platform and therefore
carries `index.tsx` / `index.native.tsx` pairs plus `src/index.native.ts`.

If desktop ever needs this flow, introducing the split then is a mechanical rename.

For the same reason there is no `tsconfig.test.json`: in the cross-platform packages it exists only
to strip the other platform's files from the typecheck, and here `tsconfig.json` already covers
`src/**/*`.

Tests use the shared `@support/jest-features-flow` config, whose native project selects
`*.native.test.tsx`. That suffix is a jest project selector on **test** files, not a platform split
of source files.

## Structure

Today:

```text
src/
├── components/PasswordField/   # shared by every password screen
├── screens/ConfirmPassword/
├── screens/SetupPassword/
├── state/passwordDraft.tsx
└── index.ts                    # Public API
```

Target, as the remaining tickets land:

```text
src/
├── components/                 # shared by several views
├── hooks/
├── screens/<Name>/             # Unlock, SetupPassword, Confirm, Migration
│   ├── components/             # used only by this view
│   ├── viewModel.ts
│   ├── view.tsx
│   ├── view.native.test.tsx
│   └── index.ts
├── state/
└── index.ts
```

**`screens/`, not `steps/`.** Both appear in the repo, so this is settled here to save the next
ticket the decision. The [architecture guideline](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117)
names the folder `screens/`, and peer practice follows it 3:1 —
`flow-contacts-add-contact`, `flow-contacts-introduction` and `large-screen-upsell` use `screens/`,
only `features/flow/contacts` uses `steps/`. The `<Name>/` nesting comes from those packages rather
than from the guideline, whose example omits it because it shows a single-view flow.

Note that the `ddd-structure-flow` skill documents `steps/<StepName>/` while citing that guideline as
its upstream source — the two disagree, and the skill is the minority. Worth reconciling in the docs
rather than per package.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
