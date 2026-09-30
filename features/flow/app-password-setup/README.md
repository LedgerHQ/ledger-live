# @features/flow-app-password-setup

> [!CAUTION]
> **Status: UNSTABLE** — Split out of `@features/flow-app-lock` in [LIVE-38257](https://ledgerhq.atlassian.net/browse/LIVE-38257); API may change.

The app password setup journey for Ledger Wallet Mobile: choosing a password, then confirming it.
Each step is a ViewModel → View pair; the containers live in the app, which stores the verifier and
decides where the journey starts from (Settings or the Card protection prompt).

## Scope

- `steps/SetupPassword` — `useSetupPasswordViewModel` and `SetupPasswordView`: enforces the minimum
  length before the chosen password is written to the draft.
- `steps/ConfirmPassword` — `useConfirmPasswordViewModel` and `ConfirmPasswordView`: checks the
  second entry against the draft and hands the password on once they match.

The longer-password journey reuses both steps. `PasswordField`, the password draft and the length
rule come from [`@features/platform-app-lock`](../../platform/app-lock/README.md).

## Native only

The epic is mobile only, so the package ships no `.web` variants. Tests use the native project of
`@support/jest-features-flow` (`*.native.test.ts(x)`).
