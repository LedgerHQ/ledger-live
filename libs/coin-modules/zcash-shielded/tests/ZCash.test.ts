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
import { server } from "../mocks/node";
import { JSON_RPC_SERVER } from "../src/constants";

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
  test("finds the lowest block height", async () => {
    const zcash = new ZCash({ nodeUrl: JSON_RPC_SERVER });
    const height = await zcash.findBlockHeight(1234);
    expect(height).toEqual(1276);
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
});
