import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import coinConfig from "@ledgerhq/coin-xrp/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { XRP, XRP_LOCAL_RPC, RECIPIENT, makeXrpAccount } from "../fixtures";
import { buildXrpSigner } from "../signer";
import { getBridges } from "../helpers";
import { fundAccount, spawnRippled, killRippled, waitForOperationInclusion } from "../rippled";

global.console = require("console");
jest.setTimeout(600_000);

const DESTINATION_TAG = 1337;

/** 10 XRP base reserve in standalone genesis ledger (drops). */
const BASE_RESERVE_DROPS = 10_000_000;

type XrpScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function makeTransactions(): XrpScenarioTransaction[] {
  // Recipient does not exist at scenario start. coin-xrp's `validateIntent`
  // forbids sending less than the base reserve to a non-existent account,
  // so this first transaction must be exactly the 10 XRP reserve.
  const sendCreateAccount: XrpScenarioTransaction = {
    name: "Send 10 XRP to a fresh recipient (creates the account)",
    amount: new BigNumber(10_000_000),
    recipient: RECIPIENT,
    expect: (previous, current) => {
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      expect(latest.fee).toStrictEqual(new BigNumber(10));
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  const sendOne: XrpScenarioTransaction = {
    name: "Send 1 XRP to the now-existing recipient",
    amount: new BigNumber(1_000_000),
    recipient: RECIPIENT,
    expect: (previous, current) => {
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  const sendWithTag: XrpScenarioTransaction = {
    name: "Send 15 XRP with destination tag",
    amount: new BigNumber(15_000_000),
    recipient: RECIPIENT,
    tag: DESTINATION_TAG,
    expect: (previous, current) => {
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  // Starting balance 50 XRP. After tx 1+2+3: 50 − 10 − 1 − 15 − 0.00003 = 23.99997.
  // Send 13.9 XRP → leaves ~10.09996 (just above reserve).
  const sendNearMax: XrpScenarioTransaction = {
    name: "Send 13.9 XRP (drains to ~reserve)",
    amount: new BigNumber(13_900_000),
    recipient: RECIPIENT,
    expect: (previous, current) => {
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      expect(current.balance.toNumber()).toBeGreaterThan(BASE_RESERVE_DROPS);
      expect(current.balance.toNumber()).toBeLessThan(BASE_RESERVE_DROPS + 200_000);
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  return [sendCreateAccount, sendOne, sendWithTag, sendNearMax];
}

export const scenarioXrp: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live XRP — basic Payment scenarios",

  setup: async () => {
    setupMockCryptoAssetsStore();

    await spawnRippled();

    const signer = buildXrpSigner();

    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);

    const { address } = await getAddress("", {
      path: "44'/144'/0'/0/0",
      currency: XRP,
      derivationMode: "",
    });

    const localConfig = {
      status: { type: "active" as const },
      node: XRP_LOCAL_RPC,
    };
    coinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_ripple: {
        type: "object",
        default: localConfig,
      },
    });

    // Fund the test account with 50 XRP — covers the four sends and keeps
    // the final balance just above the 10 XRP base reserve.
    await fundAccount(address, 50);

    const account = makeXrpAccount(address);
    return { currencyBridge, accountBridge, account, retryInterval: 2000, retryLimit: 20 };
  },

  getTransactions: () => makeTransactions(),

  mockIndexer: async (_account, optimistic) => {
    await waitForOperationInclusion(optimistic.hash);
  },

  beforeAll: account => {
    expect(account.currency.id).toBe(XRP.id);
    expect(account.balance).toStrictEqual(new BigNumber(50_000_000));
    expect(account.spendableBalance.toNumber()).toBeGreaterThan(0);
    // The only pre-scenario op is the genesis funding payment we triggered.
    const inOps = account.operations.filter(op => op.type === "IN");
    expect(inOps.length).toBe(1);
  },

  afterAll: account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps.length).toBe(4);
    // Account is drained to just above the 10 XRP base reserve.
    expect(account.balance.toNumber()).toBeGreaterThan(BASE_RESERVE_DROPS);
    expect(account.balance.toNumber()).toBeLessThan(BASE_RESERVE_DROPS + 200_000);
  },

  teardown: async () => {
    await killRippled();
  },
};
