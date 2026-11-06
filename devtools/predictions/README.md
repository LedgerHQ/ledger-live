# @devtools/predictions

The Predictions DevTool, to test the Predictions onboarding again without wiping Ledger Wallet, and to preview the trading wallet setup without a device or MoonPay.

## What it shows

- **Onboarding**: whether Ledger Wallet's intro was seen (`@domain/entity-predictions`), with a button to show it again or mark it as seen.
- **Each environment of the live app** (Production `predictions-live-app`, Staging `predictions-live-app-stg`): the accepted document versions, every linked address (active, bound or not), and the stored `onboarding-state` as is, to copy.

## What it does

Per environment, from the least to the most:

- **Unbind the active account**: the address stays, unbound. The next open asks only for the "Confirm account ownership" signature.
- **Forget the accounts**: the next open goes back to the account picker and the binding.
- **Forget the accepted documents**: the next open shows the onboarding sheet again, without the intro.
- **Forget everything**: the next open is a first open.

**Replay the whole onboarding** forgets the intro and everything every environment stored. The live app reads its state when it opens, so close and reopen Predictions after a reset.

**Trading wallet setup** opens Ledger Wallet's setup sheet as after a binding: loading only, or with an outcome (created, found, or each failure reason), shown once the loading has been on screen long enough.

## Props contract

`PredictionsToolProps` in `src/types.ts`. The host builds them with `usePredictionsToolProps(liveAppStore, setup)` from `@devtools/bindings`, passing the live apps' Wallet API storage and its trading wallet setup (`usePredictionsSetupHooks()` and the failure reasons). That hook is the only place that knows the live app's stored format.

## Imports

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see
[devtools-import-boundary](../../.agents/skills/devtools-import-boundary/SKILL.md).
