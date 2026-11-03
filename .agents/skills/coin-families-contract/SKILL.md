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

## Account Detail section

The new Account Detail page (flag `accountDetail`) has one coin slot, `AccountDetailSection`. It replaces every legacy account block on that page: `AccountSubHeader`, `AccountBodyHeader`, `AccountBalanceSummaryFooter`, `PendingTransferProposals`, `AccountHeader`, `AccountBalanceHeader`, and the transitional `AccountDetailDelegations` / `AccountDetailBalanceSummary`. The legacy account page keeps those blocks. A family without `AccountDetailSection` stays on the legacy blocks.

**Props** (both apps): `{ account: A | TokenAccount; parentAccount?: A | null }`. The page passes the account it shows. The section reads balances, emptiness, currency config and discreet mode itself.

**Shape.** One component per family, MVVM: a container, a `useAccountDetailSectionViewModel`, and a view that only renders props. UI is Lumen only (`@ledgerhq/lumen-ui-react` on desktop, `@ledgerhq/lumen-ui-rnative` on mobile), or a Lumen feature package such as `@features/flow-account-detail-delegations`. Stake, claim and the other manage actions render inside the section. They are not lifted to the page header.

**Desktop.** Optional `AccountDetailSection` on `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts`. Export it from `families/<family>/index.ts`. The page reads it through `useLLDCoinFamily` and, when set, renders it instead of the legacy blocks.

**Mobile.** Add `families/<family>/AccountDetailSection.tsx` (default export, file name starts with `AccountDetailSection`). `scripts/sync-families-dispatch.mjs` aggregates it into `generated/AccountDetailSection.ts`. The page renders that entry instead of the legacy maps.

**Reference.** Solana (`families/solana/AccountDetailSection`) composes the balance summary and the delegations, and hides both for an empty account the way the page used to. Its stake actions stay on the delegations block. Copy that shape for the next family. Leave every other family on the legacy blocks until its own migration.

## Paths

- **Desktop:** `apps/ledger-live-desktop/src/renderer/families/`: contract in `types.ts`, implementations per family, one dynamic import per family in `loaders.ts`, lookup through `useLLDCoinFamily`; generic code under `renderer/`, `mvvm/`.
- **Mobile:** `apps/ledger-live-mobile/src/families/` — family-specific UI and flows; generic code under `mvvm/`, `screens/`. Use generated maps or a small helper (e.g. `getCustomNoAssociatedAccounts`) so generic code never branches on family name.
