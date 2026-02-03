/**
 * Integration tests for Bitcoin RBF (Replace-By-Fee) replace (speedup) and cancel.
 * Exercises buildRbfSpeedUpTx, buildRbfCancelTx, and getEditTransactionPatch with
 * a real wallet account and mocked explorer (no network).
 */
import { BigNumber } from "bignumber.js";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DerivationModes } from "../types";
import BitcoinLikeWallet from "../wallet";
import { Account as WalletAccount } from "../account";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "../../buildRbfTransaction";
import { getEditTransactionPatch } from "../../editTransaction/getEditTransactionPatch";
import type { BitcoinAccount, Transaction as BtcTransaction } from "../../types";
import { buildRbfFixtureTxs } from "./fixtures/rbf.fixtures";

jest.setTimeout(30000);

const EXTERNAL_RECIPIENT = "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D";
const CHANGE_ADDRESS = "1FHa4cuKdea21ByTngP9vz3KYDqqQe9SsA";
const AMOUNT_TO_EXTERNAL = 50000;
const CHANGE_AMOUNT = 40000;
const FUNDING_OUTPUT_VALUE = 100000;

function createMockExplorer(
  fundingTxIdHex: string,
  fundingTxHex: string,
  originalTxId: string,
  rbfTxHex: string,
) {
  const getTxHex = jest.fn((txId: string): Promise<string> => {
    if (txId === fundingTxIdHex) return Promise.resolve(fundingTxHex);
    if (txId === originalTxId) return Promise.resolve(rbfTxHex);
    return Promise.reject(new Error(`Unknown tx id: ${txId}`));
  });

  const getFees = jest.fn(() =>
    Promise.resolve({
      "0": 3000,
      "1": 2000,
      "2": 1000,
      last_updated: Date.now(),
    }),
  );

  return { getTxHex, getFees };
}

function createBitcoinAccount(walletAccount: WalletAccount, originalTxId: string): BitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;
  return {
    type: "Account",
    id: "test-btc-account-rbf",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: CHANGE_ADDRESS,
    freshAddressPath: "84'/0'/0'/1/0",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [
      {
        id: `pending-${originalTxId}`,
        hash: originalTxId,
        type: "OUT",
        value: new BigNumber(AMOUNT_TO_EXTERNAL),
        fee: new BigNumber(10000),
        senders: [],
        recipients: [EXTERNAL_RECIPIENT],
        blockHeight: null,
        blockHash: null,
        accountId: "test-btc-account-rbf",
        date: new Date(),
        extra: {},
        transactionRaw: {
          amount: AMOUNT_TO_EXTERNAL.toString(),
          recipient: EXTERNAL_RECIPIENT,
        },
      },
    ],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    bitcoinResources: {
      utxos: [],
      walletAccount,
    },
  };
}

describe("RBF replace and cancel integration", () => {
  let wallet: BitcoinLikeWallet;
  let walletAccount: WalletAccount;
  let bitcoinAccount: BitcoinAccount;
  let originalTxId: string;
  let mockExplorer: ReturnType<typeof createMockExplorer>;

  beforeAll(async () => {
    const fixture = buildRbfFixtureTxs({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: CHANGE_ADDRESS,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: CHANGE_AMOUNT,
      fundingOutputValue: FUNDING_OUTPUT_VALUE,
    });

    originalTxId = fixture.originalTxId;
    mockExplorer = createMockExplorer(
      fixture.fundingTxIdHex,
      fixture.fundingTxHex,
      fixture.originalTxId,
      fixture.rbfTxHex,
    );

    wallet = new BitcoinLikeWallet();
    walletAccount = await wallet.generateAccount(
      {
        xpub: "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz",
        path: "44'/0'",
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      getCryptoCurrencyById("bitcoin"),
    );

    walletAccount.xpub.explorer = mockExplorer as unknown as typeof walletAccount.xpub.explorer;
    bitcoinAccount = createBitcoinAccount(walletAccount, originalTxId);
  });

  it("buildRbfSpeedUpTx returns a speedup transaction with same recipient and amount", async () => {
    const tx = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);

    expect(tx.family).toBe("bitcoin");
    expect(tx.recipient).toBe(EXTERNAL_RECIPIENT);
    expect(tx.amount.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
    expect(tx.replaceTxId).toBe(originalTxId);
    expect(tx.rbf).toBe(true);
    expect(tx.feePerByte).toBeDefined();
    expect(tx.feePerByte?.gte(0)).toBe(true);
    expect(tx.changeAddress).toBeDefined();
    expect(tx.utxoStrategy?.strategy).toBeDefined();
    expect(tx.utxoStrategy?.excludeUTXOs).toEqual([]);

    expect(mockExplorer.getTxHex).toHaveBeenCalledWith(originalTxId);
    expect(mockExplorer.getTxHex).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it("buildRbfCancelTx returns a cancel transaction sending to change address", async () => {
    const tx = await buildRbfCancelTx(bitcoinAccount, originalTxId);

    expect(tx.family).toBe("bitcoin");
    expect(tx.recipient).toBe(tx.changeAddress);
    expect(tx.amount.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
    expect(tx.replaceTxId).toBe(originalTxId);
    expect(tx.rbf).toBe(true);
    expect(tx.feePerByte).toBeDefined();
    expect(tx.changeAddress).toBeDefined();
    expect(tx.utxoStrategy?.excludeUTXOs).toEqual([]);

    expect(mockExplorer.getTxHex).toHaveBeenCalledWith(originalTxId);
  });

  it("getEditTransactionPatch(speedup) returns a patch that can be applied to a transaction", async () => {
    const transaction: BtcTransaction = {
      family: "bitcoin",
      recipient: EXTERNAL_RECIPIENT,
      amount: new BigNumber(AMOUNT_TO_EXTERNAL),
      replaceTxId: originalTxId,
      rbf: true,
    } as BtcTransaction;

    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction,
      account: bitcoinAccount,
    });

    expect(patch.recipient).toBe(EXTERNAL_RECIPIENT);
    expect(patch.amount?.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
    expect(patch.replaceTxId).toBe(originalTxId);
    expect(patch.rbf).toBe(true);
    expect(patch.feePerByte).toBeDefined();
    expect(patch.feePerByte?.gte(0)).toBe(true);
    expect(patch.changeAddress).toBeDefined();
    expect(patch.utxoStrategy).toBeDefined();
  });

  it("getEditTransactionPatch(cancel) returns a patch with recipient as change address", async () => {
    const transaction: BtcTransaction = {
      family: "bitcoin",
      recipient: EXTERNAL_RECIPIENT,
      amount: new BigNumber(AMOUNT_TO_EXTERNAL),
      replaceTxId: originalTxId,
      rbf: true,
    } as BtcTransaction;

    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction,
      account: bitcoinAccount,
    });

    expect(patch.recipient).toBe(patch.changeAddress);
    expect(patch.amount?.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
    expect(patch.replaceTxId).toBe(originalTxId);
    expect(patch.rbf).toBe(true);
    expect(patch.feePerByte).toBeDefined();
    expect(patch.changeAddress).toBeDefined();
  });

  it("buildRbfSpeedUpTx uses pending operation recipient when available", async () => {
    const tx = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);
    expect(tx.recipient).toBe(EXTERNAL_RECIPIENT);
  });

  it("buildRbfCancelTx sends amount back to change address", async () => {
    const tx = await buildRbfCancelTx(bitcoinAccount, originalTxId);
    expect(tx.recipient).toBe(tx.changeAddress);
    expect(tx.amount.toNumber()).toBe(AMOUNT_TO_EXTERNAL);
  });
});
