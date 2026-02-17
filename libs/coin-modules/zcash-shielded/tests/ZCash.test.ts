import ZCash from "../src/ZCash";
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
} from "./testAccounts";
import { server } from "./mocks/node";
import { JSON_RPC_SERVER } from "../src/constants";
import { JsonRpcClient } from "../src/jsonRpcClient";
import {
  createFindBlockHeightHandlers,
  largeChainScenario,
  smallChainScenario,
  emptyChainScenario,
} from "./mocks/findBlockHeightData";
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
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const estimatedSyncTime = await zcash.estimatedSyncTime(10);
    jest.setSystemTime(new Date("2016-10-28T00:20:00.000Z"));
    const estimatedSyncTimeResult = estimatedSyncTime();
    expect(estimatedSyncTimeResult).toEqual({ hours: 3, minutes: 20 });
  });
});

describe("findBlockHeight", () => {
  test("finds the highest block height at or before a given timestamp (mocked RPC)", async () => {
    server.use(...createFindBlockHeightHandlers(largeChainScenario));
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.findBlockHeight(1234);
    expect(height).toEqual(1276);
  });

  test("returns undefined when timestamp is negative", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.findBlockHeight(-1);
    expect(height).toBeUndefined();
  });

  test("returns undefined when timestamp is NaN", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.findBlockHeight(NaN);
    expect(height).toBeUndefined();
  });

  test("binary search: exact match returns that block height", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    // Block 5 has time 100 + 500 = 600
    const height = await zcash.findBlockHeight(600);
    expect(height).toEqual(5);
  });

  test("binary search: timestamp with no exact block returns highest block at or before that time", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    // Block 4 has time 500, block 5 has time 600. Timestamp 550 has no block; we return the highest height with time <= 550, i.e. block 4.
    const height = await zcash.findBlockHeight(550);
    expect(height).toEqual(4);
  });

  test("binary search: timestamp before first block returns 0", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    // Block 0 has time 100; timestamp 50 is before genesis
    const height = await zcash.findBlockHeight(50);
    expect(height).toEqual(0);
  });

  test("binary search: timestamp after last block returns tip", async () => {
    server.use(...createFindBlockHeightHandlers(smallChainScenario));
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    // Block 10 has time 1100; timestamp 2000 is in the future
    const height = await zcash.findBlockHeight(2000);
    expect(height).toEqual(10);
  });
});

describe("getBlockCount", () => {
  test("returns block count when network returns numeric result", async () => {
    server.use(
      http.post(JSON_RPC_SERVER, async ({ request }) => {
        const body = await request.clone().json();
        if (
          body &&
          typeof body === "object" &&
          "method" in body &&
          body.method === "getblockcount"
        ) {
          return HttpResponse.json({ result: 42 });
        }
      }),
    );
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    const count = await client.getBlockCount();
    expect(count).toBe(42);
  });

  test("calls network with POST, nodeUrl, getblockcount method and empty params", async () => {
    let capturedBody: unknown;
    server.use(
      http.post(JSON_RPC_SERVER, async ({ request }) => {
        const body = await request.clone().json();
        capturedBody = body;
        return HttpResponse.json({ result: 100 });
      }),
    );
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    await client.getBlockCount();
    expect(capturedBody).toEqual({
      jsonrpc: "2.0",
      id: 1,
      method: "getblockcount",
      params: [],
    });
  });

  test("returns undefined when RPC returns error", async () => {
    server.use(
      http.post(JSON_RPC_SERVER, () =>
        HttpResponse.json({
          error: { code: -1, message: "node error" },
        }),
      ),
    );
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    const count = await client.getBlockCount();
    expect(count).toBeUndefined();
  });

  test("returns undefined when response has no result", async () => {
    server.use(http.post(JSON_RPC_SERVER, () => HttpResponse.json({})));
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    const count = await client.getBlockCount();
    expect(count).toBeUndefined();
  });

  test("returns undefined when result is not a number (string)", async () => {
    server.use(http.post(JSON_RPC_SERVER, () => HttpResponse.json({ result: "100" })));
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    const count = await client.getBlockCount();
    expect(count).toBeUndefined();
  });

  test("returns undefined when result is not a number (object)", async () => {
    server.use(http.post(JSON_RPC_SERVER, () => HttpResponse.json({ result: {} })));
    const client = new JsonRpcClient(JSON_RPC_SERVER);
    const count = await client.getBlockCount();
    expect(count).toBeUndefined();
  });
});

describe("decryptTransaction", () => {
  test("fails to decrypt memo: UFVK decode failed", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const decryptedTx = await zcash.decryptTransaction("transaction", "viewingkey");
    expect(decryptedTx).toEqual(undefined);
  });

  test("fails to decrypt memo: hex decode failed", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const decryptedTx = await zcash.decryptTransaction("transaction", testAccount1.viewingKey);
    expect(decryptedTx).toEqual(undefined);
  });

  test("decrypts an orchard transaction", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.decryptTransaction(txShieldedOrchard.hex, testAccount1.viewingKey);
    expect(height).toEqual(decryptedOrchardData);
  });

  test("decrypts a sapling transaction", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.decryptTransaction(txShieldedSapling.hex, testAccount1.viewingKey);
    expect(height).toEqual(decryptedSaplingData);
  });

  test("returns empty list of actions when ufvk is not correct", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.decryptTransaction(txShieldedSapling.hex, testAccount2.viewingKey);
    expect(height).toEqual({
      orchard_outputs: [],
      sapling_outputs: [],
    });
  });
});

describe("findShieldedTxsInBlock", () => {
  test("retrieves a list of transactions for the viewing key", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithMyTx,
      viewingKey: testAccount1.viewingKey,
    });

    expect(transactions).toEqual([
      {
        id: txShieldedOrchard.txid,
        hex: txShieldedOrchard.hex,
        height: blockWithMyTx.height,
        blockHash: blockWithMyTx.hash,
        time: blockWithMyTx.time,
        fee: txShieldedOrchard.orchard.valueBalance,
        decryptedData: decryptedOrchardData,
      },
    ]);
  });

  test("retrieves an empty list of transactions when viewing key doesn't match any", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithoutMyTx,
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([
      {
        id: txShieldedNotMine.txid,
        hex: txShieldedNotMine.hex,
        height: blockWithoutMyTx.height,
        blockHash: blockWithoutMyTx.hash,
        time: blockWithoutMyTx.time,
        fee: txShieldedNotMine.orchard.valueBalance,
        decryptedData: {
          orchard_outputs: [],
          sapling_outputs: [],
        },
      },
    ]);
  });

  test("edge case: retrieves an empty list when the block doesn't have tx", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: blockWithoutAnyTx,
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([]);
  });

  test("edge case: retrieves an empty list when the block has emtpy tx", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const transactions = await zcash.findShieldedTxsInBlock({
      block: { ...blockWithoutAnyTx, tx: ["", ""] },
      viewingKey: testAccount1.viewingKey,
    });
    expect(transactions).toEqual([]);
  });
});

describe("syncShielded", () => {
  test("returns the shielded balance", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const { balance } = await zcash.syncShielded();
    expect(balance).toEqual(2);
  });
});
