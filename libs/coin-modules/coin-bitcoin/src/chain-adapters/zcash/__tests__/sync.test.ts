import {
  reduceShieldedSyncResult,
  createShieldedSyncObservable,
  zcashSyncShielded,
  setZainoGrpcUrl,
} from "../sync";
import { BtcOperation, BitcoinAccount } from "../../../types";
import type { ZcashAccount } from "../types";
import BigNumber from "bignumber.js";
import type { ShieldedTransaction, ShieldedSyncResult } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { DerivationMode } from "@ledgerhq/types-live";
import { firstValueFrom, from, Observable, of } from "rxjs";
import { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { createFixtureAccount } from "../../../fixtures/common.fixtures";
// ─── Mock ZCash ────────────────────────────────────────────────────────

const mockSyncShielded = jest.fn<Observable<ShieldedSyncResult>, [unknown]>();
const mockFindBlockHeight = jest.fn<Promise<number>, [number]>();

const mockCreateZCashClient = jest.fn<
  { syncShielded: typeof mockSyncShielded; findBlockHeight: typeof mockFindBlockHeight },
  [unknown]
>(() => ({
  syncShielded: mockSyncShielded,
  findBlockHeight: mockFindBlockHeight,
}));

jest.mock("../ZCash", () => ({
  createZCashClient: (args: unknown) => mockCreateZCashClient(args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  setZainoGrpcUrl(null);
});

describe("reduceShieldedSyncResult", () => {
  const createMockInfo = (overrides?: Partial<ZcashAccount>): any => ({
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
      accountUpdate: { balance: new BigNumber(890) } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [],
      lastProcessedBlock: 5000,
      processedBlocks: 0,
      remainingBlocks: 0,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [],
      accountUpdate: {
        blockHeight: 5000,
        balance: new BigNumber(890),
      },
    });
  });

  it("should never set balance or spendableBalance on the accountUpdate when processing shielded transactions", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(50000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [] as BtcOperation[] } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: new BigNumber(100000) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output.accountUpdate).not.toHaveProperty("balance");
    expect(output.accountUpdate).not.toHaveProperty("spendableBalance");
  });

  it("should merge new shielded operations and credit orchard balance for an incoming tx", () => {
    const initialBalance = new BigNumber(100000);
    const txAmount = new BigNumber(50000);

    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: txAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: new BigNumber(initialBalance) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [incomingTx],
      accountUpdate: {
        blockHeight: 100,
        privateInfo: {
          orchardBalance: txAmount,
        },
      },
    });
    expect(output.accountUpdate.operations).toHaveLength(1);
  });

  it("should merge new shielded operations and credit orchard balance when accumulated holds a transparent balance", () => {
    const accumulatedBalance = new BigNumber(1000);
    const txAmount = new BigNumber(50000);

    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: txAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        balance: new BigNumber(accumulatedBalance),
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({
      privateInfo: { orchardBalance: new BigNumber(100000) },
    } as Partial<ZcashAccount>);

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [incomingTx],
      accountUpdate: {
        blockHeight: 100,
        privateInfo: {
          orchardBalance: txAmount,
        },
      },
    });
    expect(output.accountUpdate.operations).toHaveLength(1);
  });

  it("should reflect outgoing and incoming notes as a net orchard delta without touching the transparent balance", () => {
    const initialBalance = new BigNumber(100000);
    const outgoingAmount = new BigNumber(20000);
    const incomingAmount = new BigNumber(5000);

    const outgoingTx: ShieldedTransaction = {
      id: "tx-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-out",
      timestamp: 1700000000,
      fee: new BigNumber(500),
      decryptedData: {
        orchard_outputs: [{ amount: outgoingAmount, memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const incomingTx: ShieldedTransaction = {
      id: "tx-in",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash-in",
      timestamp: 1700000001,
      fee: new BigNumber(300),
      decryptedData: {
        orchard_outputs: [{ amount: incomingAmount, memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        blockHeight: 99,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [outgoingTx, incomingTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: initialBalance });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(
      incomingAmount.minus(outgoingAmount),
    );
    expect(output.accountUpdate).not.toHaveProperty("balance");
    expect(output.accountUpdate).not.toHaveProperty("spendableBalance");
  });

  it("should accumulate orchard delta across chunks without touching the transparent balance", () => {
    const initialBalance = new BigNumber(10000);

    const outgoingTx: ShieldedTransaction = {
      id: "tx-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-out",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(3000), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const incomingTx: ShieldedTransaction = {
      id: "tx-in",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash-in",
      timestamp: 1700000001,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(4000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const incomingTx2: ShieldedTransaction = {
      id: "tx-in2",
      hex: "02",
      blockHeight: 101,
      blockHash: "hash-in2",
      timestamp: 1700000002,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(500), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const info = createMockInfo({ balance: initialBalance });

    const chunk1 = reduceShieldedSyncResult(
      {
        processedOperations: [],
        accountUpdate: { operations: [] as BtcOperation[] } as Partial<BitcoinAccount>,
      },
      {
        transactions: [outgoingTx, incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 1,
      },
      info,
      "acc-1",
    );
    expect(chunk1.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(1000));
    expect(chunk1.accountUpdate).not.toHaveProperty("balance");

    const chunk2 = reduceShieldedSyncResult(
      chunk1,
      {
        transactions: [incomingTx2],
        lastProcessedBlock: 101,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );
    expect(chunk2.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(1500));
    expect(chunk2.accountUpdate).not.toHaveProperty("balance");
  });

  it("should populate privateInfo in accountUpdate", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(5000), memo: "hello", transfer_type: "incoming" },
        ],
        sapling_outputs: [{ amount: new BigNumber(2000), memo: "", transfer_type: "incoming" }],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [] as BtcOperation[] } as Partial<BitcoinAccount>,
    };
    const info = createMockInfo({ balance: new BigNumber(10000) });

    const output = reduceShieldedSyncResult(
      accumulated,
      {
        transactions: [incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );

    expect(output.accountUpdate.privateInfo).toBeDefined();
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(2000));
    expect(output.accountUpdate.privateInfo?.transactions).toHaveLength(1);
    expect(output.accountUpdate.privateInfo?.syncState).toBe("complete");
  });

  it("should preserve ufvk and birthday from accumulated privateInfo", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(1000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          ufvk: "uview1testkey",
          birthday: "2023-01-01",
          orchardBalance: new BigNumber(0),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      } as Partial<BitcoinAccount>,
    };
    const info = createMockInfo({ balance: new BigNumber(10000) });

    const output = reduceShieldedSyncResult(
      accumulated,
      {
        transactions: [incomingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
      info,
      "acc-1",
    );

    expect(output.accountUpdate.privateInfo?.ufvk).toBe("uview1testkey");
    expect(output.accountUpdate.privateInfo?.birthday).toBe("2023-01-01");
    expect(output.accountUpdate.privateInfo?.lastProcessedBlock).toBe(100);
  });

  it("should reflect net incoming notes as a positive orchard delta even when the first note is outgoing (LIVE-27918)", () => {
    const tx: ShieldedTransaction = {
      id: "tx-net-in",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-net-in",
      timestamp: 1700000000,
      fee: new BigNumber(500),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(200), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(1000), memo: "", transfer_type: "incoming" },
        ],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(100000) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(800));
    expect(output.accountUpdate).not.toHaveProperty("balance");
  });

  it("should compute private deltas for both orchard and sapling notes (LIVE-27917)", () => {
    const tx: ShieldedTransaction = {
      id: "tx-mixed",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-mixed",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [{ amount: new BigNumber(2000), memo: "", transfer_type: "incoming" }],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(0) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(2000));
    expect(output.accountUpdate).not.toHaveProperty("balance");
  });

  it("should credit orchard balance for a transparent→shielded (shielding) tx without touching the transparent balance", () => {
    const tx: ShieldedTransaction = {
      id: "tx-shielding",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-shielding",
      timestamp: 1700000000,
      fee: new BigNumber(1000),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(9000), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(50000) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(9000));
    expect(output.accountUpdate).not.toHaveProperty("balance");
  });

  it("should debit orchard balance for a shielded→transparent (deshielding) tx without touching the transparent balance", () => {
    const tx: ShieldedTransaction = {
      id: "tx-deshielding",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-deshielding",
      timestamp: 1700000000,
      fee: new BigNumber(500),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(8000), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(50000) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(-8000));
    expect(output.accountUpdate).not.toHaveProperty("balance");
  });

  it("should debit orchard balance for a shielded→shielded (Orchard→Orchard) outgoing tx without touching the transparent balance", () => {
    const tx: ShieldedTransaction = {
      id: "tx-shielded-out",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-shielded-out",
      timestamp: 1700000000,
      fee: new BigNumber(200),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(5000), memo: "", transfer_type: "outgoing" },
          { amount: new BigNumber(1000), memo: "", transfer_type: "internal" },
        ],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(100000) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(-5000));
    expect(output.accountUpdate).not.toHaveProperty("balance");
  });

  it("should filter out already processed operations by blockHash", () => {
    const tx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(800), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [tx],
      accountUpdate: {
        balance: new BigNumber(700),
        blockHeight: 100,
      } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [tx],
      lastProcessedBlock: 100,
      processedBlocks: 0,
      remainingBlocks: 0,
    };
    const info = createMockInfo();

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [tx],
      accountUpdate: {
        blockHeight: 100,
        balance: new BigNumber(700),
      },
    });
  });
});

describe("createShieldedSyncObservable", () => {
  it("should emit accumulated account updates from shielded sync results", async () => {
    const tx1: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(120),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(3710), memo: "", transfer_type: "outgoing" }],
        sapling_outputs: [],
      },
    };

    const tx2: ShieldedTransaction = {
      id: "tx2",
      hex: "01",
      blockHeight: 100,
      blockHash: "hash2",
      timestamp: 1700000000,
      fee: new BigNumber(70),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(4321), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const tx3: ShieldedTransaction = {
      id: "tx3",
      hex: "02",
      blockHeight: 101,
      blockHash: "hash3",
      timestamp: 1800000000,
      fee: new BigNumber(40),
      decryptedData: {
        orchard_outputs: [{ amount: new BigNumber(585), memo: "", transfer_type: "incoming" }],
        sapling_outputs: [],
      },
    };

    const shieldedSyncRaw = from<ShieldedSyncResult[]>([
      {
        transactions: [tx1, tx2],
        lastProcessedBlock: 100,
        processedBlocks: 0,
        remainingBlocks: 0,
      },
      {
        transactions: [tx3],
        lastProcessedBlock: 101,
        processedBlocks: 0,
        remainingBlocks: 0,
      },
    ]);

    const info: any = {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as any,
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        balance: new BigNumber(33333),
      },
    };

    const observable = createShieldedSyncObservable(info, shieldedSyncRaw);
    const updates: Partial<BitcoinAccount>[] = [];

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: v => updates.push(v),
        error: reject,
        complete: resolve,
      });
    });

    expect(updates).toHaveLength(2);

    expect(updates[0]).toMatchObject({
      blockHeight: 100,
      privateInfo: {
        orchardBalance: new BigNumber(611),
      },
    });
    expect(updates[0]?.operations).toHaveLength(2);

    expect(updates[1]).toMatchObject({
      blockHeight: 101,
      privateInfo: {
        orchardBalance: new BigNumber(1196),
      },
    });
    expect(updates[1]?.operations).toHaveLength(3);
  });

  it("should populate privateInfo with shielded balances and transactions in each update", async () => {
    const saplingTx: ShieldedTransaction = {
      id: "tx-sapling",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-sapling",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [
          { amount: new BigNumber(3000), memo: "memo1", transfer_type: "incoming" },
        ],
      },
    };
    const orchardTx: ShieldedTransaction = {
      id: "tx-orchard",
      hex: "01",
      blockHeight: 101,
      blockHash: "hash-orchard",
      timestamp: 1700000001,
      fee: new BigNumber(50),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(2000), memo: "memo2", transfer_type: "incoming" },
        ],
        sapling_outputs: [],
      },
    };

    const shieldedSyncRaw = from<ShieldedSyncResult[]>([
      {
        transactions: [saplingTx],
        lastProcessedBlock: 100,
        processedBlocks: 1,
        remainingBlocks: 1,
      },
      {
        transactions: [orchardTx],
        lastProcessedBlock: 101,
        processedBlocks: 1,
        remainingBlocks: 0,
      },
    ]);

    const info: AccountShapeInfo<ZcashAccount> = {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: "0" as DerivationMode,
      initialAccount: {
        id: "js:2:zcash:xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4:0",
        xpub: "xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVYRpwYgqFjm6ewF7ppu9E2QzFjzQRJo9UapY2mRCGj4",
        operations: [],
        balance: new BigNumber(10000),
        privateInfo: {
          ufvk: "uview1testkey",
          birthday: "2023-01-01",
          orchardBalance: new BigNumber(0),
          saplingBalance: new BigNumber(0),
          syncState: "ready" as const,
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [],
        },
      } as unknown as ZcashAccount,
    };

    const observable = createShieldedSyncObservable(info, shieldedSyncRaw);
    const updates: Partial<ZcashAccount>[] = [];
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ next: v => updates.push(v), error: reject, complete: resolve });
    });

    expect(updates).toHaveLength(2);

    const pi1 = (updates[0] as Partial<ZcashAccount>).privateInfo;
    expect(pi1).toBeDefined();
    expect(pi1?.saplingBalance).toEqual(new BigNumber(3000));
    expect(pi1?.orchardBalance).toEqual(new BigNumber(0));
    expect(pi1?.transactions).toHaveLength(1);
    expect(pi1?.ufvk).toBe("uview1testkey");
    expect(pi1?.birthday).toBe("2023-01-01");

    const pi2 = (updates[1] as Partial<ZcashAccount>).privateInfo;
    expect(pi2?.saplingBalance).toEqual(new BigNumber(3000));
    expect(pi2?.orchardBalance).toEqual(new BigNumber(2000));
    expect(pi2?.transactions).toHaveLength(2);
    expect(pi2?.lastProcessedBlock).toBe(101);
  });
});

// ─── zcashSyncShielded tests ─────────────────

const currency = getCryptoCurrencyById("zcash");

function makePrivateInfo(overrides: Record<string, unknown> = {}) {
  return {
    ufvk: "uview1realkey",
    saplingBalance: new BigNumber(0),
    orchardBalance: new BigNumber(0),
    syncState: "complete" as const,
    birthday: null,
    lastSyncTimestamp: null,
    lastProcessedBlock: null,
    transactions: [],
    progress: 0,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ...overrides,
  };
}

function makeSyncResult(overrides: Partial<ShieldedSyncResult> = {}): ShieldedSyncResult {
  return {
    processedBlocks: 100,
    remainingBlocks: 0,
    lastProcessedBlock: 99,
    transactions: [],
    ...overrides,
  };
}

const defaultSyncConfig = {
  paginationConfig: { operationsPerAccountId: {}, operations: 0 },
};

describe("zcashSyncShielded", () => {
  test("returns an Observable", () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      },
      defaultSyncConfig,
    );

    expect(obs).toBeInstanceOf(Observable);
  });

  test("throws an error if ufvk is missing in privateInfo", async () => {
    const obs = zcashSyncShielded(
      { currency, address: "", index: 0, derivationPath: "", derivationMode: "" },
      defaultSyncConfig,
    );

    await expect(firstValueFrom(obs)).rejects.toThrow(
      "Missing unified full viewing key (ufvk) for ZCash shielded sync",
    );
    expect(mockCreateZCashClient).not.toHaveBeenCalled();
  });

  test("creates client with the default gRPC URL", async () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    expect(mockCreateZCashClient).toHaveBeenCalledWith(
      expect.objectContaining({ grpcUrl: expect.any(String) }),
    );
  });

  test("passes the viewing key and maxBatchSize to syncShielded", async () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          privateInfo: makePrivateInfo({ ufvk: "uview1mykey" }),
        },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    expect(mockSyncShielded).toHaveBeenCalledWith(
      expect.objectContaining({
        viewingKey: "uview1mykey",
        maxBatchSize: 5_000,
      }),
    );
  });

  test("starts at block 0 when lastProcessedBlock is null and birthday is null (first sync)", async () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          privateInfo: makePrivateInfo({ lastProcessedBlock: null, birthday: null }),
        },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    expect(mockFindBlockHeight).not.toHaveBeenCalled();
    expect(mockSyncShielded).toHaveBeenCalledWith(expect.objectContaining({ startBlockHeight: 0 }));
  });

  test("calls findBlockHeight with birthday timestamp when lastProcessedBlock is null", async () => {
    mockFindBlockHeight.mockResolvedValue(1_800_000);
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          privateInfo: makePrivateInfo({ lastProcessedBlock: null, birthday: "2024-01-01" }),
        },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    const expectedTs = Math.floor(new Date("2024-01-01").getTime() / 1000);
    expect(mockFindBlockHeight).toHaveBeenCalledWith(expectedTs);
    expect(mockSyncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ startBlockHeight: 1_800_000 }),
    );
  });

  test("lastProcessedBlock takes priority over birthday when both are set", async () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          privateInfo: makePrivateInfo({ lastProcessedBlock: 500, birthday: "2024-01-01" }),
        },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    expect(mockFindBlockHeight).not.toHaveBeenCalled();
    expect(mockSyncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ startBlockHeight: 501 }),
    );
  });

  test("resumes at lastProcessedBlock + 1 for incremental sync", async () => {
    mockSyncShielded.mockReturnValue(of(makeSyncResult({ lastProcessedBlock: 142 })));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          blockHeight: 42,
          privateInfo: makePrivateInfo({ lastProcessedBlock: 42 }),
        },
      },
      defaultSyncConfig,
    );

    const result = await firstValueFrom(obs);

    expect(mockSyncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ startBlockHeight: 43 }),
    );
    expect(result.lastProcessedBlock).toBe(142);
  });

  test("forwards the ShieldedSyncResult from ZCash", async () => {
    const expected = makeSyncResult({
      processedBlocks: 500,
      remainingBlocks: 100,
      lastProcessedBlock: 600,
      transactions: [
        {
          id: "txid1",
          hex: "deadbeef",
          blockHeight: 500,
          blockHash: "blockhash1",
          timestamp: 1700000000,
          fee: new BigNumber(10000),
          decryptedData: {
            orchard_outputs: [
              { amount: new BigNumber(5000), memo: "hello", transfer_type: "incoming" },
            ],
            sapling_outputs: [],
          },
        },
      ],
    });
    mockSyncShielded.mockReturnValue(of(expected));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      },
      defaultSyncConfig,
    );

    const result = await firstValueFrom(obs);

    expect(result).toEqual(expected);
  });

  test("propagates errors from ZCash.syncShielded", async () => {
    mockSyncShielded.mockReturnValue(
      new Observable(subscriber => subscriber.error(new Error("gRPC stream broken"))),
    );

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      },
      defaultSyncConfig,
    );

    await expect(firstValueFrom(obs)).rejects.toThrow("gRPC stream broken");
  });

  test("uses custom gRPC URL when set via setZainoGrpcUrl", async () => {
    setZainoGrpcUrl("https://custom-grpc.example.com");
    mockSyncShielded.mockReturnValue(of(makeSyncResult()));

    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: { ...createFixtureAccount(), privateInfo: makePrivateInfo() },
      },
      defaultSyncConfig,
    );

    await firstValueFrom(obs);

    expect(mockCreateZCashClient).toHaveBeenCalledWith(
      expect.objectContaining({ grpcUrl: "https://custom-grpc.example.com" }),
    );
  });

  test("throws when privateInfo exists but ufvk is null", async () => {
    const obs = zcashSyncShielded(
      {
        currency,
        address: "",
        index: 0,
        derivationPath: "",
        derivationMode: "",
        initialAccount: {
          ...createFixtureAccount(),
          privateInfo: makePrivateInfo({ ufvk: null }),
        },
      },
      defaultSyncConfig,
    );

    await expect(firstValueFrom(obs)).rejects.toThrow(
      "Missing unified full viewing key (ufvk) for ZCash shielded sync",
    );
  });
});
