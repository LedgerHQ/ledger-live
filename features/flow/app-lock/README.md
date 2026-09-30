# @features/flow-app-lock

> [!CAUTION]
> **Status: UNSTABLE** — the public API grows with each ticket of the epic.

Flow package hosting the app lock experience for Ledger Wallet Mobile, each screen as a
container → ViewModel → View triplet, the container living in the app.

## Scope

What it holds today, from [LIVE-35961](https://ledgerhq.atlassian.net/browse/LIVE-35961):

- `longerPassword` — the mandatory change of a password shorter than the minimum, built on the
  password setup steps.
- `protectionPrompt` and the sheets around the protection journeys.

The unlock journey lives in [`@features/flow-app-unlock`](../app-unlock/README.md), the password
setup steps in [`@features/flow-app-password-setup`](../app-password-setup/README.md) and the
password removal in [`@features/flow-app-password-removal`](../app-password-removal/README.md); the
rest of this package moves to one package per journey in the tasks of
[LIVE-35505](https://ledgerhq.atlassian.net/browse/LIVE-35505).

`PasswordField` and the password draft come from
[`@features/platform-app-lock`](../../platform/app-lock/README.md), along with the protection
state, the biometrics status unions and the errors; the password verifier and its
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
├── components/                 # the protection sheets
├── longerPassword/
├── protectionPrompt/
└── index.ts                    # Public API
```

Target, as the remaining tickets land:

```text
src/
├── components/                 # shared by several views
├── hooks/
├── screens/<Name>/             # SetupPassword, Confirm, Migration
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

Note that the `structure-flow` skill documents `steps/<StepName>/` while citing that guideline as
its upstream source — the two disagree, and the skill is the minority. Worth reconciling in the docs
rather than per package.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
