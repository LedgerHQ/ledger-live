import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { AccountBridge } from "@ledgerhq/types-live";
import type {
  BitcoinAccount,
  Transaction as BtcTransaction,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/api";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { BigNumber } from "bignumber.js";
import {
  loadWallet,
  mineToWalletAddress,
  sendTo,
  sendTransaction,
  replaceTransaction,
  getRawMempool,
} from "../helpers";
import { makeAccount } from "../fixtures";
import { killAtlas, spawnAtlas } from "../atlas";
import { findUtxo, waitForExplorerSync, waitForTxInMempool } from "../utils";
import {
  assertChange,
  assertCommonTxProperties,
  assertSent,
  assertUtxoExcluded,
  assertUtxoSpent,
  getNewChangeUtxos,
  sumOf,
} from "../assert";
import { buildSigner } from "../signer";
import { getBridges } from "../bridges";
import { setupServer } from "msw/node";

type BitcoinScenarioTransaction = ScenarioTransaction<BtcTransaction, BitcoinAccount>;

const ACCOUNT_PATH = "49'/1'/0'";
const receivePath = (index: number) => `${ACCOUNT_PATH}/0/${index}`;
const ONE_BTC = 1e8;
// The account is funded with 2, 3 and 2 BTC on its first receive address and 2 BTC on its second.
const FUNDING_BTC = [2, 3, 2];
const SECOND_ADDRESS_FUNDING_BTC = 2;
const FUNDING_OPERATIONS = FUNDING_BTC.length + 1;
// The sends of getTransactions, then the two receives of getInternalTransactions.
const SENDS = 9;
const INTERNAL_RECEIVES = 2;

let firstUtxoHash = "";
let firstUtxoOutputIndex = 0;
let secondUtxoHash = "";
let secondUtxoOutputIndex = 0;
let secondReceiveAddress = "";
let thirdReceiveAddress = "";
let accountBridge: AccountBridge<BtcTransaction, BitcoinAccount>;

// executeScenario does not await `expect`: the steps driven from the regtest node are chained
// here, one after the other, and afterAll waits for them before its own checks.
let internalSteps: Promise<void> = Promise.resolve();
const internalStepErrors: unknown[] = [];
const runInternalStep = (step: () => Promise<void>): void => {
  internalSteps = internalSteps.then(step).catch(error => {
    internalStepErrors.push(error);
  });
};

function syncAccount(account: BitcoinAccount): Promise<BitcoinAccount> {
  return new Promise((resolve, reject) => {
    let synced = account;
    accountBridge.sync(account, { paginationConfig: {} }).subscribe({
      next: update => {
        synced = update(synced);
      },
      error: reject,
      complete: () => resolve(synced),
    });
  });
}

const RECIPIENT = "bcrt1qajglhjtctn88f5l6rajzz52fy78fhxspjajjwz";

const makeScenarioTransactions = (): BitcoinScenarioTransaction[] => {
  const scenarioExcludeTwoUtxos: BitcoinScenarioTransaction = {
    name: "Send BTC excluding two UTXOs",
    familySpecificData: {
      utxoStrategy: {
        strategy: 1, // Optimize size, for exemple
        excludeUTXOs: [
          { hash: firstUtxoHash, outputIndex: firstUtxoOutputIndex },
          { hash: secondUtxoHash, outputIndex: secondUtxoOutputIndex },
        ],
      },
    },
    amount: new BigNumber(ONE_BTC),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const latestOperation = assertSent(previousAccount, currentAccount, new BigNumber(ONE_BTC));

      assertUtxoExcluded(currentAccount, firstUtxoHash, firstUtxoOutputIndex);
      assertUtxoExcluded(currentAccount, secondUtxoHash, secondUtxoOutputIndex);

      // The change comes back on the change chain
      assertChange(previousAccount, currentAccount, new BigNumber(ONE_BTC), latestOperation.fee);
    },
  };
  const scenarioExcludeOneUtxo: BitcoinScenarioTransaction = {
    name: "Send BTC excluding second UTXO",
    familySpecificData: {
      utxoStrategy: {
        strategy: 1,
        excludeUTXOs: [{ hash: secondUtxoHash, outputIndex: secondUtxoOutputIndex }],
      },
    },
    useAllAmount: true,
    recipient: RECIPIENT,
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

      const totalSpent = sumOf(spentUtxos);
      const totalChange = sumOf(changeUtxos);
      const expectedChange = totalSpent.minus(latestOperation.value);
      expect(totalChange.toFixed()).toBe(expectedChange.toFixed());

      // Everything but the excluded UTXO is gone: the balance is exactly that UTXO
      const excluded = findUtxo(previousAccount, secondUtxoHash, secondUtxoOutputIndex);
      expect(currentAccount.balance.toFixed()).toBe(excluded!.value.toFixed());
    },
  };
  const scenarioSendBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send 1 BTC",
    amount: new BigNumber(ONE_BTC),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(ONE_BTC));
    },
  };
  const scenarioSendFastFeesStrategyBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Fast Fees Strategy BTC",
    feesStrategy: "fast",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(1e6));
    },
  };
  const scenarioSendSlowFeesStrategyBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Slow Fees Strategy BTC",
    feesStrategy: "slow",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(1e6));
    },
  };
  const scenarioSendFIFOBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send FIFO BTC",
    familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] } },
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(1e6));
    },
  };
  const scenarioSendOptimizeSizeBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Optimize Size BTC",
    familySpecificData: { utxoStrategy: { strategy: 1, excludeUTXOs: [] } },
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(1e6));
    },
  };
  const scenarioSendMergeCoinsBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Merge Coins BTC",
    familySpecificData: { utxoStrategy: { strategy: 2, excludeUTXOs: [] } },
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      assertSent(previousAccount, currentAccount, new BigNumber(1e6));
    },
  };
  const scenarioSendMaxBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Max BTC",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const latestOperation = assertCommonTxProperties(previousAccount, currentAccount);

      // Every UTXO is spent, nothing comes back
      expect(latestOperation.value.toFixed()).toBe(previousAccount.balance.toFixed());
      expect(currentAccount.balance.toFixed()).toBe("0");
      expect(currentAccount.operations.length).toBe(FUNDING_OPERATIONS + SENDS);
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

// TODO: RBF and CTFP scenarios are not supported on Ledger Live yet That is why they are made using regtest for now
// TODO: once RBF and CTFP are supported natively in Ledger Live, we can move these scenarios to use bitcoin module instead of regtest helpers
const makeInternalScenarioTransactions = async () => {
  const scenarioReplaceBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Replace BTC transaction",
    expect: (previousAccount, currentAccount) =>
      runInternalStep(async () => {
        const txId = await sendTransaction(currentAccount.freshAddress, 0.003);
        // Waiting a bit before replacing...
        await waitForTxInMempool(txId, 10000); // waits up to 10s

        const replacementTxid = await replaceTransaction(txId, currentAccount.freshAddress);
        const mempool = await getRawMempool();
        expect(mempool.includes(txId)).toBe(false);
        expect(mempool.includes(replacementTxid)).toBe(true);

        // Ensure explorer is synced after replacement
        await waitForExplorerSync();
      }),
  };
  const scenarioCancelBtcTransaction: BitcoinScenarioTransaction = {
    name: "Send Cancel BTC transaction",
    expect: (previousAccount, currentAccount) =>
      runInternalStep(async () => {
        await mineToWalletAddress("2");
        const txId = await sendTransaction(RECIPIENT, 0.003);
        // Waiting a bit before replacing...
        await waitForTxInMempool(txId, 10000); // waits up to 10s

        const replacementTxid = await replaceTransaction(txId, currentAccount.freshAddress);
        const mempool = await getRawMempool();
        expect(mempool.includes(txId)).toBe(false);
        expect(mempool.includes(replacementTxid)).toBe(true);

        // Ensure explorer is synced after cancellation
        await waitForExplorerSync();
      }),
  };

  return [scenarioReplaceBtcTransaction, scenarioCancelBtcTransaction];
};

const mockServer = setupServer();

export const scenarioBitcoin: Scenario<BtcTransaction, BitcoinAccount> = {
  name: "Ledger Live Basic Bitcoin Transactions",
  setup: async () => {
    await spawnAtlas();

    LiveConfig.setConfig({
      config_currency_bitcoin_regtest: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
          name: "Bitcoin Regtest",
          unit: { name: "bitcoin", code: "𝚝BTC", magnitude: 8 },
          explorerId: "btc_regtest",
          explorer: { url: "http://localhost:9876" },
        },
      },
    });

    const bridges = await getBridges(await buildSigner());
    accountBridge = bridges.accountBridge;
    const BITCOIN = getCryptoCurrencyById("bitcoin_regtest");
    // Can also test LEGACY here
    const receiveAddress = (index: number) =>
      bridges.getAddress("", {
        path: receivePath(index),
        currency: BITCOIN,
        derivationMode: "segwit",
      });
    const { address, publicKey } = await receiveAddress(0);
    secondReceiveAddress = (await receiveAddress(1)).address;
    thirdReceiveAddress = (await receiveAddress(2)).address;
    const xpubVersion = getNetworkParameters(BITCOIN.id).xpubVersion.readUInt32BE(0);

    const xpub = await bridges.signerContext("", signer =>
      signer.getWalletXpub({
        currencyId: BITCOIN.id,
        path: ACCOUNT_PATH,
        xpubVersion,
      }),
    );
    const scenarioAccount = makeAccount(xpub, publicKey, address, BITCOIN, "segwit");
    await loadWallet("coinTester");
    // Need to wait 100 blocks to be able to spend coinbase UTXOs
    await mineToWalletAddress("101");
    // Fund it with 7 BTC in three send to have 3 UTXOs
    for (const amount of FUNDING_BTC) await sendTo(address, amount);
    // and with 2 BTC on its second receive address, which the sync must discover
    await sendTo(secondReceiveAddress, SECOND_ADDRESS_FUNDING_BTC);
    // Coin selection only spends confirmed UTXOs, or unconfirmed change
    await mineToWalletAddress("2");
    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: scenarioAccount,
      retryLimit: 0,
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  getInternalTransactions: () => makeInternalScenarioTransactions(),
  beforeAll: async account => {
    mockServer.listen({
      onUnhandledRequest: request => {
        const hostname = new URL(request.url).hostname;
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });

    // The funding: one operation per transaction, on both receive addresses, and nothing else
    const funding = [...FUNDING_BTC, SECOND_ADDRESS_FUNDING_BTC];
    const fundedBalance = new BigNumber(funding.reduce((sum, btc) => sum + btc, 0) * ONE_BTC);
    expect(account.operations.length).toBe(FUNDING_OPERATIONS);
    expect(account.operations.every(operation => operation.type === "IN")).toBe(true);
    expect(account.balance.toFixed()).toBe(fundedBalance.toFixed());
    const onSecondAddress = account.bitcoinResources.utxos.filter(
      utxo => utxo.address === secondReceiveAddress,
    );
    expect(sumOf(onSecondAddress).toFixed()).toBe(
      new BigNumber(SECOND_ADDRESS_FUNDING_BTC * ONE_BTC).toFixed(),
    );
    // Both receive addresses hold history, so the next one is the third
    expect(account.freshAddress).toBe(thirdReceiveAddress);
    expect(account.freshAddressPath).toBe(receivePath(2));

    firstUtxoHash = account.bitcoinResources.utxos[0].hash;
    firstUtxoOutputIndex = account.bitcoinResources.utxos[0].outputIndex;
    secondUtxoHash = account.bitcoinResources.utxos[1].hash;
    secondUtxoOutputIndex = account.bitcoinResources.utxos[1].outputIndex;
  },
  afterEach: async () => {
    // Mine 2 blocks after each transaction to confirm it
    await mineToWalletAddress("2");
    await waitForExplorerSync();
  },
  afterAll: async account => {
    await internalSteps;
    if (internalStepErrors.length > 0) throw internalStepErrors[0];
    // Confirm the last replacement, then sync what the regtest steps did
    await mineToWalletAddress("1");
    await waitForExplorerSync();
    const synced = await syncAccount(account);
    mockServer.close();

    expect(synced.operations.length).toBe(FUNDING_OPERATIONS + SENDS + INTERNAL_RECEIVES);
    expect(synced.operations.every(operation => typeof operation.blockHeight === "number")).toBe(
      true,
    );
    // The operations account for the balance, to the satoshi
    const net = synced.operations.reduce(
      (sum, operation) =>
        operation.type === "IN" ? sum.plus(operation.value) : sum.minus(operation.value),
      new BigNumber(0),
    );
    expect(synced.balance.toFixed()).toBe(net.toFixed());
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
    await killAtlas();
  },
};
