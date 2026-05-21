import { BigNumber } from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import coinConfig from "@ledgerhq/coin-tezos/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { makeAccount, ALICE_BAKER_ADDRESS, RECIPIENT, TEZOS, TZKT_MOCK_URL } from "../fixtures";
import { buildTz1Signer, buildTz2Signer } from "../signer";
import { getBridges } from "../helpers";
import {
  fundAccount,
  spawnFlextesa,
  killFlextesa,
  waitForOperationInclusion,
  TEZOS_RPC,
} from "../flextesa";
import { indexBlocks, initMswHandlers, resetIndexer } from "../indexer";
import { getEnv } from "@ledgerhq/live-env";

global.console = require("console");
jest.setTimeout(600_000);

let closeMswtz1: (() => void) | null = null;
let startLeveltz1 = 1;
let watchedAddresstz1 = "";

let closeMswtz2: (() => void) | null = null;
let startLeveltz2 = 1;
let watchedAddresstz2 = "";

type TezosScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function makeScenarioTransactions(addressType: "tz1" | "tz2"): TezosScenarioTransaction[] {
  const sendOneTez: TezosScenarioTransaction = {
    name: `Send 1 XTZ from unrevealed account (${addressType})`,
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThanOrEqual(2);
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation, revealOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(revealOperation.type).toBe("REVEAL");
      expect(latestOperation.recipients).toContain(RECIPIENT);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value.plus(revealOperation.fee)),
      );
    },
  };

  const sendFiveTez: TezosScenarioTransaction = {
    name: `Send 5 XTZ from revealed account (${addressType})`,
    amount: new BigNumber(5e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(RECIPIENT);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const delegate: TezosScenarioTransaction = {
    name: "Delegate to Alice baker",
    mode: "delegate",
    recipient: ALICE_BAKER_ADDRESS,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("DELEGATE");
      expect(latestOperation.recipients).toContain(ALICE_BAKER_ADDRESS);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const undelegate: TezosScenarioTransaction = {
    name: "Undelegate",
    mode: "undelegate",
    recipient: "",
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("UNDELEGATE");
      expect(latestOperation.recipients).toContain(ALICE_BAKER_ADDRESS);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const sendMax: TezosScenarioTransaction = {
    name: "Send max XTZ",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(RECIPIENT);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  return [sendOneTez, sendFiveTez, delegate, undelegate, sendMax];
}

export const scenarioTezosTz1: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Tezos — Full scenario (tz1 / ed25519)",

  setup: async () => {
    setupMockCryptoAssetsStore();

    await spawnFlextesa();

    const signer = await buildTz1Signer();
    const { currencyBridge, accountBridge, getAddress } = getBridges(signer);

    const { address } = await getAddress("", {
      path: "44'/1729'/0'/0'",
      currency: TEZOS,
      derivationMode: "",
    });
    watchedAddresstz1 = address;

    // Fund the test account with enough XTZ for all transactions
    await fundAccount(address, 20);

    // Record the current block level so we only index ops from here on
    const headRes = await fetch(`${TEZOS_RPC}/chains/main/blocks/head/header`);
    const head = await headRes.json();
    startLeveltz1 = (head as { level: number }).level + 1;

    // Configure the coin module to talk to our local node and mock TzKT.
    const localConfig = {
      status: { type: "active" as const },
      baker: { url: getEnv("API_TEZOS_BAKER") },
      explorer: { url: TZKT_MOCK_URL, maxTxQuery: 100 },
      node: { url: TEZOS_RPC },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 300,
        minEstimatedFees: 300,
      },
    };

    coinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_tezos: {
        type: "object",
        default: localConfig,
      },
    });

    closeMswtz1 = initMswHandlers();

    const account = makeAccount(address);
    return { currencyBridge, accountBridge, account };
  },

  getTransactions: () => makeScenarioTransactions("tz1"),
  beforeSync: async () => {
    await indexBlocks(watchedAddresstz1, startLeveltz1);
  },
  mockIndexer: async (_, optimisticOperation) => {
    await waitForOperationInclusion(optimisticOperation.hash);
  },
  beforeAll: account => {
    expect(account.balance).toStrictEqual(new BigNumber(20000000));
    expect(account.operations.length).toBe(0);
  },
  afterAll: account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps.length).toBe(3);

    const revealOps = account.operations.filter(op => op.type === "REVEAL");
    expect(revealOps.length).toBe(1);

    const delegateOps = account.operations.filter(op => op.type === "DELEGATE");
    expect(delegateOps.length).toBe(1);

    const undelegateOps = account.operations.filter(op => op.type === "UNDELEGATE");
    expect(undelegateOps.length).toBeGreaterThanOrEqual(1);

    expect(account.balance.toNumber()).toBeLessThanOrEqual(300);
  },

  teardown: async () => {
    closeMswtz1?.();
    closeMswtz1 = null;
    resetIndexer();
    await killFlextesa();
  },
};

export const scenarioTezosTz2: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Tezos — Full scenario (tz2 / secp256k1)",

  setup: async () => {
    setupMockCryptoAssetsStore();

    await spawnFlextesa();
    const signer = await buildTz2Signer();
    const { currencyBridge, accountBridge, getAddress } = getBridges(signer);
    const { address } = await getAddress("", {
      path: "44'/1729'/0'",
      currency: TEZOS,
      derivationMode: "tezosSecp256k1",
    });
    watchedAddresstz2 = address;

    await fundAccount(address, 20);

    const headRes = await fetch(`${TEZOS_RPC}/chains/main/blocks/head/header`);
    const head = await headRes.json();
    startLeveltz2 = (head as { level: number }).level + 1;

    const localConfig = {
      status: { type: "active" as const },
      baker: { url: getEnv("API_TEZOS_BAKER") },
      explorer: { url: TZKT_MOCK_URL, maxTxQuery: 100 },
      node: { url: TEZOS_RPC },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 300,
        minEstimatedFees: 300,
      },
    };

    coinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_tezos: {
        type: "object",
        default: localConfig,
      },
    });

    closeMswtz2 = initMswHandlers();

    const account = makeAccount(address, "tezosSecp256k1");
    return { currencyBridge: currencyBridge, accountBridge: accountBridge, account };
  },

  getTransactions: () => makeScenarioTransactions("tz2"),
  beforeSync: async () => {
    await indexBlocks(watchedAddresstz2, startLeveltz2);
  },
  mockIndexer: async (_, optimisticOperation) => {
    await waitForOperationInclusion(optimisticOperation.hash);
  },
  beforeAll: account => {
    expect(account.balance).toStrictEqual(new BigNumber(20000000));
    expect(account.operations.length).toBe(0);
  },
  afterAll: account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps.length).toBe(3);

    const revealOps = account.operations.filter(op => op.type === "REVEAL");
    expect(revealOps.length).toBe(1);

    const delegateOps = account.operations.filter(op => op.type === "DELEGATE");
    expect(delegateOps.length).toBe(1);

    const undelegateOps = account.operations.filter(op => op.type === "UNDELEGATE");
    expect(undelegateOps.length).toBe(1);

    expect(account.balance.toNumber()).toBeLessThanOrEqual(300);
  },

  teardown: async () => {
    closeMswtz2?.();
    closeMswtz2 = null;
    resetIndexer();
    await killFlextesa();
  },
};
