/**
 * Integration tests for Bitcoin RBF (Replace-By-Fee) cancel and speedup.
 *
 * Covers (at coin-module level, mocked explorer, no network):
 * - Cancel: build cancel for pending send; old tx is replaced (not in final history).
 * - Cancel then send max: cancel intent can be built; send max uses same build path.
 * - Cancel the already canceled: build cancel for a pending cancel tx (works like speed up).
 * - Speed up then cancel: build cancel for a pending speedup tx.
 * - Speed up: build speedup; old tx replaced.
 * - After cancel confirmed: removeReplaced drops unconfirmed when confirmed replacement exists.
 * - Receiver: canceled (replaced) tx removed; unconfirmed can stay until 2 weeks.
 * - Single UTXO and multiple UTXO account fixtures.
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
import { buildTransaction } from "../../buildTransaction";
import { removeReplaced } from "../../synchronisation";
import type { BitcoinAccount, Transaction as BtcTransaction } from "../../types";
import type { BtcOperation } from "../../types";
<<<<<<< HEAD
import {
  RbfFixtureResult,
  buildRbfFixtureTxs,
  buildRbfFixtureTxsWithTwoUtxos,
} from "./fixtures/rbf.fixtures";
=======
import { buildRbfFixtureTxs, buildRbfFixtureTxsWithTwoUtxos } from "./fixtures/rbf.fixtures";
>>>>>>> c0f45c2cd7 (fix: mv to correct branch)

jest.setTimeout(30000);

const EXTERNAL_RECIPIENT = "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D";
const CHANGE_ADDRESS = "1FHa4cuKdea21ByTngP9vz3KYDqqQe9SsA";
const AMOUNT_TO_EXTERNAL = 50000;
const CHANGE_AMOUNT = 40000;
const FUNDING_OUTPUT_VALUE = 100000;

type TxHexMap = Record<string, string>;

function createMockExplorer(txHexMap: TxHexMap) {
  const getTxHex = jest.fn((txId: string): Promise<string> => {
    const hex = txHexMap[txId];
    if (hex) return Promise.resolve(hex);
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

function createBitcoinAccount(
  walletAccount: WalletAccount,
  pendingOp: { hash: string; recipients: string[]; value: number },
): BitcoinAccount {
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
        id: `pending-${pendingOp.hash}`,
        hash: pendingOp.hash,
        type: "OUT",
        value: new BigNumber(pendingOp.value),
        fee: new BigNumber(10000),
        senders: [],
        recipients: pendingOp.recipients,
        blockHeight: null,
        blockHash: null,
        accountId: "test-btc-account-rbf",
        date: new Date(),
        extra: {},
        transactionRaw: {
          amount: pendingOp.value.toString(),
          recipient: pendingOp.recipients[0],
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

describe("RBF replace and cancel integration (single UTXO)", () => {
  let wallet: BitcoinLikeWallet;
  let walletAccount: WalletAccount;
  let bitcoinAccount: BitcoinAccount;
  let originalTxId: string;
  let mockExplorer: ReturnType<typeof createMockExplorer>;
<<<<<<< HEAD
  let fixture: RbfFixtureResult;
=======
  let fixture: ReturnType<typeof buildRbfFixtureTxs>;
>>>>>>> c0f45c2cd7 (fix: mv to correct branch)

  beforeAll(async () => {
    fixture = buildRbfFixtureTxs({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: CHANGE_ADDRESS,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: CHANGE_AMOUNT,
      fundingOutputValue: FUNDING_OUTPUT_VALUE,
    });

    originalTxId = fixture.originalTxId;
    const txHexMap: TxHexMap = {
      [fixture.fundingTxIdHex]: fixture.fundingTxHex,
      [fixture.originalTxId]: fixture.rbfTxHex,
      [fixture.speedupTxId]: fixture.speedupTxHex,
      [fixture.cancelTxId]: fixture.cancelTxHex,
    };
    mockExplorer = createMockExplorer(txHexMap);

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
    bitcoinAccount = createBitcoinAccount(walletAccount, {
      hash: originalTxId,
      recipients: [EXTERNAL_RECIPIENT],
      value: AMOUNT_TO_EXTERNAL,
    });
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

  it("cancel: build cancel tx then full buildTransaction (replacement replaces old tx in flow)", async () => {
    const cancelTx = await buildRbfCancelTx(bitcoinAccount, originalTxId);
    expect(cancelTx.replaceTxId).toBe(originalTxId);
    expect(cancelTx.recipient).toBe(cancelTx.changeAddress);
    const txInfo = await buildTransaction(bitcoinAccount, {
      ...cancelTx,
      feePerByte: cancelTx.feePerByte!,
      utxoStrategy: cancelTx.utxoStrategy!,
    } as BtcTransaction);
    expect(txInfo).toBeDefined();
    expect(txInfo.inputs.length).toBeGreaterThan(0);
    expect(txInfo.outputs.length).toBeGreaterThan(0);
  });

  it("cancel then send max: cancel patch has all required fields for build", async () => {
    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: {
        family: "bitcoin",
        recipient: EXTERNAL_RECIPIENT,
        amount: new BigNumber(AMOUNT_TO_EXTERNAL),
        replaceTxId: originalTxId,
        rbf: true,
      } as BtcTransaction,
      account: bitcoinAccount,
    });
    expect(patch.recipient).toBe(patch.changeAddress);
    expect(patch.feePerByte).toBeDefined();
    expect(patch.feePerByte?.gte(0)).toBe(true);
    expect(patch.utxoStrategy).toBeDefined();
    expect(patch.replaceTxId).toBe(originalTxId);
  });

  it("cancel the already canceled: build cancel for a pending cancel tx (works like speed up)", async () => {
    const cancelTxValue = FUNDING_OUTPUT_VALUE - 5000;
    const accountWithPendingCancel = createBitcoinAccount(walletAccount, {
      hash: fixture.cancelTxId,
      recipients: [CHANGE_ADDRESS],
      value: cancelTxValue,
    });
    const tx = await buildRbfCancelTx(accountWithPendingCancel, fixture.cancelTxId);
    expect(tx.family).toBe("bitcoin");
    expect(tx.replaceTxId).toBe(fixture.cancelTxId);
    expect(tx.recipient).toBe(tx.changeAddress);
    expect(tx.rbf).toBe(true);
  });

  it("speed up then cancel: build cancel for the speedup tx", async () => {
    const accountWithPendingSpeedup = createBitcoinAccount(walletAccount, {
      hash: fixture.speedupTxId,
      recipients: [EXTERNAL_RECIPIENT],
      value: AMOUNT_TO_EXTERNAL,
    });
    const tx = await buildRbfCancelTx(accountWithPendingSpeedup, fixture.speedupTxId);
    expect(tx.replaceTxId).toBe(fixture.speedupTxId);
    expect(tx.recipient).toBe(tx.changeAddress);
    expect(tx.amount.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
  });

  it("speed up: build speedup then full buildTransaction", async () => {
    const speedupTx = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);
    expect(speedupTx.replaceTxId).toBe(originalTxId);
    expect(speedupTx.recipient).toBe(EXTERNAL_RECIPIENT);
    const txInfo = await buildTransaction(bitcoinAccount, {
      ...speedupTx,
      feePerByte: speedupTx.feePerByte!,
      utxoStrategy: speedupTx.utxoStrategy!,
    } as BtcTransaction);
    expect(txInfo).toBeDefined();
    expect(txInfo.inputs.length).toBeGreaterThan(0);
  });

  it("send then cancel then send max then cancel again: cancel patch and cancel-of-cancel both build", async () => {
    const cancelPatch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: {
        family: "bitcoin",
        recipient: EXTERNAL_RECIPIENT,
        amount: new BigNumber(AMOUNT_TO_EXTERNAL),
        replaceTxId: originalTxId,
        rbf: true,
      } as BtcTransaction,
      account: bitcoinAccount,
    });
    expect(cancelPatch.recipient).toBe(cancelPatch.changeAddress);
    const accountWithPendingCancel = createBitcoinAccount(walletAccount, {
      hash: fixture.cancelTxId,
      recipients: [CHANGE_ADDRESS],
      value: FUNDING_OUTPUT_VALUE - 5000,
    });
    const cancelOfCancel = await buildRbfCancelTx(accountWithPendingCancel, fixture.cancelTxId);
    expect(cancelOfCancel.replaceTxId).toBe(fixture.cancelTxId);
    expect(cancelOfCancel.recipient).toBe(cancelOfCancel.changeAddress);
  });
});

describe("removeReplaced: history and receiver (cancel/speedup)", () => {
  const baseOp = {
    accountId: "test",
    type: "OUT" as const,
    fee: new BigNumber(1000),
    value: new BigNumber(50000),
    senders: [] as string[],
    recipients: [EXTERNAL_RECIPIENT],
    blockHash: null as string | null,
    hasFailed: false,
  };

  it("after cancel confirmed: old (unconfirmed) tx is not in history", () => {
    const inputA = "aa00000000000000000000000000000000000000000000000000000000000001";
    const unconfirmedSend: BtcOperation = {
      ...baseOp,
      id: "op-send",
      hash: "tx-unconfirmed-send",
      blockHeight: null,
      date: new Date("2024-06-01"),
      extra: { inputs: [inputA] },
    };
    const confirmedCancel: BtcOperation = {
      ...baseOp,
      id: "op-cancel",
      hash: "tx-confirmed-cancel",
      blockHeight: 100,
      date: new Date("2024-06-02"),
      extra: { inputs: [inputA] },
    };
    const result = removeReplaced([unconfirmedSend, confirmedCancel]);
    expect(result.map(o => o.hash)).toEqual(["tx-confirmed-cancel"]);
    expect(result).not.toContainEqual(expect.objectContaining({ hash: "tx-unconfirmed-send" }));
  });

  it("receiver: canceled (replaced) tx removed; unconfirmed stays until 2 weeks", () => {
    const inputB = "bb00000000000000000000000000000000000000000000000000000000000002";
    const unconfirmedReceive: BtcOperation = {
      ...baseOp,
      type: "IN",
      id: "op-receive",
      hash: "tx-unconfirmed-receive",
      blockHeight: null,
      date: new Date("2024-06-01"),
      extra: { inputs: [inputB] },
    };
    const confirmedOther: BtcOperation = {
      ...baseOp,
      id: "op-other",
      hash: "tx-confirmed-other",
      blockHeight: 100,
      date: new Date("2024-06-02"),
      extra: { inputs: [inputB] },
    };
    const result = removeReplaced([unconfirmedReceive, confirmedOther]);
    expect(result.map(o => o.hash)).toEqual(["tx-confirmed-other"]);
  });

  it("unconfirmed tx stays in history until 2 weeks then filtered out", () => {
    const inputC = "cc00000000000000000000000000000000000000000000000000000000000003";
    const unconfirmedOnly: BtcOperation = {
      ...baseOp,
      id: "op-only",
      hash: "tx-unconfirmed-only",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: [inputC] },
    };
    const beforeTwoWeeks = removeReplaced([unconfirmedOnly], new Date("2024-01-01").getTime() + 1);
    expect(beforeTwoWeeks.map(o => o.hash)).toEqual(["tx-unconfirmed-only"]);
    const afterTwoWeeks = removeReplaced(
      [unconfirmedOnly],
      new Date("2024-01-01").getTime() + 14 * 24 * 60 * 60 * 1000 + 1,
    );
    expect(afterTwoWeeks).toEqual([]);
  });
});

describe("RBF replace and cancel integration (multiple UTXOs)", () => {
  const FUNDING1 = 60000;
  const FUNDING2 = 50000;
  const CHANGE_MULTI = 40000;

  let wallet: BitcoinLikeWallet;
  let walletAccount: WalletAccount;
  let bitcoinAccount: BitcoinAccount;
  let originalTxId: string;
  let mockExplorer: ReturnType<typeof createMockExplorer>;

  beforeAll(async () => {
    const fixture = buildRbfFixtureTxsWithTwoUtxos({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: CHANGE_ADDRESS,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: CHANGE_MULTI,
      fundingOutputValue1: FUNDING1,
      fundingOutputValue2: FUNDING2,
    });

    originalTxId = fixture.originalTxId;
    const txHexMap: TxHexMap = {
      [fixture.fundingTx1IdHex]: fixture.fundingTx1Hex,
      [fixture.fundingTx2IdHex]: fixture.fundingTx2Hex,
      [fixture.originalTxId]: fixture.rbfTxHex,
    };
    mockExplorer = createMockExplorer(txHexMap);

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
    bitcoinAccount = createBitcoinAccount(walletAccount, {
      hash: originalTxId,
      recipients: [EXTERNAL_RECIPIENT],
      value: AMOUNT_TO_EXTERNAL,
    });
  });

  it("buildRbfCancelTx with multiple UTXOs returns cancel sending to change address", async () => {
    const tx = await buildRbfCancelTx(bitcoinAccount, originalTxId);
    expect(tx.family).toBe("bitcoin");
    expect(tx.recipient).toBe(tx.changeAddress);
    expect(tx.replaceTxId).toBe(originalTxId);
    expect(tx.rbf).toBe(true);
  });

  it("buildRbfSpeedUpTx with multiple UTXOs returns speedup with same recipient and amount", async () => {
    const tx = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);
    expect(tx.recipient).toBe(EXTERNAL_RECIPIENT);
    expect(tx.amount.isEqualTo(AMOUNT_TO_EXTERNAL)).toBe(true);
    expect(tx.replaceTxId).toBe(originalTxId);
  });

  it("getEditTransactionPatch(cancel) with multiple UTXOs returns patch with change as recipient", async () => {
    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: {
        family: "bitcoin",
        recipient: EXTERNAL_RECIPIENT,
        amount: new BigNumber(AMOUNT_TO_EXTERNAL),
        replaceTxId: originalTxId,
        rbf: true,
      } as BtcTransaction,
      account: bitcoinAccount,
    });
    expect(patch.recipient).toBe(patch.changeAddress);
  });
});
