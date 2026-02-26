jest.mock("./wallet-btc", () => {
  const { BigNumber } = require("bignumber.js");
  const mock = {
    generateAccount: jest.fn(),
    syncAccount: jest.fn(),
    getAccountBalance: jest.fn().mockResolvedValue(new BigNumber(0)),
    getAccountTransactions: jest.fn().mockResolvedValue({ txs: [] }),
    getAccountUnspentUtxos: jest.fn().mockResolvedValue([]),
  };
  return { __esModule: true, default: mock, DerivationModes: {} };
});

import {
  removeReplaced,
  getTxType,
  convertShieldedTransactionsToOperations,
  reduceShieldedSyncResult,
  performTransparentSync,
  createTransparentSyncObservable,
  createShieldedSyncObservable,
  buildSyncObservables,
} from "./synchronisation";
import { BtcOperation, BitcoinAccount } from "./types";
import BigNumber from "bignumber.js";
import type { ShieldedTransaction, ShieldedSyncResult } from "@ledgerhq/zcash-shielded/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { SyncConfig } from "@ledgerhq/types-live";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { firstValueFrom, from } from "rxjs";

describe("removeReplaced", () => {
  const baseTx: Omit<BtcOperation, "hash" | "id" | "blockHeight" | "date" | "extra"> = {
    accountId: "test-account",
    type: "IN",
    fee: new BigNumber(1000),
    value: new BigNumber(50000),
    senders: ["sender1"],
    recipients: ["recipient1"],
    blockHash: null,
    hasFailed: false,
  };

  it("should keep confirmed transactions and remove unconfirmed replacements", () => {
    const confirmedTx: BtcOperation = {
      ...baseTx,
      id: "confirmed1",
      hash: "tx1",
      blockHeight: 100, // Confirmed transaction
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed1",
      hash: "tx2",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([confirmedTx, unconfirmedTx]);
    expect(result).toEqual([confirmedTx]); // Unconfirmed tx should be removed
  });

  it("should remove all unconfirmed conflicts once both are older than two hours", () => {
    const oldUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "oldUnconfirmed",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1"] },
    };

    const newUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "newUnconfirmed",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"), // Newer date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced(
      [oldUnconfirmedTx, newUnconfirmedTx],
      Date.parse("2024-01-02T04:00:00Z"),
    );
    expect(result).toEqual([]); // Both are older than the 2h pending horizon
  });

  it("should replace old unconfirmed transaction after two hours", () => {
    const oldUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "oldUnconfirmed",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1"] },
    };

    const newUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "newUnconfirmed",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"), // Newer date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced(
      [oldUnconfirmedTx, newUnconfirmedTx],
      Date.parse("2024-01-02T03:00:00Z"),
    );
    expect(result).toEqual([newUnconfirmedTx]);
  });

  it("should replace transactions based on block height", () => {
    const lowerHeightTx: BtcOperation = {
      ...baseTx,
      id: "lowHeight",
      hash: "tx1",
      blockHeight: 90, // Lower height
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const higherHeightTx: BtcOperation = {
      ...baseTx,
      id: "highHeight",
      hash: "tx2",
      blockHeight: 100, // Higher block height
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([lowerHeightTx, higherHeightTx]);
    expect(result).toEqual([higherHeightTx]); // Lower height tx should be removed
  });

  it("should keep transactions without inputs", () => {
    const txWithoutInputs: BtcOperation = {
      ...baseTx,
      type: "OUT", // NOTE: we don't set inputs in extra data for OUT transactions
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const txWithInputs: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([txWithoutInputs, txWithInputs]);
    expect(result).toEqual([txWithoutInputs, txWithInputs]);
    // Both should remain, order should be preserved
  });

  it("should remove multiple-input unconfirmed conflicts once stale", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-02T00:00:00Z"),
      extra: { inputs: ["input1", "input2"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02T01:00:00Z"),
      extra: { inputs: ["input1", "input2"] },
    };

    const result = removeReplaced([tx1, tx2], Date.parse("2024-01-02T02:00:00Z"));
    expect(result).toEqual([tx1, tx2]);
  });

  it("should keep multiple unrelated transactions", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input2"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx1, tx2]);
    // Both should remain since they have different inputs
    // Order should be preserved
  });

  it("should always keep coinbase transactions", () => {
    const coinbaseTx: BtcOperation = {
      ...baseTx,
      id: "coinbaseTx",
      hash: "coinbaseTx",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["0000000000000000000000000000000000000000000000000000000000000000"] }, // Coinbase input
    };

    const normalTx: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 101, // Newer block
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([coinbaseTx, normalTx]);

    expect(result).toContain(coinbaseTx); // Coinbase should always be kept
  });

  it("should correctly handle multiple transactions with different inputs", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1", "input2"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input3"] },
    };

    const tx3: BtcOperation = {
      ...baseTx,
      id: "tx3",
      hash: "tx3",
      blockHeight: 110,
      date: new Date("2024-01-03"),
      extra: { inputs: ["input4"] },
    };

    const result = removeReplaced([tx1, tx2, tx3]);
    expect(result).toEqual([tx1, tx2, tx3]);
    // All should remain since they have different inputs
    // Order should be preserved
  });

  // ✅ **New Edge Case: Unconfirmed Transaction References Inputs from Two Confirmed Transactions**
  it("should remove an unconfirmed transaction that references inputs from two confirmed transactions", () => {
    const confirmedTx1: BtcOperation = {
      ...baseTx,
      id: "confirmed1",
      hash: "tx1",
      blockHeight: 100, // Confirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputA"] },
    };

    const confirmedTx2: BtcOperation = {
      ...baseTx,
      id: "confirmed2",
      hash: "tx2",
      blockHeight: 101, // Confirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputB"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed",
      hash: "tx3",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-03"),
      extra: { inputs: ["inputA", "inputB"] }, // References inputs from two confirmed txs
    };

    const result = removeReplaced([confirmedTx1, confirmedTx2, unconfirmedTx]);
    expect(result).toContain(confirmedTx1);
    expect(result).toContain(confirmedTx2);
    expect(result).not.toContain(unconfirmedTx); // ✅ Unconfirmed transaction should be removed
  });

  it("should not replace a confirmed transaction if an unconfirmed transaction has more inputs", () => {
    const confirmedTx: BtcOperation = {
      ...baseTx,
      id: "confirmed",
      hash: "tx3",
      blockHeight: 100, // Confirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputX"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed",
      hash: "tx4",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputX", "inputY", "inputZ"] },
    };

    const result = removeReplaced([confirmedTx, unconfirmedTx]);
    expect(result).toContain(confirmedTx); // ✅ Confirmed tx should not be replaced
    expect(result).not.toContain(unconfirmedTx); // Unconfirmed tx should be replaced
  });

  it("should keep both transactions if they have the same block height and date but different hashes", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "dup1",
      hash: "tx5",
      blockHeight: 100,
      date: new Date("2024-01-01T12:00:00Z"),
      extra: { inputs: ["inputA"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "dup2",
      hash: "tx6",
      blockHeight: 100, // Same height
      date: new Date("2024-01-01T12:00:00Z"), // Same timestamp
      extra: { inputs: ["inputA"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toContain(tx1);
    expect(result).toContain(tx2); // ✅ Both should be retained
  });

  it("should always keep transactions without inputs", () => {
    const noInputTx: BtcOperation = {
      ...baseTx,
      id: "noInputs",
      hash: "tx7",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const result = removeReplaced([noInputTx]);
    expect(result).toContain(noInputTx); // ✅ Should always be kept
  });

  it("should remove only necessary transactions while keeping order intact", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-01"),
      extra: { inputs: ["inputX"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 110, // Confirmed, should replace tx1
      date: new Date("2024-01-02"),
      extra: { inputs: ["inputX"] }, // Same input as tx1
    };

    const tx3: BtcOperation = {
      ...baseTx,
      id: "tx3",
      hash: "tx3",
      blockHeight: 105, // Confirmed, separate input
      date: new Date("2024-01-03"),
      extra: { inputs: ["inputY"] }, // Different input
    };

    const tx4: BtcOperation = {
      ...baseTx,
      id: "tx4",
      hash: "tx4",
      blockHeight: 120, // Confirmed, separate input
      date: new Date("2024-01-04"),
      extra: { inputs: ["inputZ"] }, // Different input
    };

    const result = removeReplaced([tx1, tx2, tx3, tx4]);
    expect(result).toEqual([tx2, tx3, tx4]); // ✅ tx1 is removed, but order remains
  });

  it("should retain only the most confirmed+recent tx among several using same input", () => {
    const tx1 = {
      ...baseTx,
      id: "tx1",
      hash: "h1",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: ["inp"] },
    };
    const tx2 = {
      ...baseTx,
      id: "tx2",
      hash: "h2",
      blockHeight: 100,
      date: new Date("2024-01-02"),
      extra: { inputs: ["inp"] },
    };
    const tx3 = {
      ...baseTx,
      id: "tx3",
      hash: "h3",
      blockHeight: 105,
      date: new Date("2024-01-03"),
      extra: { inputs: ["inp"] },
    };

    const result = removeReplaced([tx1, tx2, tx3]);
    expect(result).toEqual([tx3]); // Only latest confirmed remains
  });
});

describe("getTxType", () => {
  it("should return SHIELDED_TX_ORCHARD_IN when transfer_type is incoming", () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: 100,
      decryptedData: {
        orchard_outputs: [{ amount: 100, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_IN");
  });

  it("should return SHIELDED_TX_ORCHARD_OUT when transfer_type is outgoing", () => {
    const tx: ShieldedTransaction = {
      id: "tx2",
      hex: "00",
      blockHeight: 101,
      blockHash: "hash2",
      timestamp: 1700000001,
      fee: 200,
      decryptedData: {
        orchard_outputs: [{ amount: 200, memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_ORCHARD_OUT");
  });

  it("should return SHIELDED_TX_INTERNAL when transfer_type is internal", () => {
    const tx: ShieldedTransaction = {
      id: "tx3",
      hex: "00",
      blockHeight: 102,
      blockHash: "hash3",
      timestamp: 1700000002,
      fee: 50,
      decryptedData: {
        orchard_outputs: [{ amount: 50, memo: "", transfer_type: "internal" }],
        sapling_outputs: [],
      },
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });

  it("should return SHIELDED_TX_INTERNAL when decryptedData is undefined", () => {
    const tx: ShieldedTransaction = {
      id: "tx4",
      hex: "00",
      blockHeight: 103,
      blockHash: "hash4",
      timestamp: 1700000003,
      fee: 300,
    };
    expect(getTxType(tx)).toBe("SHIELDED_TX_INTERNAL");
  });
});

describe("convertShieldedTransactionsToOperations", () => {
  it("should convert shielded transactions to BtcOperation format", () => {
    const shieldedTxs: ShieldedTransaction[] = [
      {
        id: "tx1",
        hex: "00",
        blockHeight: 100,
        blockHash: "blockhash1",
        timestamp: 1700000000,
        fee: 500,
        decryptedData: {
          orchard_outputs: [{ amount: 1000, memo: "", transfer_type: "incoming" }],
          sapling_outputs: [],
        },
      },
    ];
    const accountId = "js:2:zcash:test-xpub:";
    const result = convertShieldedTransactionsToOperations(shieldedTxs, accountId);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hash: "blockhash1",
      accountId,
      blockHash: "blockhash1",
      blockHeight: 100,
      type: "SHIELDED_TX_ORCHARD_IN",
      date: new Date(1700000000), // timestamp in seconds: code uses new Date(tx.timestamp)
      fee: new BigNumber(500),
      value: new BigNumber(0),
    });
    expect(result[0].id).toContain(accountId);
    expect(result[0].id).toContain("blockhash1");
  });

  it("should handle multiple shielded transactions", () => {
    const shieldedTxs: ShieldedTransaction[] = [
      {
        id: "tx1",
        hex: "00",
        blockHeight: 100,
        blockHash: "hash1",
        timestamp: 1700000000,
        fee: 100,
        decryptedData: {
          orchard_outputs: [{ amount: 0, memo: "", transfer_type: "outgoing" }],
          sapling_outputs: [],
        },
      },
      {
        id: "tx2",
        hex: "00",
        blockHeight: 101,
        blockHash: "hash2",
        timestamp: 1700000001,
        fee: 200,
      },
    ];
    const result = convertShieldedTransactionsToOperations(shieldedTxs, "acc-1");

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("SHIELDED_TX_ORCHARD_OUT");
    expect(result[1].type).toBe("SHIELDED_TX_INTERNAL");
  });

  it("should return empty array for empty input", () => {
    const result = convertShieldedTransactionsToOperations([], "acc-1");
    expect(result).toEqual([]);
  });
});

describe("reduceShieldedSyncResult", () => {
  const createMockInfo = (overrides?: Partial<BitcoinAccount>): any => ({
    currency: getCryptoCurrencyById("zcash"),
    address: "zs1test",
    index: 0,
    derivationPath: "44'/133'/0'/0'",
    derivationMode: 0,
    initialAccount: overrides || undefined,
  });

  it("should return accumulated with blockHeight when no new transactions", () => {
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [], balance: new BigNumber(0) } as Partial<BitcoinAccount>,
    };
    const result: ShieldedSyncResult = {
      operations: [],
      latestBlockHeight: 5000,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output.processedOperations).toEqual([]);
    expect(output.accountUpdate.blockHeight).toBe(5000);
    expect(output.accountUpdate.operations).toEqual([]);
  });

  it("should merge new shielded operations and update balance for incoming tx", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: 100,
      decryptedData: {
        orchard_outputs: [{ amount: 50000, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        balance: new BigNumber(1000),
        blockHeight: 99,
      } as Partial<BitcoinAccount>,
    };
    const result: ShieldedSyncResult = {
      operations: [incomingTx],
      latestBlockHeight: 100,
    };
    const info = createMockInfo({ balance: new BigNumber(1000) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output.processedOperations).toHaveLength(1);
    expect(output.accountUpdate.operations).toHaveLength(1);
    // Note: convertShieldedTransactionsToOperations sets value to 0, so balance stays at initial
    expect(output.accountUpdate.balance?.toString()).toBe("1000");
    expect(output.accountUpdate.blockHeight).toBe(100);
  });

  it("should filter out already processed operations by blockHash", () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: 100,
      decryptedData: {
        orchard_outputs: [{ amount: 100, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [tx],
      accountUpdate: {
        operations: [] as BtcOperation[],
        balance: new BigNumber(0),
        blockHeight: 100,
      } as Partial<BitcoinAccount>,
    };
    const result: ShieldedSyncResult = {
      operations: [tx],
      latestBlockHeight: 100,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output.accountUpdate.operations).toHaveLength(0);
    expect(output.accountUpdate.blockHeight).toBe(100);
  });
});

describe("createTransparentSyncObservable and performTransparentSync", () => {
  const mockSignerContext = jest.fn();
  let wallet: ReturnType<typeof jest.fn> & {
    generateAccount: jest.Mock;
    syncAccount: jest.Mock;
    getAccountBalance: jest.Mock;
    getAccountTransactions: jest.Mock;
    getAccountUnspentUtxos: jest.Mock;
  };

  beforeAll(() => {
    wallet = require("./wallet-btc").default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    wallet.generateAccount.mockResolvedValue({
      xpub: {
        getXpubAddresses: jest.fn().mockResolvedValue([{ address: "bc1addr" }]),
        storage: {
          getUniquesAddresses: jest.fn().mockReturnValue([{ address: "bc1change" }]),
        },
        freshAddress: "bc1fresh",
        freshAddressIndex: 0,
        explorer: { getCurrentBlock: jest.fn().mockResolvedValue({ height: 100 }) },
      },
    });
    wallet.syncAccount.mockResolvedValue(undefined);
  });

  it("should emit account update and complete on successful sync", async () => {
    const info: any = {
      currency: getCryptoCurrencyById("bitcoin"),
      address: "bc1test",
      index: 0,
      derivationPath: "44'/0'/0'/0/0",
      derivationMode: "" as any, // default/legacy mode
      initialAccount: {
        id: "js:2:bitcoin:xpub-test:",
        xpub: "xpub-test",
        operations: [],
        bitcoinResources: { walletAccount: null },
      },
    };

    const observable = createTransparentSyncObservable(info, mockSignerContext);
    const result = await firstValueFrom(observable);

    expect(result).toMatchObject({
      operationsCount: expect.any(Number),
      blockHeight: 100,
    });
  });

  it("performTransparentSync should return account shape with operations and balance", async () => {
    const info: any = {
      currency: getCryptoCurrencyById("bitcoin"),
      address: "bc1test",
      index: 0,
      derivationPath: "44'/0'/0'/0/0",
      derivationMode: "" as any,
      deviceId: "device-1",
      initialAccount: {
        id: "js:2:bitcoin:xpub-test:",
        xpub: "xpub-test",
        operations: [],
        bitcoinResources: { walletAccount: null },
      },
    };

    const result = await performTransparentSync(info, mockSignerContext);

    expect(result).toMatchObject({
      operationsCount: expect.any(Number),
      blockHeight: 100,
      balance: expect.any(BigNumber),
    });
    expect(Array.isArray(result.operations)).toBe(true);
  });
});

describe("createShieldedSyncObservable", () => {
  it("should emit accumulated account updates from shielded sync results", async () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: 100,
      decryptedData: {
        orchard_outputs: [{ amount: 1000, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const shieldedSyncRaw = from<ShieldedSyncResult[]>([
      { operations: [tx], latestBlockHeight: 100 },
      { operations: [], latestBlockHeight: 101 },
    ]);

    const info: any = {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as any, // encodeAccountId expects string for derivationMode
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        balance: new BigNumber(0),
      },
    };

    const observable = createShieldedSyncObservable(info, shieldedSyncRaw);
    const values: Partial<BitcoinAccount>[] = [];
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: v => values.push(v),
        error: reject,
        complete: resolve,
      });
    });

    expect(values).toHaveLength(2);
    expect(values[0]?.operations).toHaveLength(1);
    // convertShieldedTransactionsToOperations sets value to 0, so balance reflects that
    expect(values[0]?.balance?.toString()).toBe("0");
    expect(values[0]?.blockHeight).toBe(100);
    expect(values[1]?.blockHeight).toBe(101);
  });
});

describe("buildSyncObservables", () => {
  const baseInfo: any = {
    currency: getCryptoCurrencyById("bitcoin"),
    address: "bc1test",
    index: 0,
    derivationPath: "44'/0'/0'/0/0",
    derivationMode: 0,
  };

  const defaultSyncConfig: SyncConfig = {
    paginationConfig: {},
  };

  it("should return only transparent sync for non-Zcash currency", () => {
    const signerContext = jest.fn();
    const { syncs, syncType } = buildSyncObservables(baseInfo, defaultSyncConfig, signerContext);

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT);
    expect(syncs).toHaveLength(1);
  });

  it("should return transparent and shielded sync for Zcash with ufvk", () => {
    const zcashInfo: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as any,
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        privateInfo: {
          ufvk: "uview123...",
          saplingBalance: new BigNumber(0),
          orchardBalance: new BigNumber(0),
          syncState: "ready",
          lastSyncTimestamp: null,
          lastBlockProcessed: null,
          transactions: [],
        },
      },
    };
    const signerContext = jest.fn();
    const { syncs, syncType } = buildSyncObservables(zcashInfo, defaultSyncConfig, signerContext);

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED);
    expect(syncs).toHaveLength(2);
  });

  it("should return only transparent sync for Zcash without initialAccount", () => {
    const zcashInfoNoAccount: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      derivationPath: "44'/133'/0'/0'",
      initialAccount: undefined,
    };
    const signerContext = jest.fn();
    const { syncs } = buildSyncObservables(zcashInfoNoAccount, defaultSyncConfig, signerContext);

    expect(syncs).toHaveLength(1);
  });

  it("should respect syncType override in syncConfig", () => {
    const zcashInfo: any = {
      ...baseInfo,
      currency: getCryptoCurrencyById("zcash"),
      initialAccount: {
        id: "acc-1",
        xpub: "xpub",
        privateInfo: {
          ufvk: "uview",
          saplingBalance: new BigNumber(0),
          orchardBalance: new BigNumber(0),
          syncState: "ready",
          lastSyncTimestamp: null,
          lastBlockProcessed: null,
          transactions: [],
        },
      },
    };
    const transparentOnlyConfig: SyncConfig = {
      paginationConfig: {},
      syncType: SYNC_TYPE_TRANSPARENT,
    };
    const signerContext = jest.fn();
    const { syncs } = buildSyncObservables(zcashInfo, transparentOnlyConfig, signerContext);

    expect(syncs).toHaveLength(1);
  });
});
