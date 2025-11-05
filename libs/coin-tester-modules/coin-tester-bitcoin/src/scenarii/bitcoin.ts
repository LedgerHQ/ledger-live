import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import Btc from "@ledgerhq/hw-app-btc";
import { BitcoinAccount, Transaction as BtcTransaction } from "@ledgerhq/coin-bitcoin/types";
import { createBridges } from "@ledgerhq/coin-bitcoin/bridge/js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import resolver from "@ledgerhq/coin-bitcoin/hw-getAddress";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import { BitcoinConfigInfo, setCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { BigNumber } from "bignumber.js";
import { defaultNanoApp } from "../constants";
import { loadWallet, mineToWalletAddress, sendTo } from "../helpers";
import { makeAccount } from "../fixtures";
import { killAtlas, spawnAtlas } from "../atlas";
import { findNewUtxo, waitForExplorerSync } from "../utils";
import {
  assertCommonTxProperties,
  assertUtxoExcluded,
  assertUtxoSpent,
  getNewChangeUtxos,
} from "../assert";

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};
type BitcoinScenarioTransaction = ScenarioTransaction<BtcTransaction, BitcoinAccount>;

let firstUtxoHash = "";
let firstUtxoOutputIndex = 0;
let secondUtxoHash = "";
let secondUtxoOutputIndex = 0;

const makeScenarioTransactions = (): BitcoinScenarioTransaction[] => {
  const scenarioExcludeTwoUtxos: BitcoinScenarioTransaction = {
    name: "Send BTC excluding two UTXOs",
    rbf: true,
    utxoStrategy: {
      strategy: 1, // Optimize size, for exemple
      excludeUTXOs: [
        { hash: firstUtxoHash, outputIndex: firstUtxoOutputIndex },
        { hash: secondUtxoHash, outputIndex: secondUtxoOutputIndex },
      ],
    },
    amount: new BigNumber(1e8),
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      assertCommonTxProperties(previousAccount, currentAccount);

      assertUtxoExcluded(currentAccount, firstUtxoHash, firstUtxoOutputIndex);
      assertUtxoExcluded(currentAccount, secondUtxoHash, secondUtxoOutputIndex);

      const newChangeUtxo = findNewUtxo(previousAccount, currentAccount);
      expect(newChangeUtxo).toBeDefined();
    },
  };
  const scenarioExcludeOneUtxo: BitcoinScenarioTransaction = {
    name: "Send BTC excluding second UTXO",
    rbf: true,
    utxoStrategy: {
      strategy: 1,
      excludeUTXOs: [{ hash: secondUtxoHash, outputIndex: secondUtxoOutputIndex }],
    },
    useAllAmount: true,
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      const latestOperation = assertCommonTxProperties(previousAccount, currentAccount);

      // Excluded UTXO must still be there
      assertUtxoExcluded(currentAccount, secondUtxoHash, secondUtxoOutputIndex);

      // First UTXO must be spent
      assertUtxoSpent(previousAccount, currentAccount, firstUtxoHash, firstUtxoOutputIndex);

      // No change expected when using all amount
      const changeUtxos = getNewChangeUtxos(previousAccount, currentAccount);
      expect(changeUtxos.length).toBe(0);

      const spentUtxos = previousAccount.bitcoinResources.utxos.filter(
        utxo => !(utxo.hash === secondUtxoHash && utxo.outputIndex === secondUtxoOutputIndex),
      );

      const totalSpent = spentUtxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
      const totalChange = changeUtxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
      const expectedChange = totalSpent.minus(latestOperation.value);
      expect(totalChange.toFixed()).toBe(expectedChange.toFixed());
    },
  };
  const scenarioSendBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send 1 BTC",
    rbf: false,
    amount: new BigNumber(1e8),
    recipient: "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;

      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e8).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };
  const scenarioSendFastFeesStrategyBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Fast Fees Strategy BTC",
    rbf: false,
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
  };
  const scenarioSendSlowFeesStrategyBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Slow Fees Strategy BTC",
    rbf: false,
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
  };
  const scenarioSendFIFOBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send FIFO BTC",
    rbf: true,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
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
  };
  const scenarioSendOptimizeSizeBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Optimize Size BTC",
    rbf: true,
    utxoStrategy: {
      strategy: 1,
      excludeUTXOs: [],
    },
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
  };
  const scenarioSendMergeCoinsBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Merge Coins BTC",
    rbf: true,
    utxoStrategy: { strategy: 2, excludeUTXOs: [] },
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
  };
  const scenarioSendMaxBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Max BTC",
    rbf: false,
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
  };
  return [
    scenarioExcludeTwoUtxos,
    scenarioExcludeOneUtxo,
    scenarioSendBtcTransaction,
    scenarioSendFIFOBtcTransaction,
    scenarioSendOptimizeSizeBtcTransaction,
    scenarioSendMergeCoinsBtcTransaction,
    scenarioSendFastFeesStrategyBtcTransaction,
    scenarioSendSlowFeesStrategyBtcTransaction,
    scenarioSendMaxBtcTransaction,
  ];
};

export const scenarioBitcoin: Scenario<BtcTransaction, BitcoinAccount> = {
  name: "Ledger Live Basic Bitcoin Transactions",
  setup: async () => {
    const [{ getOnSpeculosConfirmation, transport }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/BitcoinTest/app_${defaultNanoApp.version}.elf`),
      spawnAtlas(),
    ]);

    const signerContext: SignerContext = (_, crypto, fn) =>
      fn(new Btc({ transport, currency: BITCOIN.id }));

    const coinConfig: BitcoinCoinConfig = {
      info: {
        status: {
          type: "active",
        },
      },
    };
    setCoinConfig(() => ({ ...coinConfig }));
    LiveConfig.setConfig({
      config_currency_bitcoin_regtest: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
        },
      },
    });

    const onSignerConfirmation = getOnSpeculosConfirmation("Sign transaction");
    const { accountBridge, currencyBridge } = createBridges(signerContext, () => coinConfig);
    await currencyBridge.preload();
    const BITCOIN = getCryptoCurrencyById("bitcoin_regtest");
    const getAddress = resolver(signerContext);
    // Can also test LEGACY here
    const { address, publicKey } = await getAddress("", {
      path: "49'/1'/0'/0/0",
      currency: BITCOIN,
      derivationMode: "segwit",
    });
    const { bitcoinLikeInfo } = BITCOIN;
    const { XPUBVersion: xpubVersion } = bitcoinLikeInfo as {
      XPUBVersion: number;
    };

    const xpub = await signerContext("", BITCOIN, signer =>
      signer.getWalletXpub({
        path: "49'/1'/0'",
        xpubVersion,
      }),
    );
    const scenarioAccount = makeAccount(xpub, publicKey, address, BITCOIN, "segwit");
    await loadWallet("coinTester");
    // Need to wait 100 blocks to be able to spend coinbase UTXOs
    await mineToWalletAddress("101");
    // Fund it with 7 BTC in three send to have 3 UTXOs
    await sendTo(address, 2);
    await sendTo(address, 3);
    await sendTo(address, 2);
    return {
      accountBridge,
      currencyBridge,
      account: scenarioAccount,
      onSignerConfirmation,
      retryLimit: 0,
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  beforeAll: async account => {
    firstUtxoHash = (account as BitcoinAccount).bitcoinResources.utxos[0].hash;
    firstUtxoOutputIndex = (account as BitcoinAccount).bitcoinResources.utxos[0].outputIndex;
    secondUtxoHash = (account as BitcoinAccount).bitcoinResources.utxos[1].hash;
    secondUtxoOutputIndex = (account as BitcoinAccount).bitcoinResources.utxos[1].outputIndex;
  },
  afterEach: async () => {
    // Mine 2 blocks after each transaction to confirm it
    await mineToWalletAddress("2");
  },
  beforeEach: async () => {
    // Make sure explorer is in sync before each transaction
    await waitForExplorerSync();
  },
  beforeSync: async () => {
    // Make sure explorer is in sync before sync
    await waitForExplorerSync();
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAtlas()]);
  },
};
