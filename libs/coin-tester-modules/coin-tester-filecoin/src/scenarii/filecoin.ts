import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/coin-filecoin/types";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import coinConfig from "@ledgerhq/coin-filecoin/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

import { RECIPIENT, makeAccount } from "../fixtures";
import { getBridges } from "../helpers";
import { buildFilecoinSigner } from "../signer";
import { spawnLotus, killLotus, fundAccount, waitForMessageInclusion, readAdminToken } from "../lotus";
import {
  startProxy, stopProxy, PROXY_URL,
  initMswBlocker,
  resetIndexer, setAdminToken, resolvePendingMessages,
} from "../indexer";

global.console = require("console");
jest.setTimeout(600_000);

const ONE_FIL = "1000000000000000000"; // 1e18 attoFIL
const FUND_AMOUNT = "100000000000000000000"; // 100 FIL

let closeMSW: (() => void) | null = null;

function makeScenarioTransactions(address: string): ScenarioTransaction<Transaction, Account>[] {
  const scenarioSendFil: ScenarioTransaction<Transaction, Account> = {
    name: "Send 1 FIL",
    amount: new BigNumber(ONE_FIL),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAccount.balance.isLessThan(previousAccount.balance)).toBe(true);
    },
  };

  const scenarioSendMaxFil: ScenarioTransaction<Transaction, Account> = {
    name: "Send max FIL",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      // On Filecoin, send max leaves a tiny residual due to gas overestimation burn.
      // Assert balance is negligible (< 0.001 FIL = 1e15 attoFIL) rather than exactly 0.
      expect(currentAccount.spendableBalance.isLessThan(new BigNumber("1000000000000000"))).toBe(true);
    },
  };

  return [scenarioSendFil, scenarioSendMaxFil];
}

export const scenarioFilecoin: Scenario<Transaction, Account> = {
  name: "Ledger Live Basic Filecoin Transactions",

  setup: async () => {
    await spawnLotus();

    // Read admin token for Lotus RPC write calls
    const token = await readAdminToken();
    setAdminToken(token);

    // Start the local HTTP proxy that bridges REST API → Lotus RPC
    await startProxy();

    // Configure coin module to use our local proxy
    setEnv("API_FILECOIN_ENDPOINT", PROXY_URL);

    coinConfig.setCoinConfig(() => ({
      status: { type: "active" as const },
      apiEndpoint: PROXY_URL,
    }));

    LiveConfig.setConfig({
      config_currency_filecoin: {
        type: "object",
        default: {
          status: { type: "active" },
          apiEndpoint: PROXY_URL,
        },
      },
    });

    // Block external calls (filfox, crypto-assets-service, etc.)
    closeMSW = initMswBlocker();

    const { signer, address } = await buildFilecoinSigner();
    const { currencyBridge, accountBridge } = getBridges(signer);
    const account = makeAccount(address);

    // Fund test account and wait for inclusion
    const { cid } = await fundAccount(address, FUND_AMOUNT);
    await waitForMessageInclusion(cid);

    return {
      account,
      accountBridge,
      currencyBridge,
    };
  },

  getTransactions: (address: string) => makeScenarioTransactions(address),

  // After each broadcast, resolve pending CIDs from Lotus
  mockIndexer: async () => {
    await resolvePendingMessages();
  },

  beforeAll: async (account: Account) => {
    expect(account.balance.isGreaterThan(0)).toBe(true);
    expect(account.operations.length).toBe(0);
  },

  afterAll: async (account: Account) => {
    expect(account.operations.length).toBe(2);
  },

  teardown: async () => {
    closeMSW?.();
    closeMSW = null;
    stopProxy();
    resetIndexer();
    await killLotus();
  },
};
