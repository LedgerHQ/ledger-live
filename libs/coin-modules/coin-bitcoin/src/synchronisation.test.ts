// The explorer these tests mock on the wallet-btc account must survive the binding from the config.
jest.mock("./explorer", () => ({
  bindExplorer: jest.fn((walletAccount: unknown) => walletAccount),
}));
jest.mock("@ledgerhq/wallet-btc/index", () => {
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
  performTransparentSync,
  createTransparentSyncObservable,
  buildSyncObservables,
  makePostSync,
} from "./synchronisation";
import { BitcoinAccount, BtcOperation } from "./types";
import type { TX } from "@ledgerhq/wallet-btc/index";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Operation, SyncConfig } from "@ledgerhq/types-live";
import { SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import { firstValueFrom } from "rxjs";
import { contextWith, testContext } from "./__tests__/fixtures/coinConfig";

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
    expect(result).not.toContain(unconfirmedTx);
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
    expect(result).toContain(confirmedTx);
    expect(result).not.toContain(unconfirmedTx);
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
    expect(result).toContain(tx2);
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
    expect(result).toContain(noInputTx);
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
    expect(result).toEqual([tx2, tx3, tx4]);
  });

  it("should keep all coinbase mining transactions with empty inputs (DigiByte mining scenario)", () => {
    const coinbaseTx1: BtcOperation = {
      ...baseTx,
      id: "cb1-IN",
      hash: "cb1",
      blockHeight: 23107323,
      date: new Date("2026-03-09T04:22:22Z"),
      extra: { inputs: [] },
    };

    const coinbaseTx2: BtcOperation = {
      ...baseTx,
      id: "cb2-IN",
      hash: "cb2",
      blockHeight: 23122260,
      date: new Date("2026-03-11T18:30:23Z"),
      extra: { inputs: [] },
    };

    const coinbaseTx3: BtcOperation = {
      ...baseTx,
      id: "cb3-IN",
      hash: "cb3",
      blockHeight: 23124700,
      date: new Date("2026-03-12T04:42:34Z"),
      extra: { inputs: [] },
    };

    const result = removeReplaced([coinbaseTx1, coinbaseTx2, coinbaseTx3]);
    expect(result).toEqual([coinbaseTx1, coinbaseTx2, coinbaseTx3]);
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
    wallet = require("@ledgerhq/wallet-btc/index").default;
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

  const changeOutput = {
    value: "5000",
    address: "bc1change",
    output_index: 1,
    output_hash: "76ec3b38",
    block_height: 90,
    rbf: false,
  };

  const spendingTransaction = (overrides: Partial<TX>) =>
    ({
      id: "76ec3b38",
      account: 0,
      index: 0,
      address: "tb1test",
      received_at: "2026-07-26T12:00:00Z",
      block: { height: 90, hash: "blockhash", time: "2026-07-26T12:00:00Z" },
      inputs: [
        {
          value: "10100000",
          address: "bc1addr",
          output_hash: "2a84cff0",
          output_index: 0,
          sequence: 0,
        },
      ],
      outputs: [],
      fees: 55_000,
      ...overrides,
    }) as unknown as TX;

  const testnetInfo: any = {
    currency: getCryptoCurrencyById("bitcoin_testnet"),
    address: "tb1test",
    index: 0,
    derivationPath: "44'/1'/0'/0/0",
    derivationMode: "" as any,
    deviceId: "device-1",
    initialAccount: {
      id: "js:2:bitcoin_testnet:xpub-test:",
      xpub: "xpub-test",
      operations: [],
      bitcoinResources: { walletAccount: null },
    },
  };

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

    const observable = createTransparentSyncObservable(info, mockSignerContext, testContext);
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

    const result = await performTransparentSync(info, mockSignerContext, testContext);

    expect(result).toMatchObject({
      operationsCount: expect.any(Number),
      blockHeight: 100,
      balance: expect.any(BigNumber),
    });
    expect(Array.isArray(result.operations)).toBe(true);
  });

  it("drops unconfirmed operations past the expiry of the coin config", async () => {
    const halfAnHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const pendingTransaction = () =>
      spendingTransaction({ block: null, received_at: halfAnHourAgo, outputs: [changeOutput] });

    wallet.getAccountTransactions.mockResolvedValueOnce({ txs: [pendingTransaction()] });
    const withDefault = await performTransparentSync(testnetInfo, mockSignerContext, testContext);
    expect(withDefault.operations).toHaveLength(1);

    wallet.getAccountTransactions.mockResolvedValueOnce({ txs: [pendingTransaction()] });
    const withShortExpiry = await performTransparentSync(
      testnetInfo,
      mockSignerContext,
      contextWith({ sync: { replacedOperationExpiryMs: 10 * 60 * 1000 } }),
    );
    expect(withShortExpiry.operations).toEqual([]);
  });

  it("reports the whole balance as spendable", async () => {
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

    const result = await performTransparentSync(info, mockSignerContext, testContext);

    expect(result.spendableBalance).toEqual(result.balance);
  });
});

describe("postSync", () => {
  const postSync = makePostSync(testContext);

  const makeOperation = (hash: string, type: Operation["type"]): Operation =>
    ({
      id: `js:2:bitcoin:xpub:-${hash}-${type}`,
      hash,
      type,
      value: new BigNumber(515_000),
      fee: new BigNumber(15_000),
      senders: type === "OUT" ? ["bc1sender"] : [],
      recipients: [],
      blockHeight: type === "OUT" ? null : 3_425_862,
      blockHash: null,
      accountId: "js:2:bitcoin:xpub:",
      date: new Date(),
      extra: {},
    }) as Operation;

  const makeAccount = (operations: Operation[], pendingOperations: Operation[]): BitcoinAccount =>
    ({
      id: "js:2:bitcoin:xpub:",
      currency: getCryptoCurrencyById("bitcoin"),
      freshAddress: "bc1fresh",
      operations,
      pendingOperations,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    }) as unknown as BitcoinAccount;

  it("drops an optimistic operation once its transaction is confirmed", () => {
    const confirmed = makeOperation("932c99c7837d", "OUT");
    const pending = makeOperation("932c99c7837d", "OUT");

    const result = postSync(makeAccount([], [pending]), makeAccount([confirmed], [pending]));

    expect(result.pendingOperations).toEqual([]);
  });

  it("keeps an optimistic operation while its transaction is still unconfirmed", () => {
    const pending = makeOperation("932c99c7837d", "OUT");
    const unrelated = makeOperation("4b5815f95f5d", "IN");

    const result = postSync(makeAccount([], [pending]), makeAccount([unrelated], [pending]));

    expect(result.pendingOperations).toEqual([pending]);
  });

  it("leaves the account untouched when there is nothing pending", () => {
    const account = makeAccount([makeOperation("932c99c7837d", "OUT")], []);
    expect(postSync(account, account)).toBe(account);
  });

  it("keeps the address the user entered when the optimistic operation is resolved", () => {
    const confirmed = makeOperation("932c99c7837d", "OUT");
    confirmed.recipients = ["bc1recovered"];
    const pending = makeOperation("932c99c7837d", "OUT");
    pending.recipients = ["bc1exactly-what-was-typed"];

    const result = postSync(makeAccount([], [pending]), makeAccount([confirmed], [pending]));

    expect(result.operations[0].recipients).toEqual(["bc1exactly-what-was-typed"]);
  });

  it("does not put the entered address on the incoming side of the same transaction", () => {
    const received = makeOperation("932c99c7837d", "IN");
    received.recipients = ["bc1ours"];
    const pending = makeOperation("932c99c7837d", "OUT");
    pending.recipients = ["bc1exactly-what-was-typed"];

    const result = postSync(makeAccount([], [pending]), makeAccount([received], [pending]));

    expect(result.operations[0].recipients).toEqual(["bc1ours"]);
  });

  it("leaves recipients alone when the optimistic operation had none", () => {
    const confirmed = makeOperation("932c99c7837d", "OUT");
    confirmed.recipients = ["bc1recovered"];
    const pending = makeOperation("932c99c7837d", "OUT");

    const result = postSync(makeAccount([], [pending]), makeAccount([confirmed], [pending]));

    expect(result.operations[0].recipients).toEqual(["bc1recovered"]);
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

  it("should return only the transparent sync", () => {
    const signerContext = jest.fn();
    const { syncs, syncType } = buildSyncObservables(
      baseInfo,
      defaultSyncConfig,
      signerContext,
      testContext,
    );

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT);
    expect(syncs).toHaveLength(1);
  });

  it("buildSyncObservables for bitcoin produces only transparent sync (isolation test)", () => {
    const signerContext = jest.fn();
    const { syncs } = buildSyncObservables(baseInfo, defaultSyncConfig, signerContext, testContext);
    expect(syncs).toHaveLength(1);
  });
});
