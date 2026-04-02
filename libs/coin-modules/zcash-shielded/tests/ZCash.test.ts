import { ZCash } from "../src/ZCash";
import type { ZcashPrivateInfo } from "../src/types";
import {
  testAccount1,
  blockWithMyTx,
  txShieldedOrchard,
  blockWithoutMyTx,
  blockWithoutAnyTx,
  txShieldedNotMine,
  testAccount2,
  decryptedSaplingData,
  decryptedOrchardData,
  txShieldedSapling,
  LAST_BLOCK_COUNT,
} from "./testAccounts";
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
    const decryptedTx = await zcash.decryptTransaction({ hex: "transaction" }, "viewingkey");
    expect(decryptedTx).toEqual(undefined);
  });

  test("fails to decrypt memo: hex decode failed", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const decryptedTx = await zcash.decryptTransaction(
      { hex: "transaction" },
      testAccount1.viewingKey,
    );
    expect(decryptedTx).toEqual(undefined);
  });

  test("decrypts an orchard transaction", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.decryptTransaction(
      {
        hex: txShieldedOrchard.hex,
        height: 0,
        orchard: {
          actions: [],
          valueBalance: 0,
          valueBalanceZat: 0,
        },
        time: 0,
        txid: "",
        blockhash: "",
      },
      testAccount1.viewingKey,
    );
    expect(height).toMatchObject({
      decryptedData: decryptedOrchardData,
    });
  });

  test("decrypts a sapling transaction", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.decryptTransaction(
      {
        hex: txShieldedSapling.hex,
        height: 0,
        orchard: {
          actions: [],
          valueBalance: 0,
          valueBalanceZat: 0,
        },
        time: 0,
        txid: "",
        blockhash: "",
      },
      testAccount1.viewingKey,
    );
    expect(height).toMatchObject({
      decryptedData: decryptedSaplingData,
    });
  });

  test("returns empty list of actions when ufvk is not correct", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const height = await zcash.decryptTransaction(
      {
        hex: txShieldedSapling.hex,
        height: 0,
        orchard: {
          actions: [],
          valueBalance: 0,
          valueBalanceZat: 0,
        },
        time: 0,
        txid: "",
        blockhash: "",
      },
      testAccount2.viewingKey,
    );
    expect(height).toMatchObject({
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [],
      },
    });
  });
});

describe("findShieldedTxsInBlock", () => {
  test("retrieves a list of transactions for the viewing key", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithMyTx,
      viewingKey: testAccount1.viewingKey,
    });

    expect(transactions).toEqual([
      {
        id: txShieldedOrchard.txid,
        hex: txShieldedOrchard.hex,
        blockHeight: blockWithMyTx.height,
        blockHash: blockWithMyTx.hash,
        timestamp: blockWithMyTx.time,
        fee: new BigNumber(txShieldedOrchard.orchard.valueBalanceZat),
        decryptedData: decryptedOrchardData,
      },
    ]);
  });

  test("retrieves an empty list of transactions when viewing key doesn't match any", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithoutMyTx,
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([
      {
        id: txShieldedNotMine.txid,
        hex: txShieldedNotMine.hex,
        blockHeight: blockWithoutMyTx.height,
        blockHash: blockWithoutMyTx.hash,
        timestamp: blockWithoutMyTx.time,
        fee: new BigNumber(txShieldedNotMine.orchard.valueBalanceZat),
        decryptedData: {
          orchard_outputs: [],
          sapling_outputs: [],
        },
      },
    ]);
  });

  test("edge case: retrieves an empty list when the block doesn't have tx", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithoutAnyTx,
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([]);
  });

  test("edge case: retrieves an empty list when the block has emtpy tx", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...blockWithoutAnyTx, tx: ["", ""] },
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

  test("skips transactions without orchard actions", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const getRawTransactionSpy = jest
      .spyOn(zcash.jsonRpcClient, "getRawTransaction")
      .mockImplementation(async txId => {
        if (txId === "orchard-tx") {
          return {
            txid: "orchard-tx",
            hex: "hex-orchard",
            height: blockWithMyTx.height,
            blockhash: blockWithMyTx.hash,
            time: blockWithMyTx.time,
            orchard: {
              actions: [{}] as unknown as [],
              valueBalance: 0,
              valueBalanceZat: 0,
            },
          };
        }

        return {
          txid: "plain-tx",
          hex: "hex-plain",
          height: blockWithMyTx.height,
          blockhash: blockWithMyTx.hash,
          time: blockWithMyTx.time,
          orchard: {
            actions: [],
            valueBalance: 0,
            valueBalanceZat: 0,
          },
        };
      });

    const decryptTransactionSpy = jest.spyOn(zcash, "decryptTransaction").mockResolvedValue({
      id: "orchard-tx",
      hex: "hex-orchard",
      blockHeight: blockWithMyTx.height,
      blockHash: blockWithMyTx.hash,
      timestamp: blockWithMyTx.time,
      fee: new BigNumber(0),
    });

    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...blockWithMyTx, tx: ["plain-tx", "orchard-tx"] },
      viewingKey: testAccount1.viewingKey,
    });

    expect(getRawTransactionSpy).toHaveBeenCalledTimes(2);
    expect(decryptTransactionSpy).toHaveBeenCalledTimes(1);
    expect(decryptTransactionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ txid: "orchard-tx" }),
      testAccount1.viewingKey,
    );
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
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncedShieldedObs = zcash.syncShielded({
      startBlockHeight: blockWithMyTx.height,
      viewingKey: "abc456",
      maxBatchSize: 1,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    await syncedShieldedObs.forEach(value => {
      steps.push(value);
    });

    expect(steps.length).toBe(6);

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
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncShieldedObs = zcash.syncShielded({
      startBlockHeight: blockWithMyTx.height,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize: 1,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    await syncShieldedObs.forEach(step => steps.push(step));

    expect(steps[steps.length - 1]).toEqual({
      lastProcessedBlock: LAST_BLOCK_COUNT,
      syncState: "running",
      transactions: [
        {
          id: txShieldedOrchard.txid,
          hex: txShieldedOrchard.hex,
          blockHeight: blockWithMyTx.height,
          blockHash: blockWithMyTx.hash,
          timestamp: blockWithMyTx.time,
          fee: new BigNumber(txShieldedOrchard.orchard.valueBalanceZat),
          decryptedData: decryptedOrchardData,
        },
      ],
    });
  });

  test("returns the shielded balance in batches of max size 3", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const maxBatchSize = 3;
    const syncedShieldedObs = zcash.syncShielded({
      startBlockHeight: blockWithMyTx.height,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize,
    });
    const steps: Partial<ZcashPrivateInfo>[] = [];

    await syncedShieldedObs.forEach(syncedShielded => {
      steps.push(syncedShielded);
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

    expect(steps[steps.length - 1]).toEqual({
      lastProcessedBlock: LAST_BLOCK_COUNT,
      syncState: "running",
      transactions: [
        {
          id: txShieldedOrchard.txid,
          hex: txShieldedOrchard.hex,
          blockHeight: blockWithMyTx.height,
          blockHash: blockWithMyTx.hash,
          timestamp: blockWithMyTx.time,
          fee: new BigNumber(txShieldedOrchard.orchard.valueBalanceZat),
          decryptedData: decryptedOrchardData,
        },
      ],
    });
  });

  test("retrieves and processes also the latest block if a new blocks became available while processing", async () => {
    const zcash = new ZCash({ nodeUrl: ZCASH_JSON_RPC_SERVER_TESTNET });
    const syncShieldedObs = zcash.syncShielded({
      startBlockHeight: blockWithMyTx.height,
      viewingKey: testAccount1.viewingKey,
      maxBatchSize: 3,
    });

    const steps: Partial<ZcashPrivateInfo>[] = [];

    await syncShieldedObs.forEach(value => {
      steps.push(value);

      // Note: Last block count increased while processing syncShielded!
      setLastBlockCount(LAST_BLOCK_COUNT + 1);
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

    expect(steps[steps.length - 1]).toEqual({
      lastProcessedBlock: LAST_BLOCK_COUNT + 1,
      syncState: "running",
      transactions: [
        {
          id: txShieldedOrchard.txid,
          hex: txShieldedOrchard.hex,
          blockHeight: blockWithMyTx.height,
          blockHash: blockWithMyTx.hash,
          timestamp: blockWithMyTx.time,
          fee: new BigNumber(txShieldedOrchard.orchard.valueBalanceZat),
          decryptedData: decryptedOrchardData,
        },
      ],
    });
  });
});
