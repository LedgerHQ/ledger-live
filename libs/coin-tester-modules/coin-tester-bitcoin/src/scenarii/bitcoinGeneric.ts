import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { BigNumber } from "bignumber.js";
import { loadWallet, mineToWalletAddress, sendTo } from "../helpers";
import { killAtlas, spawnAtlas } from "../atlas";
import { waitForExplorerSync } from "../utils";
import { makeGenericAdapterAccount } from "../fixtures";
import { buildGenericSigner } from "../signer";
import { getBitcoinGenericBridges } from "../genericBridges";

// A second account's address (native segwit, regtest) — the send destination.
const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

// Native SegWit account path on regtest (coin type 1). Keeps PSBT signing redeem-script-free.
const ACCOUNT_PATH = "84'/1'/0'";
const RECEIVE_PATH = "84'/1'/0'/0/0";

const makeScenarioTransactions = (): ScenarioTransaction<GenericTransaction, Account>[] => [
  {
    name: "Send 1 BTC (generic-adapter)",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;

      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  },
  {
    name: "Send Fast Fees Strategy BTC",
    feesStrategy: "fast",
    amount: new BigNumber(1e6),
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;

      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  },
  {
    name: "Send Slow Fees Strategy BTC",
    feesStrategy: "slow",
    amount: new BigNumber(1e6),
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;

      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  },
  {
    name: "Send Max BTC",
    useAllAmount: true,
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;

      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  },
];

export const scenarioBitcoinGeneric: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Bitcoin — generic-adapter simple send",
  setup: async () => {
    await spawnAtlas();

    const BITCOIN = getCryptoCurrencyById("bitcoin_regtest");
    const coinConfig = { info: { status: { type: "active" as const } } };
    setCoinConfig(() => ({ ...coinConfig }));
    LiveConfig.setConfig({
      config_currency_bitcoin_regtest: {
        type: "object",
        default: { status: { type: "active" } },
      },
    });

    const { signer } = await buildGenericSigner();
    const xpub = await signer.getXpub(ACCOUNT_PATH);
    const { address: receiveAddress } = await signer.getAddress(RECEIVE_PATH);

    const { accountBridge, currencyBridge } = await getBitcoinGenericBridges(signer);
    const account = makeGenericAdapterAccount(xpub, BITCOIN, "native_segwit");

    await loadWallet("coinTester");
    // 101 blocks to make coinbase spendable, then fund the account's first receive address (3 UTXOs).
    await mineToWalletAddress("101");
    await sendTo(receiveAddress, 2);
    await sendTo(receiveAddress, 3);
    await sendTo(receiveAddress, 2);

    return { accountBridge, currencyBridge, account, retryLimit: 15, retryInterval: 1_000 };
  },
  getTransactions: () => makeScenarioTransactions(),
  beforeSync: async () => {
    await waitForExplorerSync();
  },
  beforeEach: async () => {
    await waitForExplorerSync();
  },
  afterEach: async () => {
    // Confirm the transaction and let the explorer index it.
    await mineToWalletAddress("2");
    await waitForExplorerSync();
  },
  afterAll: async account => {
    await waitForExplorerSync();
    expect(account.operations.length).toBeGreaterThanOrEqual(4);
  },
  teardown: async () => {
    await killAtlas();
  },
};
