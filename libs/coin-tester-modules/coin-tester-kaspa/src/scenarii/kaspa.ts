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
} from "../fixtures";
import { mineBlocks, waitForBalance } from "../kaspaNode";
import { getBridges } from "../helpers";
import {
  buildSigners,
  deriveAddress,
  KASPA_TEST_MNEMONIC,
  KASPA_RECIPIENT_MNEMONIC,
} from "../signer";
import type { Signers } from "../signer";
import { toSimnetAddress } from "../addressUtils";

// Block reward = 50 KAS = 5,000,000,000 sompi. 100 blocks = 5,000 KAS total — still comfortably
// above the 88-input drain cap (see transaction #4). setup() now mines this unconditionally on
// every strategy run (see below), so testAddress's own transaction count accumulates across both
// strategy runs *and* negativeCases.test.ts's own top-up in the same process — kept at 100
// (halved from an earlier 200) specifically to stay well clear of the Kaspa REST API's 500-item
// page cap (each block is a separate coinbase transaction to this address; LIVE-34179 hit exactly
// that cap at 200/round).
const SETUP_BLOCKS = 100;

// After setup blocks, mine 1000 more to advance the DAA score so every setup UTXO satisfies
// the 1000-block coinbase maturity period. FIFO selection keeps these newer immature UTXOs
// from being chosen first. Mined to a throwaway address (not testAddress) so these 1000
// confirmation-only blocks don't inflate the wallet's own transaction history — maturity is a
// chain-height/DAA-score rule, not a per-address one, so it doesn't matter who receives them.
const MATURITY_GAP_BLOCKS = 1000;

// Mining interval for setup blocks. At 50 ms/block the simply-kaspa-indexer's virtual chain
// processor handles each block in live mode (~1 ms) instead of a slow historical resync
// (~240 ms/block). 200 blocks × 50 ms = 10 s total, all blocks indexed by the time setup ends.
const SETUP_MINE_INTERVAL_MS = 50;

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
        default: { status: { type: "active" } },
      },
    });

    testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);
    // Recipient from a different mnemonic so the legacy bridge's HD scanner never discovers
    // it as a wallet address (which would turn outgoing sends into internal-transfer ops).
    recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);
    // A second, distinct address from the same throwaway mnemonic (index 1, so it never
    // collides with `recipient` above) — pure sink for the maturity-gap blocks, never queried.
    const maturityGapSink = toSimnetAddress(await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 1));
    signers = await buildSigners(KASPA_TEST_MNEMONIC);

    // Infra (kaspad + postgres + indexer + REST + miner) is already up — started by scenarii.test.ts
    // beforeAll. Mine unconditionally — a raw balance check is not a valid "already set up"
    // signal here: negativeCases.test.ts shares this same Docker stack and testAddress, and its
    // own fallback funds testAddress with immature coinbase UTXOs. A balance-based skip would
    // (and did, see LIVE-34179) treat that as "already funded" and skip this scenario's own
    // maturity-gap mining, leaving only immature inputs for the first broadcast. The account's
    // own "Send max (drain)" step empties it before every run anyway, so this never actually
    // skipped anything in the intended flow — it only ever fired in the buggy cross-file case.
    await mineBlocks(SETUP_BLOCKS, SETUP_MINE_INTERVAL_MS);
    await mineBlocks(MATURITY_GAP_BLOCKS, SETUP_MINE_INTERVAL_MS, maturityGapSink);

    // Wait for the balance to confirm the indexer processed enough blocks. 100 setup blocks
    // mint 5,000 KAS; 4,500 leaves margin below that without requiring an exact match.
    await waitForBalance(testAddress, BigInt(4_500 * ONE_KAS), 300_000);

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
  beforeSync: async () => {
    await mineBlocks(1);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  },

  beforeAll: async (account: Account) => {
    // 100 mature UTXOs × 50 KAS = 5,000 KAS — well above the 1,000 KAS threshold.
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(Number(INITIAL_FUND_SOMPI));
    expect(account.operationsCount).toBeGreaterThan(0);
  },

  afterAll: async (account: Account) => {
    expect(account.operationsCount).toBeGreaterThanOrEqual(4);
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
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.value.toNumber()).toBeGreaterThanOrEqual(100 * ONE_KAS);
        expect(op!.fee.toNumber()).toBeGreaterThan(0);
      },
    },

    // #2 — Multi-UTXO consolidation send (200 KAS). With 200 mature UTXOs at 50 KAS each,
    // craftTransaction selects multiple inputs to cover amount + fee.
    {
      name: "Send 200 KAS (multi-UTXO)",
      amount: new BigNumber(200 * ONE_KAS),
      recipient,
      useAllAmount: false,
      expect: (prev: Account, curr: Account) => {
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
