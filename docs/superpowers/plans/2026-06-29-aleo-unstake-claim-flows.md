# Aleo Unstake & Claim Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Aleo `unbond_public` (Unstake) and `claim_unbond_public` (Claim) operations end-to-end — coin-module transaction modes plus desktop UI — reachable through a new Celo-style Manage hub modal.

**Architecture:** Two new `TRANSACTION_TYPE` values are threaded through every place `bond_public` is handled in `coin-aleo` (constants, types, logic mappings, serialization, prepare, status, device config). In the desktop app, a new `ManageModal` hub replaces the direct "Stake" header button and launches three self-contained Stepper modals: the existing `BondPublicFlowModal`, plus new `UnbondFlowModal` and `ClaimUnbondFlowModal`.

**Tech Stack:** TypeScript, React, Redux, Jest, the Ledger coin-module framework, BigNumber.js.

## Global Constraints

- **Desktop only.** No `ledger-live-mobile` changes.
- **No staking-balance data.** Do NOT add fields to `AleoResources` or touch sync. Consequences, enforced everywhere:
  - Unstake = free amount input, validate `amount > 0` only. No Max button. No bonded ceiling. No min-bond remainder check.
  - Manage hub shows Stake / Unstake / Claim all **always enabled** (no gating).
  - Claim = no amount displayed; submits `claim_unbond_public(staker)`.
  - Where the existing bond code does balance/gating logic, leave a `// TODO(LIVE-29195): gate on bonded/unbond data when staking balances land` comment.
- **Recipient semantics:** unbond/claim act on the staker (self). The flows seed `recipient = mainAccount.freshAddress`; status validation must treat these modes as self-recipient (no `RecipientRequired`).
- **Claim has no amount:** `amount` stays `0`; status validation must NOT raise `AmountRequired` for claim.
- **OPEN EXTERNAL DEPENDENCY — remote SDK intent contract.** Aleo crafting delegates to the remote SDK endpoint `POST {sdkUrl}/transactions/request` (see `network/sdk.ts#createRequestFromIntent`). The exact JSON shape for the `unbond_public` / `claim_unbond_public` intents (field names like `staker`/`amount`) MUST be confirmed against that SDK before merge. This plan defines the intent shapes by analogy to `bond_public`; if the SDK expects different field names, update Task 3's intent objects and their tests to match. Treat the field names in Task 3 as the single source of truth to reconcile.
- **Exact mode string values:** `unbond_public` and `claim_unbond_public` (snake_case, matching the on-chain credits.aleo function names and the existing `bond_public` convention).
- Commit after each task. Branch is `wip/bd/LIVE-29195`; do not create a new branch.

---

## File Structure

**Coin module — `libs/coin-modules/coin-aleo/src/`:**
- `constants.ts` — add two `TRANSACTION_TYPE` entries (Task 1)
- `logic/utils.ts` — `isPublicTransaction`, `getAvailableBalance`, `mapTransactionIntentToSdkIntent`, `buildTransactionIntent`, function-name mapping (Tasks 1, 3)
- `types/bridge.ts` — `Transaction` + `TransactionRaw` variants (Task 2)
- `types/sdk.ts` — `Intent` union additions (Task 3)
- `types/logic.ts` — `AleoTransactionIntentData` additions (Task 3)
- `bridge/transaction.ts` — raw↔tx serialization (Task 2)
- `bridge/prepareTransaction.ts` — unbond/claim branches (Task 4)
- `bridge/getTransactionStatus.ts` — validation (Task 5)
- `deviceTransactionConfig.ts` — device labels (Task 6)

**Desktop — `apps/ledger-live-desktop/src/renderer/families/`:**
- `aleo/constants.ts` — `AleoCustomModal` enum (Task 7)
- `modals-loaders.ts` — registry (Task 7)
- `aleo/index.ts` — `modalsToPreload` (Task 7)
- `aleo/ManageModal/` — hub (Task 8)
- `aleo/UnbondFlowModal/` — unstake flow (Task 9)
- `aleo/ClaimUnbondFlowModal/` — claim flow (Task 10)
- `aleo/AccountHeaderManageActions.tsx` + `.test.tsx` — rewire to Manage (Task 11)
- `static/i18n/en/app.json` + changeset (Task 12)

---

## Task 1: Add transaction modes + classification

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/constants.ts`
- Modify: `libs/coin-modules/coin-aleo/src/logic/utils.ts`
- Test: `libs/coin-modules/coin-aleo/src/logic/utils.test.ts`

**Interfaces:**
- Produces: `TRANSACTION_TYPE.UNBOND_PUBLIC === "unbond_public"`, `TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC === "claim_unbond_public"`. Both classify as public transactions; `getAvailableBalance` returns the public `transparentBalance` for them.

- [ ] **Step 1: Write failing tests** in `logic/utils.test.ts` (append near other `isPublicTransaction`/`getAvailableBalance` tests):

```ts
import { TRANSACTION_TYPE } from "../constants";
import { isPublicTransaction, getAvailableBalance } from "./utils";

describe("unbond/claim classification", () => {
  it("treats unbond_public and claim_unbond_public as public transactions", () => {
    const base = { family: "aleo", amount: new BigNumber(0), recipient: "", fees: new BigNumber(0) } as const;
    expect(isPublicTransaction({ ...base, mode: TRANSACTION_TYPE.UNBOND_PUBLIC })).toBe(true);
    expect(isPublicTransaction({ ...base, mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC })).toBe(true);
  });

  it("uses the public transparent balance for unbond/claim available balance", () => {
    const account = {
      aleoResources: { transparentBalance: new BigNumber(500) },
    } as unknown as Parameters<typeof getAvailableBalance>[0];
    const base = { family: "aleo", amount: new BigNumber(0), recipient: "", fees: new BigNumber(0) } as const;
    expect(getAvailableBalance(account, { ...base, mode: TRANSACTION_TYPE.UNBOND_PUBLIC }).toString()).toBe("500");
    expect(getAvailableBalance(account, { ...base, mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC }).toString()).toBe("500");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/logic/utils.test.ts -t "unbond/claim classification"`
Expected: FAIL — `UNBOND_PUBLIC` is `undefined`.

- [ ] **Step 3: Add the modes** to `constants.ts` `TRANSACTION_TYPE` (after `BOND_PUBLIC: "bond_public"`):

```ts
  BOND_PUBLIC: "bond_public",
  UNBOND_PUBLIC: "unbond_public",
  CLAIM_UNBOND_PUBLIC: "claim_unbond_public",
} as const;
```

- [ ] **Step 4: Extend `isPublicTransaction`** in `logic/utils.ts`:

```ts
export function isPublicTransaction(transaction: Transaction): transaction is TransactionPublic {
  return (
    transaction.mode === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.mode === TRANSACTION_TYPE.TRANSFER_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC ||
    isPublicTokenTransaction(transaction)
  );
}
```

- [ ] **Step 5: Extend `getAvailableBalance`** — add the two modes to the existing public-native-balance case:

```ts
    case TRANSACTION_TYPE.TRANSFER_PUBLIC:
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE:
    case TRANSACTION_TYPE.BOND_PUBLIC:
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return account.aleoResources?.transparentBalance ?? new BigNumber(0);
```

- [ ] **Step 6: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/logic/utils.test.ts -t "unbond/claim classification"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/constants.ts libs/coin-modules/coin-aleo/src/logic/utils.ts libs/coin-modules/coin-aleo/src/logic/utils.test.ts
git commit -m "feat(coin-aleo): add unbond_public & claim_unbond_public transaction modes"
```

---

## Task 2: Transaction types + raw↔tx serialization

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/types/bridge.ts`
- Modify: `libs/coin-modules/coin-aleo/src/bridge/transaction.ts`
- Test: `libs/coin-modules/coin-aleo/src/bridge/transaction.test.ts`

**Interfaces:**
- Produces: `Transaction` and `TransactionRaw` each gain two variants — `unbond_public` and `claim_unbond_public`, both with `properties?: never` and no extra fields beyond the common transaction shape (amount/recipient/fees live on the common base). `fromTransactionRaw`/`toTransactionRaw` round-trip them.

- [ ] **Step 1: Write failing round-trip test** in `bridge/transaction.test.ts`:

```ts
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import { TRANSACTION_TYPE } from "../constants";

describe("unbond/claim serialization", () => {
  it.each([TRANSACTION_TYPE.UNBOND_PUBLIC, TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC])(
    "round-trips %s without extra fields",
    mode => {
      const raw = {
        family: "aleo" as const,
        recipient: "aleo1stakeraddr",
        amount: "1000000",
        fees: "0",
        mode,
      };
      const tx = fromTransactionRaw(raw as never);
      expect(tx.mode).toBe(mode);
      expect("withdrawal" in tx).toBe(false);
      expect("properties" in tx).toBe(false);
      const back = toTransactionRaw(tx);
      expect(back.mode).toBe(mode);
      expect("withdrawal" in back).toBe(false);
    },
  );
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/transaction.test.ts -t "unbond/claim serialization"`
Expected: FAIL — type/compile error on the new mode union members.

- [ ] **Step 3: Add `Transaction` variants** in `types/bridge.ts` — after the `BOND_PUBLIC` member in the `Transaction` union (the one ending at line ~69):

```ts
    | {
        mode: typeof TRANSACTION_TYPE.BOND_PUBLIC;
        withdrawal: string;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
        properties?: never;
      }
  );
```

- [ ] **Step 4: Add `TransactionRaw` variants** in `types/bridge.ts` — identical additions after the `BOND_PUBLIC` member in the `TransactionRaw` union (ending at line ~124):

```ts
    | {
        mode: typeof TRANSACTION_TYPE.BOND_PUBLIC;
        withdrawal: string;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
        properties?: never;
      }
  );
```

- [ ] **Step 5: Serialization needs no special branch** — `fromTransactionRaw`/`toTransactionRaw` already fall through to the default `{ ...common, mode: tr.mode }` for any non-private, non-bond mode. Confirm by reading `bridge/transaction.ts` lines 55-60 and 87-91; no edit needed there. (This step is verification only.)

- [ ] **Step 6: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/transaction.test.ts -t "unbond/claim serialization"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/types/bridge.ts libs/coin-modules/coin-aleo/src/bridge/transaction.test.ts
git commit -m "feat(coin-aleo): serialize unbond_public & claim_unbond_public transactions"
```

---

## Task 3: SDK intent mapping + function-name mapping

> **Reconcile with the OPEN EXTERNAL DEPENDENCY in Global Constraints before merge.** The intent field names below (`staker`, `amount`) are by-analogy guesses.

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/types/sdk.ts`
- Modify: `libs/coin-modules/coin-aleo/src/types/logic.ts`
- Modify: `libs/coin-modules/coin-aleo/src/logic/utils.ts`
- Test: `libs/coin-modules/coin-aleo/src/logic/utils.test.ts`

**Interfaces:**
- Consumes: `TRANSACTION_TYPE.UNBOND_PUBLIC`/`CLAIM_UNBOND_PUBLIC` (Task 1).
- Produces:
  - SDK `Intent` gains `UnbondPublicIntent { type: "unbond_public"; amount: string; staker: string }` and `ClaimUnbondPublicIntent { type: "claim_unbond_public"; staker: string }`.
  - `mapTransactionIntentToSdkIntent` returns those for the new types (`staker` = intent `to`/sender).
  - `AleoTransactionIntentData` gains `{ type: UNBOND_PUBLIC }` and `{ type: CLAIM_UNBOND_PUBLIC }` members.
  - `buildTransactionIntent` produces `data: { type }` for the new modes.
  - The function-name mapping returns `"unbond_public"` / `"claim_unbond_public"`.

- [ ] **Step 1: Write failing tests** in `logic/utils.test.ts` (model on the existing "should map bond_public intent to SDK intent" test at ~line 1404):

```ts
describe("unbond/claim SDK intent mapping", () => {
  it("maps unbond_public intent to SDK intent with staker and amount", () => {
    const sdkIntent = mapTransactionIntentToSdkIntent({
      type: "unbond_public",
      sender: "aleo1stakeraddr",
      recipient: "aleo1stakeraddr",
      amount: 1000000n,
      asset: { type: "native" },
      data: { type: "unbond_public" },
    } as never);
    expect(sdkIntent).toEqual({ type: "unbond_public", amount: "1000000", staker: "aleo1stakeraddr" });
  });

  it("maps claim_unbond_public intent to SDK intent with staker only", () => {
    const sdkIntent = mapTransactionIntentToSdkIntent({
      type: "claim_unbond_public",
      sender: "aleo1stakeraddr",
      recipient: "aleo1stakeraddr",
      amount: 0n,
      asset: { type: "native" },
      data: { type: "claim_unbond_public" },
    } as never);
    expect(sdkIntent).toEqual({ type: "claim_unbond_public", staker: "aleo1stakeraddr" });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/logic/utils.test.ts -t "unbond/claim SDK intent mapping"`
Expected: FAIL — default case throws `aleo: unsupported intent type`.

- [ ] **Step 3: Add SDK intent types** in `types/sdk.ts` — after `BondPublicIntent` (line ~134) and into the `Intent` union:

```ts
interface BondPublicIntent {
  type: "bond_public";
  amount: string;
  validator: string;
  withdrawal: string;
}

interface UnbondPublicIntent {
  type: "unbond_public";
  amount: string;
  staker: string;
}

interface ClaimUnbondPublicIntent {
  type: "claim_unbond_public";
  staker: string;
}
```

Add `UnbondPublicIntent` and `ClaimUnbondPublicIntent` to the `export type Intent = ... ` union (alongside the existing `BondPublicIntent`, which must already be present — if it is missing from the union, add all three).

- [ ] **Step 4: Add `AleoTransactionIntentData` members** in `types/logic.ts` — after the `BOND_PUBLIC` member (line ~84):

```ts
  | {
      type: typeof TRANSACTION_TYPE.BOND_PUBLIC;
      withdrawal: string;
    }
  | {
      type: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
    }
  | {
      type: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
    };
```

- [ ] **Step 5: Map intents to SDK** in `logic/utils.ts` `mapTransactionIntentToSdkIntent` — add cases before `default:` (after the `BOND_PUBLIC` case at ~line 695). `to`/`amount` come from the same destructured locals the `BOND_PUBLIC` case uses (`amount`, `to`); `to` is the staker for these modes:

```ts
    case TRANSACTION_TYPE.UNBOND_PUBLIC: {
      return {
        type: "unbond_public",
        amount,
        staker: to,
      };
    }
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC: {
      return {
        type: "claim_unbond_public",
        staker: to,
      };
    }
```

- [ ] **Step 6: Build transaction intent data** in `logic/utils.ts` `buildTransactionIntent` — add cases after the `BOND_PUBLIC` case (~line 873):

```ts
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
      return {
        ...base,
        data: { type: TRANSACTION_TYPE.UNBOND_PUBLIC },
      };

    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return {
        ...base,
        data: { type: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC },
      };
```

- [ ] **Step 7: Function-name mapping** in `logic/utils.ts` (the switch ending ~line 1021 that returns `"bond_public"`) — add cases before `default:`:

```ts
    case TRANSACTION_TYPE.BOND_PUBLIC:
      return "bond_public";
    case TRANSACTION_TYPE.UNBOND_PUBLIC:
      return "unbond_public";
    case TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC:
      return "claim_unbond_public";
```

- [ ] **Step 8: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/logic/utils.test.ts -t "unbond/claim SDK intent mapping"`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/types/sdk.ts libs/coin-modules/coin-aleo/src/types/logic.ts libs/coin-modules/coin-aleo/src/logic/utils.ts libs/coin-modules/coin-aleo/src/logic/utils.test.ts
git commit -m "feat(coin-aleo): map unbond/claim transaction intents to SDK intents"
```

---

## Task 4: prepareTransaction branches

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/bridge/prepareTransaction.ts`
- Test: `libs/coin-modules/coin-aleo/src/bridge/prepareTransaction.test.ts`

**Interfaces:**
- Consumes: `TRANSACTION_TYPE.UNBOND_PUBLIC`/`CLAIM_UNBOND_PUBLIC`, `estimateFees`, `calculateAmount`, `updateTransaction` (all already imported in the file).
- Produces: prepared transactions — unbond sets `amount` from `calculateAmount` + estimated fees; claim sets `amount = 0` + estimated fees. Neither sets `withdrawal`.

- [ ] **Step 1: Write failing tests** in `prepareTransaction.test.ts` (model on existing bond_public prepare tests):

```ts
import { TRANSACTION_TYPE } from "../constants";

describe("prepareTransaction unbond/claim", () => {
  it("prepares unbond_public preserving the input amount", async () => {
    const account = makeAleoAccount(); // existing test helper in this file
    const tx = { ...makeBaseTx(), mode: TRANSACTION_TYPE.UNBOND_PUBLIC, amount: new BigNumber(1000000) };
    const prepared = await prepareTransaction(account, tx as never);
    expect(prepared.amount.toString()).toBe("1000000");
    expect("withdrawal" in prepared).toBe(false);
  });

  it("prepares claim_unbond_public with zero amount", async () => {
    const account = makeAleoAccount();
    const tx = { ...makeBaseTx(), mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC, amount: new BigNumber(0) };
    const prepared = await prepareTransaction(account, tx as never);
    expect(prepared.amount.toString()).toBe("0");
  });
});
```

(If `makeAleoAccount`/`makeBaseTx` helpers do not exist in the file, reuse whatever fixture the existing `bond_public` prepare test uses — read the top of the test file first and mirror it.)

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/prepareTransaction.test.ts -t "prepareTransaction unbond/claim"`
Expected: FAIL — falls through to public path that derives a transfer mode and drops the staking mode.

- [ ] **Step 3: Add branches** in `prepareTransaction.ts` — immediately after the existing `if (transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC) { ... }` block (ends ~line 196):

```ts
  if (transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC) {
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: TRANSACTION_TYPE.UNBOND_PUBLIC,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());
    const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

    return updateTransaction(transaction, {
      amount: calculatedAmount.amount,
      fees: estimatedFees,
    });
  }

  if (transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC) {
    const feeEstimation = estimateFees({
      configOrCurrencyId: config,
      transactionType: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
    });
    const estimatedFees = new BigNumber(feeEstimation.value.toString());

    return updateTransaction(transaction, {
      amount: new BigNumber(0),
      fees: estimatedFees,
    });
  }
```

- [ ] **Step 4: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/prepareTransaction.test.ts -t "prepareTransaction unbond/claim"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/bridge/prepareTransaction.ts libs/coin-modules/coin-aleo/src/bridge/prepareTransaction.test.ts
git commit -m "feat(coin-aleo): prepare unbond/claim transactions"
```

---

## Task 5: getTransactionStatus validation

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/bridge/getTransactionStatus.ts`
- Test: `libs/coin-modules/coin-aleo/src/bridge/getTransactionStatus.test.ts`

**Interfaces:**
- Consumes: `TRANSACTION_TYPE.UNBOND_PUBLIC`/`CLAIM_UNBOND_PUBLIC`.
- Produces: unbond requires `amount > 0` (raises `AmountRequired` otherwise) and treats the recipient as self (no `RecipientRequired`); claim raises no amount or recipient error.

- [ ] **Step 1: Write failing tests** in `getTransactionStatus.test.ts` (mirror the existing bond_public status tests; reuse the file's account fixture and seed `recipient` to the account's `freshAddress`):

```ts
import { TRANSACTION_TYPE } from "../constants";

describe("getTransactionStatus unbond/claim", () => {
  it("unbond_public with positive amount and self recipient has no errors", async () => {
    const account = makeAleoAccount();
    const status = await getTransactionStatus(account, {
      ...makeBaseTx(),
      mode: TRANSACTION_TYPE.UNBOND_PUBLIC,
      recipient: account.freshAddress,
      amount: new BigNumber(1000000),
    } as never);
    expect(status.errors.amount).toBeUndefined();
    expect(status.errors.recipient).toBeUndefined();
  });

  it("unbond_public with zero amount raises AmountRequired", async () => {
    const account = makeAleoAccount();
    const status = await getTransactionStatus(account, {
      ...makeBaseTx(),
      mode: TRANSACTION_TYPE.UNBOND_PUBLIC,
      recipient: account.freshAddress,
      amount: new BigNumber(0),
    } as never);
    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("claim_unbond_public with zero amount and self recipient has no amount/recipient errors", async () => {
    const account = makeAleoAccount();
    const status = await getTransactionStatus(account, {
      ...makeBaseTx(),
      mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
      recipient: account.freshAddress,
      amount: new BigNumber(0),
    } as never);
    expect(status.errors.amount).toBeUndefined();
    expect(status.errors.recipient).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/getTransactionStatus.test.ts -t "getTransactionStatus unbond/claim"`
Expected: FAIL — claim raises `AmountRequired` (amount 0); recipient self may raise `InvalidAddressBecauseDestinationIsAlsoSource` because `allowSelfTransfer` is false.

- [ ] **Step 3: Allow self-recipient for staking modes** in `getTransactionStatus.ts` `handleTransferTransaction` — replace the recipient validation call (~line 270) so unbond/claim are self-allowed:

```ts
  const isStakingSelfMode =
    transaction.mode === TRANSACTION_TYPE.UNBOND_PUBLIC ||
    transaction.mode === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;

  const recipientError = await validateRecipient({
    account,
    recipient: transaction.recipient,
    allowSelfTransfer: allowSelfTransfer || isStakingSelfMode,
  });
```

- [ ] **Step 4: Skip AmountRequired for claim** — update the amount-check `if` (~line 297) so claim (always zero amount) is exempt:

```ts
  if (
    transaction.mode !== TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC &&
    !transaction.useAllAmount &&
    transaction.amount.lte(0)
  ) {
    errors.amount = new AmountRequired();
  } else if (
    transaction.mode === TRANSACTION_TYPE.BOND_PUBLIC &&
    calculatedAmount.amount.gt(0) &&
    calculatedAmount.amount.lt(MIN_BOND_AMOUNT)
  ) {
```

(The `MIN_BOND_AMOUNT` branch stays `BOND_PUBLIC`-only — see Global Constraints "No min-bond remainder check" for unbond.)

- [ ] **Step 5: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/bridge/getTransactionStatus.test.ts -t "getTransactionStatus unbond/claim"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/bridge/getTransactionStatus.ts libs/coin-modules/coin-aleo/src/bridge/getTransactionStatus.test.ts
git commit -m "feat(coin-aleo): validate unbond/claim transaction status"
```

---

## Task 6: deviceTransactionConfig labels + rebuild libs

**Files:**
- Modify: `libs/coin-modules/coin-aleo/src/deviceTransactionConfig.ts`
- Test: `libs/coin-modules/coin-aleo/src/deviceTransactionConfig.test.ts`

**Interfaces:**
- Produces: device "Method" field reads `"Unbond Public"` / `"Claim Unbond Public"`.

- [ ] **Step 1: Write failing test** in `deviceTransactionConfig.test.ts` (mirror the existing bond_public method test):

```ts
import { TRANSACTION_TYPE } from "./constants";

it.each([
  [TRANSACTION_TYPE.UNBOND_PUBLIC, "Unbond Public"],
  [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC, "Claim Unbond Public"],
])("labels %s as %s", async (mode, label) => {
  const fields = await getDeviceTransactionConfig({
    account: makeAleoAccount(),
    transaction: { ...makeBaseTx(), mode } as never,
    status: { estimatedFees: new BigNumber(1) } as never,
  });
  expect(fields.find(f => f.label === "Method")).toMatchObject({ value: label });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/deviceTransactionConfig.test.ts -t "labels"`
Expected: FAIL — method resolves to `"Unknown"`.

- [ ] **Step 3: Add labels** to `mapTransactionModeToMethod` in `deviceTransactionConfig.ts`:

```ts
  [TRANSACTION_TYPE.BOND_PUBLIC]: "Bond Public",
  [TRANSACTION_TYPE.UNBOND_PUBLIC]: "Unbond Public",
  [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: "Claim Unbond Public",
};
```

- [ ] **Step 4: Run, expect PASS**

Run: `pnpm --filter @ledgerhq/coin-aleo test src/deviceTransactionConfig.test.ts -t "labels"`
Expected: PASS.

- [ ] **Step 5: Full coin-aleo test + typecheck, then rebuild for LLD**

```bash
pnpm --filter @ledgerhq/coin-aleo test
pnpm --filter @ledgerhq/coin-aleo typecheck
pnpm --filter @ledgerhq/coin-aleo build && pnpm --filter @ledgerhq/live-common build
```
Expected: all pass. (Rebuild so the desktop app picks up the new `Transaction` type — see the `rebuild-to-fix-lib-import-errors` skill if LLD later reports stale aleo types.)

- [ ] **Step 6: Commit**

```bash
git add libs/coin-modules/coin-aleo/src/deviceTransactionConfig.ts libs/coin-modules/coin-aleo/src/deviceTransactionConfig.test.ts
git commit -m "feat(coin-aleo): device labels for unbond/claim"
```

---

## Task 7: Desktop modal registration

**Files:**
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/constants.ts`
- Modify: `apps/ledger-live-desktop/src/renderer/families/modals-loaders.ts`
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/index.ts`

**Interfaces:**
- Produces: modal ids `MODAL_ALEO_MANAGE`, `MODAL_ALEO_UNBOND`, `MODAL_ALEO_CLAIM_UNBOND`, wired into the loader registry and preload list. Data types: `AleoManageData = { account: AleoAccount; parentAccount?: Account; source?: string }`; unbond/claim reuse `AleoBondPublicData` (`./aleo/BondPublicFlowModal/Body` exports `Data`).

- [ ] **Step 1: Extend the enum** in `aleo/constants.ts`:

```ts
export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
  UNBOND = "MODAL_ALEO_UNBOND",
  CLAIM_UNBOND = "MODAL_ALEO_CLAIM_UNBOND",
}
```

- [ ] **Step 2: Add data-type imports + registry entries** in `modals-loaders.ts`. After the existing aleo import (line 4):

```ts
import type { Data as AleoManageData } from "./aleo/ManageModal/ManageModal";
import type { Data as AleoUnbondData } from "./aleo/UnbondFlowModal/Body";
import type { Data as AleoClaimUnbondData } from "./aleo/ClaimUnbondFlowModal/Body";
```

In the data-type map (near line 82):

```ts
  MODAL_ALEO_BOND_PUBLIC: AleoBondPublicData;
  MODAL_ALEO_MANAGE: AleoManageData;
  MODAL_ALEO_UNBOND: AleoUnbondData;
  MODAL_ALEO_CLAIM_UNBOND: AleoClaimUnbondData;
```

In the dynamic-import map (near line 169):

```ts
  MODAL_ALEO_BOND_PUBLIC: () => import("./aleo/BondPublicFlowModal"),
  MODAL_ALEO_MANAGE: () => import("./aleo/ManageModal/ManageModal"),
  MODAL_ALEO_UNBOND: () => import("./aleo/UnbondFlowModal"),
  MODAL_ALEO_CLAIM_UNBOND: () => import("./aleo/ClaimUnbondFlowModal"),
```

- [ ] **Step 3: Add to `modalsToPreload`** in `aleo/index.ts`:

```ts
  modalsToPreload: [
    "MODAL_ALEO_SELF_TRANSFER",
    "MODAL_ALEO_BOND_PUBLIC",
    "MODAL_ALEO_MANAGE",
    "MODAL_ALEO_UNBOND",
    "MODAL_ALEO_CLAIM_UNBOND",
  ],
```

- [ ] **Step 4: Do NOT compile yet** — the imported modules (Tasks 8-10) don't exist. Commit registration together with the modals. Skip to Task 8. (No standalone build here; the registry test in Task 11 covers wiring.)

---

## Task 8: ManageModal hub

**Files:**
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ManageModal/ManageModal.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ManageModal/ManageModal.styles.ts`

**Interfaces:**
- Consumes: `MODAL_ALEO_BOND_PUBLIC`, `MODAL_ALEO_UNBOND`, `MODAL_ALEO_CLAIM_UNBOND` (Task 7).
- Produces: `export type Data = { account: AleoAccount; parentAccount?: Account; source?: string }` and a default-exported `ManageModal` rendering three always-enabled actions.

- [ ] **Step 1: Create `ManageModal.styles.ts`** — copy Celo's styled components so the hub matches existing look:

```ts
import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const ManageButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  width: 100%;
  background: transparent;
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
  &:hover {
    background: ${p => (p.disabled ? "transparent" : p.theme.colors.neutral.c20)};
  }
`;

export const IconWrapper = styled(Box)`
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: ${p => p.theme.colors.neutral.c20};
  color: ${p => p.theme.colors.neutral.c100};
  margin-right: 12px;
`;

export const InfoWrapper = styled(Box)`
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 1;
  text-align: left;
`;

export const Title = styled(Box)`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.theme.colors.neutral.c100};
`;

export const Description = styled(Box)`
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c70};
`;
```

- [ ] **Step 2: Create `ManageModal.tsx`** — three actions, all enabled (no gating per Global Constraints):

```tsx
import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { Trans } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import IconCoins from "~/renderer/icons/Coins";
import UnbondIcon from "~/renderer/icons/Undelegate";
import ClaimRewardIcon from "~/renderer/icons/ClaimReward";
import { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { Account } from "@ledgerhq/types-live";
import { ModalData } from "~/renderer/modals/types";
import * as S from "./ManageModal.styles";

export type Data = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

// TODO(LIVE-29195): gate Unstake (bonded>0) and Claim (matured unbond) when staking balances land.
const ManageModal = ({ account, parentAccount, source, ...rest }: Data) => {
  const dispatch = useDispatch();
  const onSelectAction = useCallback(
    (onClose: () => void, name: keyof ModalData) => {
      onClose();
      dispatch(openModal(name, { account, parentAccount, source }));
    },
    [dispatch, account, parentAccount, source],
  );
  return (
    <Modal
      {...rest}
      name="MODAL_ALEO_MANAGE"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="aleo.manage.title" />}
          render={() => (
            <Box>
              <S.ManageButton
                data-testid="aleo-stake-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_BOND_PUBLIC")}
              >
                <S.IconWrapper>
                  <IconCoins size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.stake.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.stake.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
              <S.ManageButton
                data-testid="aleo-unstake-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_UNBOND")}
              >
                <S.IconWrapper>
                  <UnbondIcon size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.unstake.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.unstake.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
              <S.ManageButton
                data-testid="aleo-claim-button"
                onClick={() => onSelectAction(onClose, "MODAL_ALEO_CLAIM_UNBOND")}
              >
                <S.IconWrapper>
                  <ClaimRewardIcon size={16} />
                </S.IconWrapper>
                <S.InfoWrapper>
                  <S.Title>
                    <Trans i18nKey="aleo.manage.claim.title" />
                  </S.Title>
                  <S.Description>
                    <Trans i18nKey="aleo.manage.claim.description" />
                  </S.Description>
                </S.InfoWrapper>
              </S.ManageButton>
            </Box>
          )}
          renderFooter={undefined}
        />
      )}
    />
  );
};

export default ManageModal;
```

- [ ] **Step 3: Verify icons exist**

Run: `ls apps/ledger-live-desktop/src/renderer/icons/Undelegate.tsx apps/ledger-live-desktop/src/renderer/icons/ClaimReward.tsx apps/ledger-live-desktop/src/renderer/icons/Coins.tsx`
Expected: all three paths exist (Celo's ManageModal imports `Undelegate` and `ClaimReward`; aleo header already imports `Coins`). If any is missing, substitute another existing icon from `~/renderer/icons/` and note it.

- [ ] **Step 4: Commit** (with Task 7 registration)

```bash
git add apps/ledger-live-desktop/src/renderer/families/aleo/ManageModal apps/ledger-live-desktop/src/renderer/families/aleo/constants.ts apps/ledger-live-desktop/src/renderer/families/modals-loaders.ts apps/ledger-live-desktop/src/renderer/families/aleo/index.ts
git commit -m "feat(lld/aleo): add staking Manage hub modal + register unbond/claim modals"
```

---

## Task 9: UnbondFlowModal

**Files:**
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/types.ts`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/Body.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/index.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/steps/StepAmount.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal/steps/StepConfirmation.tsx`

**Interfaces:**
- Consumes: `GenericStepConnectDevice`, the `coin-aleo` `unbond_public` mode.
- Produces: `export type Data = { account: AleoAccount; parentAccount?: Account; source?: string }` from `Body.tsx`; default-exported modal from `index.tsx` named `MODAL_ALEO_UNBOND`. Step ids: `amount | connectDevice | confirmation`.

- [ ] **Step 1: Create `types.ts`** (drop bond's `withdrawal`/`validator` step ids):

```ts
import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Account, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/aleo/types";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId = "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: Account | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type St = Step<StepId, StepProps>;
```

- [ ] **Step 2: Create `steps/StepAmount.tsx`** — reuse the bond StepAmount almost verbatim, but the `TrackPage` flow is "unbond" and the continue button id differs. Copy the full content of `BondPublicFlowModal/steps/StepAmount.tsx` and change: `flow="bond"`→`flow="unbond"`, `action="bonding"`→`action="unbonding"`, and the button `id="bond-amount-continue-button"`→`id="unbond-amount-continue-button"`. (No Max button changes — `AmountField` provides the standard amount input; per Global Constraints we add no bonded ceiling. Add at the top of the component body: `// TODO(LIVE-29195): add Max + bonded ceiling when staking balances land`.)

- [ ] **Step 3: Create `steps/StepConfirmation.tsx`** — copy `BondPublicFlowModal/steps/StepConfirmation.tsx`, then change the i18n keys `aleo.bond.flow.*` → `aleo.unbond.flow.*`, the `track("staking_completed", { ... delegation: "bonding", flow: "bond" })` to `delegation: "unbonding", flow: "unbond"`, and the `TrackPage` `flow`/`action` to `"unbond"`/`"unbonding"`.

- [ ] **Step 4: Create `Body.tsx`** — model on `BondPublicFlowModal/Body.tsx` with the reduced step list and an `unbond_public` seed (recipient = staker self):

```tsx
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { StepId, StepProps, St } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { Account, Operation } from "@ledgerhq/types-live";

export type Data = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  openModal: OpenModal;
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "amount",
    label: <Trans i18nKey="aleo.unbond.flow.steps.amount.title" />,
    component: StepAmount,
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="aleo.unbond.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="aleo.unbond.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const mapStateToProps = createStructuredSelector({ device: getCurrentDevice });
const mapDispatchToProps = { openModal };

const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const { account, parentAccount, source = "Account Page" } = params;
  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const mainAccount = getMainAccount(account, parentAccount);
      const t0 = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(t0, {
        mode: "unbond_public",
        recipient: mainAccount.freshAddress,
      });
      return { account, parentAccount, transaction };
    });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("amount");
  }, [onChangeStepId]);
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);
  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      if (!account) return;
      dispatch(
        updateAccountWithUpdater(account.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const error = transactionError || bridgeError;
  const errorSteps: number[] = [];
  if (transactionError) {
    errorSteps.push(stepId === "confirmation" ? 2 : 1);
  } else if (bridgeError) {
    errorSteps.push(0);
  }

  const stepperProps = {
    title: t("aleo.unbond.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["amount"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    source,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUnbond" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
```

- [ ] **Step 5: Create `index.tsx`**:

```tsx
import React, { PureComponent } from "react";
import Modal from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
import { StepId } from "./types";

type State = { stepId: StepId };
const INITIAL_STATE: State = { stepId: "amount" };

class UnbondModal extends PureComponent<Data, State> {
  state: State = INITIAL_STATE;
  handleReset = () => this.setState({ ...INITIAL_STATE });
  handleStepChange = (stepId: StepId) => this.setState({ stepId });

  render() {
    const { stepId } = this.state;
    const isModalLocked = ["connectDevice", "confirmation"].includes(stepId);
    return (
      <Modal
        name="MODAL_ALEO_UNBOND"
        centered
        onHide={this.handleReset}
        preventBackdropClick={isModalLocked}
        width={550}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            onClose={onClose}
            onChangeStepId={this.handleStepChange}
            params={data || {}}
          />
        )}
      />
    );
  }
}

export default UnbondModal;
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter ledger-live-desktop typecheck 2>&1 | grep -i "aleo/UnbondFlowModal" || echo "no UnbondFlowModal type errors"`
Expected: `no UnbondFlowModal type errors`. (If errors reference stale aleo types from live-common, rebuild per the `rebuild-to-fix-lib-import-errors` skill.)

- [ ] **Step 7: Commit**

```bash
git add apps/ledger-live-desktop/src/renderer/families/aleo/UnbondFlowModal
git commit -m "feat(lld/aleo): add Unstake (unbond_public) flow modal"
```

---

## Task 10: ClaimUnbondFlowModal

**Files:**
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/types.ts`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/Body.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/index.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/steps/StepSummary.tsx`
- Create: `apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal/steps/StepConfirmation.tsx`

**Interfaces:**
- Produces: `export type Data = { account: AleoAccount; parentAccount?: Account; source?: string }` from `Body.tsx`; default-exported modal named `MODAL_ALEO_CLAIM_UNBOND`. Step ids: `summary | connectDevice | confirmation` (no amount input — per Global Constraints).

- [ ] **Step 1: Create `types.ts`** — identical to Task 9's `types.ts` but with `export type StepId = "summary" | "connectDevice" | "confirmation";`.

- [ ] **Step 2: Create `steps/StepSummary.tsx`** — a read-only info step (no claimable amount, per Global Constraints) with a continue footer:

```tsx
import React from "react";
import { Trans } from "react-i18next";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";

export default function StepSummary({ error }: StepProps) {
  // TODO(LIVE-29195): show claimable amount when staking balances land.
  return (
    <Box flow={3}>
      <TrackPage category="Claim Flow" name="Step Summary" currency="aleo" type="modal" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" small>
        <Trans i18nKey="aleo.claim.flow.steps.summary.info" />
      </Alert>
    </Box>
  );
}

export function StepSummaryFooter({ transitionTo, bridgePending, status, onClose }: StepProps) {
  const canNext = !bridgePending && Object.keys(status.errors).length === 0;
  return (
    <Box horizontal>
      <Button mr={1} onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="claim-summary-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
```

- [ ] **Step 3: Create `steps/StepConfirmation.tsx`** — copy Task 9's confirmation, change i18n keys to `aleo.claim.flow.*`, `TrackPage` `flow`/`action` to `"claim"`/`"claiming"`, and the `track("staking_completed", ...)` to `delegation: "claiming", flow: "claim"`.

- [ ] **Step 4: Create `Body.tsx`** — copy Task 9's `Body.tsx` and change:
  - import `StepSummary, { StepSummaryFooter }` instead of `StepAmount`.
  - the `steps` array first entry to `{ id: "summary", label: <Trans i18nKey="aleo.claim.flow.steps.summary.title" />, component: StepSummary, noScroll: true, footer: StepSummaryFooter }`, and the connectDevice `onBack` to `transitionTo("summary")`.
  - all `aleo.unbond.flow.*` keys → `aleo.claim.flow.*`.
  - the seed: `bridge.updateTransaction(t0, { mode: "claim_unbond_public", recipient: mainAccount.freshAddress })`.
  - `handleRetry` resets to `"summary"`; `hideBreadcrumb` checks `["summary"]`.
  - `Track` event `"CloseModalClaimUnbond"`.

- [ ] **Step 5: Create `index.tsx`** — copy Task 9's `index.tsx`, change class name `ClaimUnbondModal`, `name="MODAL_ALEO_CLAIM_UNBOND"`, and `INITIAL_STATE = { stepId: "summary" }`.

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter ledger-live-desktop typecheck 2>&1 | grep -i "aleo/ClaimUnbondFlowModal" || echo "no ClaimUnbondFlowModal type errors"`
Expected: `no ClaimUnbondFlowModal type errors`.

- [ ] **Step 7: Commit**

```bash
git add apps/ledger-live-desktop/src/renderer/families/aleo/ClaimUnbondFlowModal
git commit -m "feat(lld/aleo): add Claim (claim_unbond_public) flow modal"
```

---

## Task 11: Rewire header to Manage + tests

**Files:**
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/AccountHeaderManageActions.tsx`
- Modify: `apps/ledger-live-desktop/src/renderer/families/aleo/AccountHeaderManageActions.test.tsx`

**Interfaces:**
- Consumes: `AleoCustomModal.MANAGE` (Task 7).
- Produces: the staking header button now dispatches `openModal(AleoCustomModal.MANAGE, ...)` instead of `BOND_PUBLIC`.

- [ ] **Step 1: Update the failing test first** — open `AccountHeaderManageActions.test.tsx`, find the assertion that the stake button dispatches `MODAL_ALEO_BOND_PUBLIC`, and change the expected modal id to `MODAL_ALEO_MANAGE`. Add an explicit assertion:

```ts
it("stake header action opens the Manage hub", () => {
  // ...render + click the stake-button as the existing test does...
  expect(mockDispatch).toHaveBeenCalledWith(
    openModal("MODAL_ALEO_MANAGE", expect.objectContaining({ account: expect.anything() })),
  );
});
```

(Mirror the existing test's render/click/dispatch-mock setup — read the file first and reuse its harness.)

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter ledger-live-desktop test src/renderer/families/aleo/AccountHeaderManageActions.test.tsx`
Expected: FAIL — still dispatches `MODAL_ALEO_BOND_PUBLIC`.

- [ ] **Step 3: Rewire `onStake`** in `AccountHeaderManageActions.tsx` — change the dispatch target and the label/test id to reflect "Manage":

```ts
  const onManage = () => {
    const mainAccount = getMainAccount(account, parentAccount);
    dispatch(
      openModal(AleoCustomModal.MANAGE, {
        account: mainAccount,
        parentAccount: parentAccount ?? undefined,
      }),
    );
  };
```

Update the returned action object: `onClick: onManage`, `label: t("aleo.manage.headerAction")`, `eventProperties: { button: "aleo-manage" }`. Keep `key: "AleoBond"` and `accountActionsTestId: "stake-button"` unchanged so existing selectors still resolve (or update the test if you rename them — keep them consistent).

- [ ] **Step 4: Run, expect PASS**

Run: `pnpm --filter ledger-live-desktop test src/renderer/families/aleo/AccountHeaderManageActions.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the family registry test** to confirm all three new modals are wired:

Run: `pnpm --filter ledger-live-desktop test src/renderer/families/__tests__/registry.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/ledger-live-desktop/src/renderer/families/aleo/AccountHeaderManageActions.tsx apps/ledger-live-desktop/src/renderer/families/aleo/AccountHeaderManageActions.test.tsx
git commit -m "feat(lld/aleo): open staking Manage hub from account header"
```

---

## Task 12: i18n + changeset

**Files:**
- Modify: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Create: `.changeset/aleo-unstake-claim-flows.md`

**Interfaces:** Provides every i18n key referenced in Tasks 8-11.

- [ ] **Step 1: Add the i18n keys** under the existing `aleo` object in `app.json`. Add a `manage` block, an `unbond` block, and a `claim` block (mirroring the existing `aleo.bond.flow.*` structure):

```json
"manage": {
  "headerAction": "Manage",
  "title": "Manage ALEO stake",
  "stake": { "title": "Stake", "description": "Bond ALEO to a validator" },
  "unstake": { "title": "Unstake", "description": "Begin unbonding your staked ALEO" },
  "claim": { "title": "Claim", "description": "Claim ALEO after the unbonding period" }
},
"unbond": {
  "flow": {
    "title": "Unstake ALEO",
    "steps": {
      "amount": { "title": "Amount" },
      "connectDevice": { "title": "Device" },
      "confirmation": {
        "title": "Confirmation",
        "success": {
          "title": "Unstake submitted",
          "text": "Your unbonding request has been broadcast.",
          "cta": "View details"
        },
        "broadcastError": "Your unstake transaction was signed but could not be broadcast."
      }
    }
  }
},
"claim": {
  "flow": {
    "title": "Claim ALEO",
    "steps": {
      "summary": {
        "title": "Summary",
        "info": "This claims all ALEO whose unbonding period has elapsed back to your account."
      },
      "connectDevice": { "title": "Device" },
      "confirmation": {
        "title": "Confirmation",
        "success": {
          "title": "Claim submitted",
          "text": "Your claim has been broadcast.",
          "cta": "View details"
        },
        "broadcastError": "Your claim transaction was signed but could not be broadcast."
      }
    }
  }
}
```

- [ ] **Step 2: Verify no missing keys** — grep every `i18nKey` introduced in Tasks 8-11 against `app.json`:

Run:
```bash
grep -rho 'i18nKey="aleo\.\(manage\|unbond\|claim\)[^"]*"' apps/ledger-live-desktop/src/renderer/families/aleo/{ManageModal,UnbondFlowModal,ClaimUnbondFlowModal} \
  | sed -E 's/i18nKey="([^"]+)"/\1/' | sort -u
```
Then confirm each path resolves in `app.json`. Expected: every printed key exists. Also confirm `aleo.manage.headerAction` (used in `AccountHeaderManageActions.tsx`) is present.

- [ ] **Step 3: Create the changeset** at `.changeset/aleo-unstake-claim-flows.md` (use the `create-changeset` skill for the exact package-bump format; the content is):

```md
---
"ledger-live-desktop": minor
"@ledgerhq/coin-aleo": minor
---

Add Aleo Unstake (unbond_public) and Claim (claim_unbond_public) staking flows, reachable from a new staking Manage hub on the account header.
```

- [ ] **Step 4: Final full verification**

```bash
pnpm --filter @ledgerhq/coin-aleo test
pnpm --filter ledger-live-desktop test src/renderer/families/aleo
pnpm --filter ledger-live-desktop typecheck
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/ledger-live-desktop/static/i18n/en/app.json .changeset/aleo-unstake-claim-flows.md
git commit -m "feat(lld/aleo): i18n + changeset for unstake & claim flows"
```

---

## Self-Review Notes

- **Spec coverage:** Coin-module modes (Tasks 1-6) ✓; separate UnbondFlowModal (Task 9) ✓; separate ClaimUnbondFlowModal (Task 10) ✓; Manage hub all-enabled (Task 8) ✓; header rewire (Task 11) ✓; registration (Task 7) ✓; i18n + changeset (Task 12) ✓; tests across coin-module + LLD ✓; "without data" simplifications enforced via Global Constraints + TODO markers ✓; desktop-only ✓.
- **External dependency:** The remote SDK intent contract for unbond/claim is flagged in Global Constraints and Task 3 — must be reconciled before merge.
- **Type consistency:** `Data` type is `{ account: AleoAccount; parentAccount?: Account; source?: string }` in ManageModal, UnbondFlowModal/Body, ClaimUnbondFlowModal/Body. Mode strings `"unbond_public"`/`"claim_unbond_public"` consistent between coin-module and the flow seeds. Step ids consistent within each modal's `types.ts`, `Body.tsx`, and `index.tsx` `INITIAL_STATE`.
