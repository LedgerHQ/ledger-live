---
name: coin-families-contract
description: |
  Coin-specific families logic must live in families/.
  Generic UI uses the families contract only (no if (family === "evm") in shared code).
  Use when working in "**/families/**", "**/mvvm/**", "**/renderer/**" and "**/screens/**".
---

# Coin families contract (Desktop & Mobile UI)

**Principle:** Coin-specific UI and behavior must live in **families/**. Generic screens, hooks, and components **must not** branch on `family === "evm"` (or any family name). They must use the **families contract**: optional slots defined in the family type, implemented per family, and consumed via a single lookup (e.g. `useLLDCoinFamily(currency.family).SlotName`). This keeps generic code family-agnostic and supports **modularisation and lazy loading**.

## Do not do (anti-patterns)

- **Generic code** (outside `families/<family>/`):
  - `if (currency.family === "evm")` / `if (transaction.family === "solana")` to render or behave differently.
  - Coin-specific hooks or logic in shared ViewModels / screens (e.g. Canton onboarding branch inside a generic Scan Device VM).
  - Importing a specific coin module (e.g. `@ledgerhq/coin-canton`) in generic UI to branch on that coin.
  - Importing a live-signer, a device signer kit or wallet-btc (`@ledgerhq/live-signer-*`, `@ledgerhq/device-signer-kit-*`, `@ledgerhq/wallet-btc`) in generic UI. The `coin-families/no-coin-specific-import` lint rule reports them like a coin module.
- **Exception:** Type-narrowing inside a **family folder** (e.g. `invariant(transaction.family === "bitcoin", "...")` in `families/bitcoin/`) is acceptable; the rule applies to **generic** (shared) code only.

## Do (correct pattern)

1. **Define a slot on the contract**

   - **Desktop:** Add an optional property to `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts` (e.g. `NoAssociatedAccounts?: React.ComponentType<...>`).
   - **Mobile:** Use the same idea: a typed contract (or generated map like `noAssociatedAccountsByFamily`) that families can optionally fill.

2. **Implement only in the family**

   - Put the component or logic in `families/<family>/` (e.g. `families/hedera/NoAssociatedAccounts.tsx`) and add it to the family object (Desktop: the default export of `families/<family>/index.ts`, loaded on demand through `loaders.ts`; Mobile: in the generated aggregation if applicable).

3. **Use the contract in generic code**
   - Generic code looks up by family and uses the slot if present, with **no** `if (family === "hedera")`:
   - **Desktop:** `useLLDCoinFamily(currency.family).NoAssociatedAccounts` → use it when defined. The hook lives in `apps/ledger-live-desktop/src/renderer/families/useLLDCoinFamily.ts` and is imported from `~/renderer/families`. It suspends while the family chunk loads, so it needs a `<Suspense>` boundary above it. Outside React, `importLLDCoinFamily(name)` from the same module returns a promise.
   - **Mobile:** e.g. `getCustomNoAssociatedAccounts(currency)` returning a component from a family map, then pass it to the screen (e.g. as `CustomNoAssociatedAccounts` in route params).

## Reference example: Scan Device "no associated accounts"

- **Contract (Desktop):**  
  `apps/ledger-live-desktop/src/renderer/families/types.ts` — `NoAssociatedAccounts?: React.ComponentType<AddAccountsStepProps>` on `LLDCoinFamily`.
- **Family implementation:**  
  `apps/ledger-live-desktop/src/renderer/families/hedera/NoAssociatedAccounts.tsx` and `hedera/index.ts` exporting it in the family object.
- **Generic usage (Desktop):**  
  `apps/ledger-live-desktop/src/mvvm/features/AddAccountDrawer/screens/ScanAccounts/useScanAccounts.ts`: `useLLDCoinFamily(currency.family).NoAssociatedAccounts`, with no Hedera-specific branch.
- **Generic usage (Mobile):**  
  `useScanDeviceAccountsViewModel.ts`: `getCustomNoAssociatedAccounts(currency)` from `~/generated/NoAssociatedAccounts`; result passed as `CustomNoAssociatedAccounts` to the NoAssociatedAccounts screen. No `if (family === "hedera")` in the VM.

When you need **new** coin-specific behavior in a generic flow (e.g. post-add-account navigation, custom empty state): **extend the contract** (add a new optional slot and document it), implement it in the relevant family folder, and have the generic code only read from the contract. Do not add new `if (family === "…")` branches in shared UI.

## Lint guardrails

Three rules of `@support/lint` keep generic code on the contract: `coin-families/no-coin-specific-import`, `no-family-branch` and `no-currency-id-branch`. Their shapes and blind spots (maps keyed by family, lists imported from another module, duck typing) are in the [support/lint README](../../../support/lint/README.md#coin-familiesno-coin-specific-import); a currency-id check is rule D, not a family check.

- **The baseline only shrinks.** Violations that existed are in `oxlint-suppressions.json` of each app. Never add one: fix the leak, then run `pnpm exec oxlint ... --prune-suppressions` from the app folder (commands in the [Desktop](../../../apps/ledger-live-desktop/docs/lint.md) and [Mobile](../../../apps/ledger-live-mobile/docs/lint.md) lint docs).
- **No inline disable.** `pnpm lint:coin-families-disables` rejects `oxlint-disable` and `eslint-disable` comments that name these rules.
- **A file that stays on purpose is an exception**, with its reason and owner in `coin-families-exceptions.json` of the app (Desktop: Electron process plumbing for the Zcash native host, which lives outside `families/`). `pnpm lint:coin-families-exceptions` keeps that file from going stale. Add an entry only for a reason that is not a plan to move the code.
- **The slots** are the optional properties of the contract: `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts` for Desktop, the files of `apps/ledger-live-mobile/src/generated/` for Mobile. Read them there rather than from a list.

## Paths

- **Desktop:** `apps/ledger-live-desktop/src/renderer/families/`: contract in `types.ts`, implementations per family, one dynamic import per family in `loaders.ts`, lookup through `useLLDCoinFamily`; generic code under `renderer/`, `mvvm/`.
- **Mobile:** `apps/ledger-live-mobile/src/families/` — family-specific UI and flows; generic code under `mvvm/`, `screens/`. Use generated maps or a small helper (e.g. `getCustomNoAssociatedAccounts`) so generic code never branches on family name.
