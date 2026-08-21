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
import { mineBlocks, waitForBalance, getBalance, getVirtualDaaScore } from "../kaspaNode";
import { getBridges } from "../helpers";
import {
  buildSigners,
  deriveAddress,
  KASPA_TEST_MNEMONIC,
  KASPA_RECIPIENT_MNEMONIC,
} from "../signer";
import type { Signers } from "../signer";
import { toSimnetAddress } from "../addressUtils";

// Block reward = 50 KAS = 5,000,000,000 sompi. 200 blocks = 10,000 KAS total — enough mature
// UTXOs to exercise the 88-input drain cap (see transaction #4) with comfortable buffer, without
// pushing the test address's own transaction count anywhere near the Kaspa REST API's 500-item
// page size (each block is a separate coinbase transaction to this address).
const SETUP_BLOCKS = 200;

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

// Module-level state set in setup() and read by getTransactions() and beforeSync().
let signers: Signers;
let testAddress: string;
let recipient: string;
let stopMSW: (() => void) | null = null;

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
    // beforeAll. Mine SETUP_BLOCKS only if the account doesn't already have enough balance:
    // the second strategy run reuses the mature UTXOs left over after run 1's send-max,
    // so mining is only needed for the first run (or a cold start).
    const currentBalance = await getBalance(testAddress);
    if (currentBalance < BigInt(9_000 * ONE_KAS)) {
      await mineBlocks(SETUP_BLOCKS, SETUP_MINE_INTERVAL_MS);
      console.log(
        `[diag] daaScore after ${SETUP_BLOCKS} setup blocks: ${await getVirtualDaaScore()}`,
      );
      await mineBlocks(MATURITY_GAP_BLOCKS, SETUP_MINE_INTERVAL_MS, maturityGapSink);
      console.log(
        `[diag] daaScore after ${MATURITY_GAP_BLOCKS} maturity-gap blocks: ${await getVirtualDaaScore()}`,
      );
    }

    // Wait for the balance to confirm the indexer processed enough blocks.
    await waitForBalance(testAddress, BigInt(9_000 * ONE_KAS), 300_000);

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
    // 200 mature UTXOs × 50 KAS = 10,000 KAS — well above the 1,000 KAS threshold.
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(Number(INITIAL_FUND_SOMPI));
    expect(account.operationsCount).toBeGreaterThan(0);
  },

  afterAll: async (account: Account) => {
    expect(account.operationsCount).toBeGreaterThanOrEqual(4);
  },

  getTransactions: (_address: string): ScenarioTransaction<GenericTransaction, Account>[] => [
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

    // #3 — Custom-fee send (50 KAS). Tests KIP-9 storage-mass fee enforcement:
    // 10,000 sompi is above the storage-mass minimum for a simple 1-in 2-out transaction
    // (~3,240 sompi base mass × KIP-9 coefficient); the node must accept it.
    {
      name: "Send 50 KAS with custom fee (KIP-9 storage mass)",
      amount: new BigNumber(50 * ONE_KAS),
      recipient,
      useAllAmount: false,
      fees: new BigNumber(10_000), // 10,000 sompi — explicitly above KIP-9 minimum
      expect: (prev: Account, curr: Account) => {
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.fee.toNumber()).toBeGreaterThanOrEqual(10_000);
      },
    },

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
