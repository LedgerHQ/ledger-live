# @features/flow-app-unlock

> [!CAUTION]
> **Status: UNSTABLE** — Split out of `@features/flow-app-lock` in [LIVE-38256](https://ledgerhq.atlassian.net/browse/LIVE-38256); API may change.

The app unlock journey for Ledger Wallet Mobile: the screen that stands between a locked app and the
wallet, and the sheet reached from it when the password is forgotten. Each step is a ViewModel → View
pair; the container lives in the app, which owns the verifier, the biometrics prompt and the reset.

## Scope

- `steps/Unlock` — `useUnlockViewModel` and `UnlockView`: the password field, the biometrics retry and
  the splash shown while a biometrics prompt is pending (`isShowingSplash`).
- `steps/Unlock/components/ForgotPasswordSheet` — explains what forgetting the password means and
  leads to the reset.

`PasswordField`, the protection state and the biometrics types come from
[`@features/platform-app-lock`](../../platform/app-lock/README.md).

## Native only

The epic is mobile only, so the package ships no `.web` variants. Tests use the native project of
`@support/jest-features-flow` (`*.native.test.ts(x)`).
