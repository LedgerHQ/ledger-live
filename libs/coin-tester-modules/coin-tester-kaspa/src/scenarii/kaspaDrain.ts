import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { makeAccount, makeGenericAdapterAccount, initMSW } from "../fixtures";
import { getTransactionCount, mineBlocks, waitForTransactionCount } from "../kaspaNode";
import { BLOCK_REWARD_SOMPI, DRAIN_BLOCKS } from "../chainSetup";
import { getBridges } from "../helpers";
import { buildSigners, deriveAddress, KASPA_RECIPIENT_MNEMONIC } from "../signer";
import { accountAddress, TEST_MNEMONICS } from "../testAccounts";

// See scenarii/kaspa.ts: a new block confirms the send, then the REST server needs a moment.
const SETTLE_MS = 500;

const FUNDED_SOMPI = DRAIN_BLOCKS * Number(BLOCK_REWARD_SOMPI);

let drainAddress: string;
let recipient: string;
let stopMSW: (() => void) | null = null;

/**
 * "Send max" on an account small enough to be emptied by one transaction: DRAIN_BLOCKS mature
 * coinbase UTXOs, fewer than the 88 inputs a Kaspa transaction can carry. The history scenario
 * (kaspa.ts) covers "Send max" on an account above that cap, where the balance cannot reach zero.
 */
export const scenarioKaspaDrain: Scenario<GenericTransaction, Account> = {
  name: "Kaspa drain",

  setup: async (strategy: BridgeStrategy) => {
    LiveConfig.setConfig({
      config_currency_kaspa: {
        type: "object",
        default: { status: { type: "active" } },
      },
    });

    drainAddress = await accountAddress("drain", strategy);
    recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);
    const signers = await buildSigners(TEST_MNEMONICS.drain[strategy]);

    // Funded once by globalSetup; re-check the indexer so the first sync can't come back short.
    await waitForTransactionCount(drainAddress, DRAIN_BLOCKS, 60_000);

    stopMSW = initMSW();

    const { currencyBridge, accountBridge } = await getBridges(strategy, signers);

    const account =
      strategy === "legacy"
        ? makeAccount(
            drainAddress,
            (await signers.bridge.getAddress("44'/111111'/0'/0/0")).publicKey,
          )
        : makeGenericAdapterAccount(drainAddress);

    return {
      currencyBridge,
      accountBridge,
      account,
      retryInterval: 1_000,
      retryLimit: 15,
    };
  },

  // Confirmation blocks go to the miner's default address (the recipient), never to this account.
  beforeSync: async () => {
    await mineBlocks(1);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  },

  beforeAll: async (account: Account) => {
    expect(account.balance.toNumber()).toBe(FUNDED_SOMPI);
    expect(account.operationsCount).toBe(await getTransactionCount(drainAddress));
  },

  getTransactions: (): ScenarioTransaction<GenericTransaction, Account>[] => [
    {
      name: "Send max (drain to zero)",
      amount: new BigNumber(0),
      recipient,
      useAllAmount: true,
      expect: (prev: Account, curr: Account) => {
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.fee.toNumber()).toBeGreaterThan(0);
        // An OUT operation's value is what left the account (amount + fee): all of it.
        expect(op!.value.toNumber()).toBe(prev.balance.toNumber());
        expect(curr.balance.toNumber()).toBe(0);
      },
    },
  ],

  teardown: async () => {
    stopMSW?.();
  },
};
