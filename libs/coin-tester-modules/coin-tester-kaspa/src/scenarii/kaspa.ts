import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import {
  INITIAL_FUND_SOMPI,
  ONE_KAS,
  makeAccount,
  makeGenericAdapterAccount,
  initMSW,
  historyPages,
} from "../fixtures";
import { mineBlocks, waitForTransactionCount } from "../kaspaNode";
import { SETUP_BLOCKS } from "../chainSetup";
import { getBridges } from "../helpers";
import {
  buildSigners,
  deriveAddress,
  KASPA_TEST_MNEMONIC,
  KASPA_RECIPIENT_MNEMONIC,
} from "../signer";
import type { Signers } from "../signer";

// The chain is funded once for the whole run by globalSetup (see chainSetup.ts): SETUP_BLOCKS
// coinbase txs to testAddress, which is more than one indexer page. That history must come back
// whole across the page boundary: more than one page, no duplicates.
const INDEXER_PAGE_SIZE = 500;

// Settle delay after mining a confirmation block. Live blocks process in ~1 ms at the indexer;
// 500 ms gives the REST server time to reflect the new state before the first sync attempt.
// The retry loop (retryInterval × retryLimit) covers any edge cases.
const SETTLE_MS = 500;

// Custom-fee values for transaction #3 below — chosen far from the network's own low-traffic
// estimate (feerate ≈ 1) so the assertion proves the custom fee was actually applied, not that
// it coincidentally matches the natural estimate. Also empirically must clear kaspad's real
// mempool-standardness minimum, confirmed at exactly 100 sompi/mass-unit (its rejection reports
// "157700 fees ... under ... 315400 for compute mass 3154", i.e. 315400 / 3154 = 100) — both
// values below are chosen with margin above that.
const CUSTOM_FEE_RATE = 200; // legacy bridge: sompi per compute-mass unit (see getFeeRate.ts)
const CUSTOM_ABSOLUTE_FEE = 500_000; // generic adapter: absolute sompi (see prepareTransaction.ts)

// Module-level state set in setup() and read by getTransactions() and beforeSync().
let signers: Signers;
let testAddress: string;
let recipient: string;
let stopMSW: (() => void) | null = null;
// Hashes synced by the legacy run's first sync. The generic-adapter run comes second on the same
// chain, so its first sync must contain every one of them (past txs never change).
let legacyFirstSyncHashes: Set<string> | null = null;
// Hashes returned by the current run's first sync; every later sync must still contain them all.
let firstSyncHashes = new Set<string>();

/**
 * Invariants of every sync after the first, checked right after it:
 * - nothing is duplicated and nothing already synced disappears (the new ops are merged in, not
 *   replacing or repeating history);
 * - on the generic adapter, the walk reads each history page at most once. listOperations keeps
 *   going for a 2 h late-acceptance window past the newest already-synced tx (as legacy rescans 2 h);
 *   simnet mines the whole history within seconds, so here that window covers all of it and the walk
 *   reaches the end — but it must never re-read or loop over pages. Legacy fetches per used address,
 *   so its request count is not a fixed number.
 */
function expectHealthySync(prev: Account, curr: Account, strategy: BridgeStrategy): void {
  const hashes = curr.operations.map(op => op.hash);
  expect(new Set(hashes).size).toBe(hashes.length);
  const currHashes = new Set(hashes);
  expect(prev.operations.filter(op => !currHashes.has(op.hash)).map(op => op.hash)).toEqual([]);
  if (strategy === "generic-adapter") {
    // +1: the indexer may widen a page to keep same-block-time txs together.
    const wholeHistoryPages = Math.ceil(curr.operationsCount / INDEXER_PAGE_SIZE) + 1;
    expect(historyPages.count()).toBeGreaterThanOrEqual(1);
    expect(historyPages.count()).toBeLessThanOrEqual(wholeHistoryPages);
  }
}

// Transaction #3's custom-fee input is bridge-specific — a top-level `fees` field is not the
// real custom-fee input for either bridge and is silently overwritten by the live network
// estimate: the legacy Kaspa builder reads `feesStrategy`/`customFeeRate` (getFeeRate.ts), while
// the generic adapter only honors `customFees.parameters.fees` (generic-coin-framework's
// prepareTransaction.ts). `customFeeRate` isn't part of `GenericTransaction`, hence the cast.
function customFeeTransactionLegacy(): ScenarioTransaction<GenericTransaction, Account> {
  return {
    name: "Send 50 KAS with custom fee (KIP-9 storage mass)",
    amount: new BigNumber(50 * ONE_KAS),
    recipient,
    useAllAmount: false,
    feesStrategy: "custom",
    customFeeRate: new BigNumber(CUSTOM_FEE_RATE),
    expect: (prev: Account, curr: Account) => {
      expectHealthySync(prev, curr, "legacy");
      expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
      const prevIds = new Set(prev.operations.map(o => o.id));
      const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
      expect(op).toBeDefined();
      // Total fee is always feerate × integer compute-mass (selection.ts) — a fee that isn't
      // an exact multiple of our custom rate could not have come from it.
      expect(op!.fee.toNumber() % CUSTOM_FEE_RATE).toBe(0);
      expect(op!.fee.toNumber()).toBeGreaterThan(0);
    },
  } as unknown as ScenarioTransaction<GenericTransaction, Account>;
}

function customFeeTransactionGenericAdapter(): ScenarioTransaction<GenericTransaction, Account> {
  return {
    name: "Send 50 KAS with custom fee (KIP-9 storage mass)",
    amount: new BigNumber(50 * ONE_KAS),
    recipient,
    useAllAmount: false,
    customFees: { parameters: { fees: new BigNumber(CUSTOM_ABSOLUTE_FEE) } },
    expect: (prev: Account, curr: Account) => {
      expectHealthySync(prev, curr, "generic-adapter");
      expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
      const prevIds = new Set(prev.operations.map(o => o.id));
      const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
      expect(op).toBeDefined();
      // genericPrepareTransaction uses customFees.parameters.fees as the fee value verbatim
      // (no estimation), so this must match exactly.
      expect(op!.fee.toNumber()).toBe(CUSTOM_ABSOLUTE_FEE);
    },
  };
}

export const scenarioKaspa: Scenario<GenericTransaction, Account> = {
  name: "Kaspa",

  setup: async (strategy: BridgeStrategy) => {
    LiveConfig.setConfig({
      config_currency_kaspa: {
        type: "object",
        default: {
          status: { type: "active" },
          name: "KASPA",
          unit: { name: "KAS", code: "KAS", magnitude: 8 },
        },
      },
    });

    testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);
    // Recipient from a different mnemonic so the legacy bridge's HD scanner never discovers
    // it as a wallet address (which would turn outgoing sends into internal-transfer ops). Never
    // synced, so globalSetup also uses it as the sink for the maturity-gap blocks.
    recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);
    signers = await buildSigners(KASPA_TEST_MNEMONIC);

    // Infra is up and testAddress already funded — both done once by globalSetup, before any test
    // file. Re-check the indexer's history here so a slow indexer can't leave the first sync short.
    await waitForTransactionCount(testAddress, SETUP_BLOCKS, 60_000);

    stopMSW = initMSW();

    const { currencyBridge, accountBridge } = await getBridges(strategy, signers);

    const account =
      strategy === "legacy"
        ? makeAccount(
            testAddress,
            (await signers.bridge.getAddress("44'/111111'/0'/0/0")).publicKey,
          )
        : makeGenericAdapterAccount(testAddress);

    return {
      currencyBridge,
      accountBridge,
      account,
      retryInterval: 1_000,
      retryLimit: 15,
    };
  },

  // Mine 1 block to confirm the pending transaction, then give the indexer time to catch up.
  // Without a new block, the transaction stays in the mempool and sync returns no new op.
  // Also resets the history-page counter: every sync runs right after this hook, so the count read
  // afterwards covers exactly that one sync.
  beforeSync: async () => {
    await mineBlocks(1);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    historyPages.reset();
  },

  beforeAll: async (account: Account, strategy: BridgeStrategy) => {
    // 600 mature UTXOs × 50 KAS = 30,000 KAS — well above the 1,000 KAS threshold.
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(Number(INITIAL_FUND_SOMPI));

    // A from-scratch sync must return the whole mined history, not stop at the first page.
    const hashes = account.operations.map(op => op.hash);
    expect(account.operationsCount).toBeGreaterThanOrEqual(SETUP_BLOCKS);
    expect(account.operationsCount).toBeGreaterThan(INDEXER_PAGE_SIZE);
    expect(account.operations).toHaveLength(account.operationsCount);
    // Nothing duplicated where two pages meet.
    expect(new Set(hashes).size).toBe(hashes.length);
    // ...and it really took more than one history page to get there.
    expect(historyPages.count()).toBeGreaterThanOrEqual(2);
    firstSyncHashes = new Set(hashes);

    // Parity across the page boundary: whatever legacy's own `after` loop saw, the generic
    // adapter's `before` walk sees too. Compared by tx hash — operation ids embed the account id,
    // which differs between the two strategies.
    if (strategy === "legacy") {
      legacyFirstSyncHashes = new Set(hashes);
    } else if (legacyFirstSyncHashes) {
      const genericHashes = new Set(hashes);
      const missing = [...legacyFirstSyncHashes].filter(hash => !genericHashes.has(hash));
      expect(missing).toEqual([]);
    }
  },

  afterAll: async (account: Account) => {
    // After four sends and their syncs: the whole first-sync history is still there, nothing is
    // duplicated, and at least the four sends were added on top.
    const hashes = account.operations.map(op => op.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
    const finalHashes = new Set(hashes);
    expect([...firstSyncHashes].filter(hash => !finalHashes.has(hash))).toEqual([]);
    expect(account.operationsCount).toBeGreaterThanOrEqual(firstSyncHashes.size + 4);
  },

  getTransactions: (
    _address: string,
    strategy: BridgeStrategy,
  ): ScenarioTransaction<GenericTransaction, Account>[] => [
    // #1 — Fixed-amount send (100 KAS)
    {
      name: "Send 100 KAS (fixed)",
      amount: new BigNumber(100 * ONE_KAS),
      recipient,
      useAllAmount: false,
      expect: (prev: Account, curr: Account) => {
        expectHealthySync(prev, curr, strategy);
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.value.toNumber()).toBeGreaterThanOrEqual(100 * ONE_KAS);
        expect(op!.fee.toNumber()).toBeGreaterThan(0);
      },
    },

    // #2 — Multi-UTXO consolidation send (200 KAS). With 600 mature UTXOs at 50 KAS each,
    // craftTransaction selects multiple inputs to cover amount + fee.
    {
      name: "Send 200 KAS (multi-UTXO)",
      amount: new BigNumber(200 * ONE_KAS),
      recipient,
      useAllAmount: false,
      expect: (prev: Account, curr: Account) => {
        expectHealthySync(prev, curr, strategy);
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.value.toNumber()).toBeGreaterThanOrEqual(200 * ONE_KAS);
      },
    },

    // #3 — Custom-fee send (50 KAS), exercising KIP-9 storage-mass fee handling. The two bridges
    // take a custom fee through different fields — see customFeeTransactionLegacy /
    // customFeeTransactionGenericAdapter above.
    strategy === "legacy" ? customFeeTransactionLegacy() : customFeeTransactionGenericAdapter(),

    // #4 — Send max: Kaspa caps a transaction at MAX_UTXOS_PER_TX = 88 inputs.
    // Each coinbase UTXO is 50 KAS, so one send-max moves at most 88 × 50 KAS = 4,400 KAS.
    // Lower-bound at 4,000 KAS to allow for fees (~1 KAS).
    {
      name: "Send max (drain)",
      amount: new BigNumber(0),
      recipient,
      useAllAmount: true,
      expect: (prev: Account, curr: Account) => {
        expectHealthySync(prev, curr, strategy);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.value.toNumber()).toBeGreaterThan(4_000 * ONE_KAS);
      },
    },
  ],

  teardown: async () => {
    // Infra stays up — killed by scenarii.test.ts afterAll. Just stop MSW.
    stopMSW?.();
  },
};
