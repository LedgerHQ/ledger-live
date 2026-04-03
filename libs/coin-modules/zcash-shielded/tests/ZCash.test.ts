import { ZCash } from "../src/ZCash";
import type { ZcashPrivateInfo } from "../src/types";
import {
  testAccount1,
  testAccount2,
  blockWithMyTx,
  txShieldedOrchard,
  dummyBlockMock,
} from "./mocks/blockchainDataMock";
import { server } from "./mocks/node";
import { resetLastBlockCount, setLastBlockCount } from "./mocks/handlers";
import { ZCASH_JSON_RPC_SERVER_TESTNET, ZCASH_LOG_TYPE } from "../src/constants";
import {
  createFindBlockHeightHandlers,
  largeChainScenario,
  smallChainScenario,
} from "./mocks/findBlockHeightData";
import BigNumber from "bignumber.js";
import { http, HttpResponse } from "msw";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("estimatedSyncTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("estimates the sync time", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const estimatedSyncTime = await zcash.estimatedSyncTime(10);
    jest.setSystemTime(new Date("2016-10-28T00:20:00.000Z"));
    const estimatedSyncTimeResult = estimatedSyncTime();
    expect(estimatedSyncTimeResult).toEqual({ hours: 3, minutes: 20 });
  });

  test("returns zero when no time elapsed", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const estimatedSyncTime = await zcash.estimatedSyncTime(5);
    const estimatedSyncTimeResult = estimatedSyncTime();
    expect(estimatedSyncTimeResult).toEqual({ hours: 0, minutes: 0 });
  });

  test("floors partial minutes", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const estimatedSyncTime = await zcash.estimatedSyncTime(10);
    // 59 seconds elapsed * 10 blocks = 590 seconds (9 minutes and 50 seconds), floored to 9 minutes.
    jest.setSystemTime(new Date("2016-10-28T00:00:59.000Z"));
    const estimatedSyncTimeResult = estimatedSyncTime();
    expect(estimatedSyncTimeResult).toEqual({ hours: 0, minutes: 9 });
  });

  test("recomputes estimation on each call", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const estimatedSyncTime = await zcash.estimatedSyncTime(60);

    jest.setSystemTime(new Date("2016-10-28T00:01:00.000Z"));
    expect(estimatedSyncTime()).toEqual({ hours: 1, minutes: 0 });

    jest.setSystemTime(new Date("2016-10-28T00:02:00.000Z"));
    expect(estimatedSyncTime()).toEqual({ hours: 2, minutes: 0 });
  });
});

describe("findBlockHeight", () => {
  test("finds the highest block height at or before a given timestamp (mocked RPC)", async () => {
    server.use(...createFindBlockHeightHandlers(largeChainScenario));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.findBlockHeight(1234);
    expect(height).toEqual(1276);
  });

  test("returns undefined when timestamp is negative", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.findBlockHeight(-1);
    expect(height).toBeUndefined();
  });

  test("returns undefined when timestamp is NaN", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.findBlockHeight(NaN);
    expect(height).toBeUndefined();
  });

  test("binary search: exact match returns that block height", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    // Block 5 has time 100 + 500 = 600
    const height = await zcash.findBlockHeight(600);
    expect(height).toEqual(5);
  });

  test("binary search: timestamp with no exact block returns highest block at or before that time", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    // Block 4 has time 500, block 5 has time 600. Timestamp 550 has no block; we return the highest height with time <= 550, i.e. block 4.
    const height = await zcash.findBlockHeight(550);
    expect(height).toEqual(4);
  });

  test("binary search: timestamp before first block returns 0", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    // Block 0 has time 100; timestamp 50 is before genesis
    const height = await zcash.findBlockHeight(50);
    expect(height).toEqual(0);
  });

  test("binary search: timestamp after last block returns tip", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    // Block 10 has time 1100; timestamp 2000 is in the future
    const height = await zcash.findBlockHeight(2000);
    expect(height).toEqual(10);
  });

  test("returns 0 when chain tip height is 0", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    jest.spyOn(zcash.jsonRpcClient, "getBlockCount").mockResolvedValue(0);

    const height = await zcash.findBlockHeight(1234);
    expect(height).toEqual(0);
  });

  test("returns undefined when getBlockCount returns undefined", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    jest
      .spyOn(zcash.jsonRpcClient, "getBlockCount")
      .mockResolvedValue(undefined as unknown as number);

    const height = await zcash.findBlockHeight(1234);
    expect(height).toBeUndefined();
  });

  test("returns undefined when a block cannot be fetched during binary search", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    jest.spyOn(zcash.jsonRpcClient, "getBlockCount").mockResolvedValue(10);
    jest.spyOn(zcash.jsonRpcClient, "getBlock").mockResolvedValue(undefined);

    const height = await zcash.findBlockHeight(1234);
    expect(height).toBeUndefined();
  });
});

describe("decryptTransaction", () => {
  test("returns a shielded transaction when decrypt_tx succeeds", async () => {
    jest.resetModules();
    const rawTransaction = {
      hex: "tx-hex",
      height: 42,
      orchard: {
        actions: [],
        valueBalance: 0,
        valueBalanceZat: 0,
      },
      time: 123,
      txid: "tx-id",
      blockhash: "block-hash",
    };
    const decryptedPayload = {
      orchard_outputs: [],
      sapling_outputs: [],
    };
    const expectedShieldedTx = {
      id: rawTransaction.txid,
      hex: rawTransaction.hex,
      blockHeight: rawTransaction.height,
      blockHash: rawTransaction.blockhash,
      timestamp: rawTransaction.time,
      fee: new BigNumber(rawTransaction.orchard.valueBalanceZat),
      decryptedData: decryptedPayload,
    };
    const decryptTxMock = jest.fn().mockReturnValue(decryptedPayload);
    const toShieldedTransactionMock = jest.fn().mockReturnValue(expectedShieldedTx);
    jest.doMock("@ledgerhq/zcash-decrypt", () => ({ decrypt_tx: decryptTxMock }));
    jest.doMock("../src/shieldedTransaction", () => ({
      toShieldedTransaction: toShieldedTransactionMock,
    }));

    try {
      const { ZCash: MockedZCash } = await import("../src/ZCash");
      const zcash = new MockedZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
      const result = await zcash.decryptTransaction(rawTransaction, "ufvk");

      expect(decryptTxMock).toHaveBeenCalledWith(rawTransaction.hex, "ufvk");
      expect(toShieldedTransactionMock).toHaveBeenCalledWith(rawTransaction, decryptedPayload);
      expect(result).toEqual(expectedShieldedTx);
    } finally {
      jest.dontMock("@ledgerhq/zcash-decrypt");
      jest.dontMock("../src/shieldedTransaction");
      jest.resetModules();
    }
  });

  test("logs an error and returns undefined when decrypt_tx throws", async () => {
    jest.resetModules();
    const rawTransaction = {
      hex: "tx-hex",
      height: 42,
      orchard: {
        actions: [],
        valueBalance: 0,
        valueBalanceZat: 0,
      },
      time: 123,
      txid: "tx-id",
      blockhash: "block-hash",
    };
    const error = new Error("decrypt failed");
    const decryptTxMock = jest.fn(() => {
      throw error;
    });
    const logMock = jest.fn();
    jest.doMock("@ledgerhq/zcash-decrypt", () => ({ decrypt_tx: decryptTxMock }));
    jest.doMock("@ledgerhq/logs", () => ({ log: logMock }));

    try {
      const { ZCash: MockedZCash } = await import("../src/ZCash");
      const zcash = new MockedZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
      const result = await zcash.decryptTransaction(rawTransaction, "ufvk");

      expect(logMock).toHaveBeenCalledWith(
        ZCASH_LOG_TYPE,
        "error: failed to decrypt transaction",
        error,
      );
      expect(result).toBeUndefined();
    } finally {
      jest.dontMock("@ledgerhq/zcash-decrypt");
      jest.dontMock("@ledgerhq/logs");
      jest.resetModules();
    }
  });

  test("fails to decrypt memo: UFVK decode failed", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const decryptedTx = await zcash.decryptTransaction(
      {
        hex: "transaction",
        height: 0,
        orchard: {
          actions: undefined,
          valueBalance: undefined,
          valueBalanceZat: 0,
        },
        time: 0,
        txid: "",
        blockhash: "",
      },
      "viewingkey",
    );
    expect(decryptedTx).toEqual(undefined);
  });

  test("fails to decrypt memo: hex decode failed", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const decryptedTx = await zcash.decryptTransaction(
      {
        hex: "transaction",
        height: 0,
        orchard: {
          actions: undefined,
          valueBalance: undefined,
          valueBalanceZat: 0,
        },
        time: 0,
        txid: "",
        blockhash: "",
      },
      testAccount1.viewingKey,
    );
    expect(decryptedTx).toEqual(undefined);
  });

  describe.each(testAccount1.transactions)(
    `decrypts transactions for account 1 (sender's viewing key)`,
    ({ description, tx, decryptedData }) => {
      test(description, async () => {
        const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
        const decrypted = await zcash.decryptTransaction(tx, testAccount1.viewingKey);
        expect(decrypted).toMatchObject({
          blockHeight: tx.height || 0,
          id: tx.txid,
          hex: tx.hex,
          blockHash: tx.blockhash || "",
          timestamp: tx.time || 0,
          decryptedData,
        });
      });
    },
  );

  describe.each(testAccount1.transactions)(
    "decrypts transactions for account 2 (receiver's viewing key)",
    ({ description, tx, decryptedDataReceiver }) => {
      test(description, async () => {
        const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
        const decrypted = await zcash.decryptTransaction(tx, testAccount2.viewingKey);
        expect(decrypted).toMatchObject({
          blockHeight: tx.height || 0,
          id: tx.txid,
          hex: tx.hex,
          blockHash: tx.blockhash || "",
          timestamp: tx.time || 0,
          decryptedData: decryptedDataReceiver,
        });
      });
    },
  );
});

describe("findShieldedTxsInBlock", () => {
  test("retrieves outgoing for the sender's viewing key", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithMyTx,
      viewingKey: testAccount1.viewingKey,
    });

    expect(transactions).toEqual([
      {
        id: txShieldedOrchard.tx.txid,
        hex: txShieldedOrchard.tx.hex,
        blockHeight: blockWithMyTx.height,
        blockHash: blockWithMyTx.hash,
        timestamp: blockWithMyTx.time,
        fee: new BigNumber(txShieldedOrchard.tx.orchard.valueBalanceZat),
        decryptedData: txShieldedOrchard.decryptedData,
      },
    ]);
  });

  test("retrieves incoming for the receiver's viewing key", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithMyTx,
      viewingKey: testAccount2.viewingKey,
    });

    expect(transactions).toEqual([
      {
        id: txShieldedOrchard.tx.txid,
        hex: txShieldedOrchard.tx.hex,
        blockHeight: blockWithMyTx.height,
        blockHash: blockWithMyTx.hash,
        timestamp: blockWithMyTx.time,
        fee: new BigNumber(txShieldedOrchard.tx.orchard.valueBalanceZat),
        decryptedData: txShieldedOrchard.decryptedDataReceiver,
      },
    ]);
  });

  test("retrieves an empty list of transactions when viewing key doesn't match any", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithMyTx,
      viewingKey: "123abc",
    });

    expect(transactions).toEqual([]);
  });

  test("edge case: retrieves an empty list when the block doesn't have tx", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: dummyBlockMock("3000000"),
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([]);
  });

  test("edge case: retrieves an empty list when the block has empty tx", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...dummyBlockMock("3000000"), tx: ["", ""] },
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([]);
  });

  test("skips empty tx ids when scanning a block", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const getRawTransactionSpy = jest
      .spyOn(zcash.jsonRpcClient, "getRawTransaction")
      .mockResolvedValue({
        txid: "tx-valid",
        hex: "hex-valid",
        height: blockWithMyTx.height,
        blockhash: blockWithMyTx.hash,
        time: blockWithMyTx.time,
        orchard: {
          actions: [{}] as unknown as [],
          valueBalance: 0,
          valueBalanceZat: 0,
        },
      });

    const decryptTransactionSpy = jest.spyOn(zcash, "decryptTransaction").mockResolvedValue({
      id: "tx-valid",
      hex: "hex-valid",
      blockHeight: blockWithMyTx.height,
      blockHash: blockWithMyTx.hash,
      timestamp: blockWithMyTx.time,
      fee: new BigNumber(0),
    });

    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...blockWithMyTx, tx: ["", "tx-valid", ""] },
      viewingKey: testAccount1.viewingKey,
    });

    expect(getRawTransactionSpy).toHaveBeenCalledTimes(1);
    expect(getRawTransactionSpy).toHaveBeenCalledWith("tx-valid");
    expect(decryptTransactionSpy).toHaveBeenCalledTimes(1);
    expect(transactions).toHaveLength(1);
  });

  test("does not include transactions that fail decryption", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    jest.spyOn(zcash.jsonRpcClient, "getRawTransaction").mockResolvedValue({
      txid: "tx-failed-decrypt",
      hex: "hex-failed-decrypt",
      height: blockWithMyTx.height,
      blockhash: blockWithMyTx.hash,
      time: blockWithMyTx.time,
      orchard: {
        actions: [{}] as unknown as [],
        valueBalance: 0,
        valueBalanceZat: 0,
      },
    });
    const decryptTransactionSpy = jest
      .spyOn(zcash, "decryptTransaction")
      .mockResolvedValue(undefined);

    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...blockWithMyTx, tx: ["tx-failed-decrypt"] },
      viewingKey: testAccount1.viewingKey,
    });

    expect(decryptTransactionSpy).toHaveBeenCalledTimes(1);
    expect(transactions).toEqual([]);
  });
});

describe("syncShielded", () => {
  beforeEach(resetLastBlockCount);

  test.each([
    { maxBatchSize: -5, startBlockHeight: 5 },
    { maxBatchSize: 0, startBlockHeight: 5 },
    { maxBatchSize: 1, startBlockHeight: -1 },
  ])(
    "returns early if either maxBatchSize or startBlockHeight are invalid (negative or 0)",
    async (args: { maxBatchSize: number; startBlockHeight: number }) => {
      const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
      const syncedShieldedObs = zcash.syncShielded({
        viewingKey: "abc456",
        ...args,
      });

      const steps: Partial<ZcashPrivateInfo>[] = [];

      try {
        await syncedShieldedObs.forEach(step => steps.push(step));
      } catch (error) {
        expect(error).toMatch(/^error: invalid negative/);
      }

      expect(steps).toEqual([]);
      expect.assertions(2);
    },
  );

  test("rethrows when the network module throws an error", async () => {
    server.use(http.post(ZCASH_JSON_RPC_SERVER_TESTNET, () => HttpResponse.error()));

    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncedShieldedObs = zcash.syncShielded({
      startBlockHeight: blockWithMyTx.height,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize: 1,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    try {
      await syncedShieldedObs.forEach(step => steps.push(step));
    } catch (error) {
      expect(error).toMatchObject({ message: "Network error" });
    }

    expect(steps).toEqual([]);
    expect.assertions(2);
  });

  test("returns an empty shielded balance when the viewingKey doesn't match any shielded transactions", async () => {
    const startBlockHeight = testAccount1.transactions[0].tx.height;
    const lastBlockHeight = testAccount1.transactions[4].tx.height;
    const nBlocks = lastBlockHeight - startBlockHeight + 1;

    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncedShieldedObs = zcash.syncShielded({
      startBlockHeight,
      viewingKey: "abc456",
      maxBatchSize: 1,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    setLastBlockCount(lastBlockHeight);

    await syncedShieldedObs.forEach(value => {
      steps.push(value);
    });

    expect(steps.length).toBe(nBlocks);

    expect(steps).toEqual(
      expect.arrayOf(
        expect.objectContaining({
          syncState: expect.any(String),
          lastProcessedBlock: expect.any(Number),
          transactions: [],
        }),
      ),
    );
  });

  test("returns the shielded balance", async () => {
    const startBlockHeight = testAccount1.transactions[0].tx.height;
    const lastBlockHeight = testAccount1.transactions[4].tx.height;

    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncShieldedObs = zcash.syncShielded({
      startBlockHeight,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize: 1,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    setLastBlockCount(lastBlockHeight);

    await syncShieldedObs.forEach(step => {
      steps.push(step);
    });

    expect(steps[steps.length - 1]).toMatchObject({
      lastProcessedBlock: testAccount1.transactions[4].tx.height,
      syncState: "running",
      transactions: testAccount1.transactions.map(({ tx, decryptedData }) => ({
        id: tx.txid,
        hex: tx.hex,
        blockHeight: tx.height,
        blockHash: tx.blockhash,
        timestamp: tx.time,
        decryptedData: decryptedData,
      })),
    });
  });

  test("returns the shielded balance in batches of max size 3", async () => {
    const maxBatchSize = 3;
    const startBlockHeight = testAccount1.transactions[0].tx.height;
    const lastBlockHeight = testAccount1.transactions[4].tx.height;
    const nBlocks = lastBlockHeight - startBlockHeight + 1;

    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });

    const syncedShieldedObs = zcash.syncShielded({
      startBlockHeight,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    setLastBlockCount(lastBlockHeight);

    await syncedShieldedObs.forEach(syncedShielded => {
      steps.push(syncedShielded);
    });

    // checks that it completes in the correct amount of steps
    expect(steps.length).toBe(Math.ceil(nBlocks / maxBatchSize));

    expect(steps).toEqual(
      expect.arrayOf(
        expect.objectContaining({
          syncState: expect.any(String),
          lastProcessedBlock: expect.any(Number),
          transactions: expect.any(Array),
        }),
      ),
    );

    expect(steps[steps.length - 1]).toMatchObject({
      lastProcessedBlock: lastBlockHeight,
      syncState: "running",
      transactions: testAccount1.transactions.map(({ tx, decryptedData }) => ({
        id: tx.txid,
        hex: tx.hex,
        blockHeight: tx.height,
        blockHash: tx.blockhash,
        timestamp: tx.time,
        decryptedData: decryptedData,
      })),
    });
  });

  test("retrieves and processes also the latest block if a new blocks became available while processing", async () => {
    const maxBatchSize = 3;
    const startBlockHeight = testAccount1.transactions[0].tx.height;
    const lastBlockHeight = testAccount1.transactions[4].tx.height;
    const additionalLastBlocks = 2;

    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncShieldedObs = zcash.syncShielded({
      startBlockHeight,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize,
    });

    const steps: Partial<ZcashPrivateInfo>[] = [];
    setLastBlockCount(lastBlockHeight);

    await syncShieldedObs.forEach(value => {
      steps.push(value);

      // Note: Last block count increased while processing syncShielded!
      setLastBlockCount(lastBlockHeight + additionalLastBlocks);
    });

    expect(steps).toEqual(
      expect.arrayOf(
        expect.objectContaining({
          syncState: expect.any(String),
          lastProcessedBlock: expect.any(Number),
          transactions: expect.any(Array),
        }),
      ),
    );

    expect(steps[steps.length - 1]).toMatchObject({
      lastProcessedBlock: lastBlockHeight + additionalLastBlocks,
      syncState: "running",
      transactions: testAccount1.transactions.map(({ tx, decryptedData }) => ({
        id: tx.txid,
        hex: tx.hex,
        blockHeight: tx.height,
        blockHash: tx.blockhash,
        timestamp: tx.time,
        decryptedData: decryptedData,
      })),
    });
  });
});
