import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { BigNumber } from "bignumber.js";
import { loadWallet, mineToWalletAddress, sendTo } from "../helpers";
import { killAtlas, spawnAtlas } from "../atlas";
import { waitForExplorerSync } from "../utils";
import { makeGenericAdapterAccount } from "../fixtures";
import { buildGenericSigner } from "../signer";
import { getBitcoinGenericBridges } from "../genericBridges";

// Native SegWit address of another wallet (regtest): the send destination.
const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

// The account's single address: first native SegWit receive address on regtest (coin type 1).
const ADDRESS_PATH = "84'/1'/0'/0/0";

const expectOutgoing =
  (amount?: BigNumber) => (previousAccount: Account, currentAccount: Account) => {
    const [latestOperation] = currentAccount.operations;

    expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
    expect(latestOperation.type).toBe("OUT");
    if (amount) {
      // The operation value includes the fees (the generic framework re-adds them).
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(amount).toFixed());
    }
    expect(currentAccount.balance.toFixed()).toBe(
      previousAccount.balance.minus(latestOperation.value).toFixed(),
    );
  };

const makeScenarioTransactions = (): ScenarioTransaction<GenericTransaction, Account>[] => [
  {
    name: "Send 1 BTC",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e8)),
  },
  {
    name: "Send with the fast fees strategy",
    feesStrategy: "fast",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e6)),
  },
  {
    name: "Send with the slow fees strategy",
    feesStrategy: "slow",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: expectOutgoing(new BigNumber(1e6)),
  },
  {
    name: "Send max",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      expectOutgoing()(previousAccount, currentAccount);
      expect(currentAccount.balance.toFixed()).toBe("0");
    },
  },
];

export const scenarioBitcoinGeneric: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Bitcoin — generic adapter (single address)",
  setup: async () => {
    await spawnAtlas();

    const coinConfig: BitcoinCoinConfig = {
      status: { type: "active" },
      name: "Bitcoin Regtest",
      unit: { name: "bitcoin", code: "𝚝BTC", magnitude: 8 },
      explorerId: "btc_regtest",
      explorer: { url: "http://localhost:9876" },
    };
    LiveConfig.setConfig({
      config_currency_bitcoin_regtest: { type: "object", default: coinConfig },
    });

    const BITCOIN = getCryptoCurrencyById("bitcoin_regtest");
    const signer = await buildGenericSigner();
    const { address, publicKey } = await signer.getAddress(ADDRESS_PATH);
    const { accountBridge, currencyBridge } = await getBitcoinGenericBridges(signer);
    const account = makeGenericAdapterAccount(address, publicKey, ADDRESS_PATH, BITCOIN);

    await loadWallet("coinTester");
    // 101 blocks make the coinbase spendable; then fund the address with three UTXOs.
    await mineToWalletAddress("101");
    await sendTo(address, 2);
    await sendTo(address, 3);
    await sendTo(address, 2);
    // History and balance are confirmed-only: confirm the funding before the first sync.
    await mineToWalletAddress("2");

    return { accountBridge, currencyBridge, account, retryLimit: 15, retryInterval: 1_000 };
  },
  getTransactions: () => makeScenarioTransactions(),
  // The coin-tester checks a send's expectations right after broadcasting it, before `afterEach`.
  // coin-bitcoin's Alpaca API reports confirmed history and balance only, so the send must be
  // mined before that sync: `beforeSync` runs before every sync, including the post-broadcast ones.
  beforeSync: async () => {
    await mineToWalletAddress("1");
    await waitForExplorerSync();
  },
  beforeEach: async () => {
    await waitForExplorerSync();
  },
  afterEach: async () => {
    await waitForExplorerSync();
  },
  afterAll: async account => {
    await waitForExplorerSync();
    // Three funding payments in, four sends out.
    expect(account.operations.length).toBeGreaterThanOrEqual(7);
  },
  teardown: async () => {
    await killAtlas();
  },
};
