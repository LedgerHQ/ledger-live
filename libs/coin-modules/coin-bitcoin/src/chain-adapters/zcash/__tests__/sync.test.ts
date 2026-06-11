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
  const createMockInfo = (overrides?: Partial<ZcashAccount>): any => {
    // `account.balance` now holds the transparent + private total. The transparent
    // portion is derived from the account's UTXOs, so back the provided `balance`
    // override with a single matching UTXO to represent the transparent balance.
    const transparent = overrides?.balance ?? new BigNumber(0);
    return {
      currency: getCryptoCurrencyById("zcash"),
      address: "zs1test",
      index: 0,
      derivationPath: "44'/133'/0'/0'",
      derivationMode: 0,
      initialAccount: overrides
        ? {
            ...overrides,
            bitcoinResources: overrides.bitcoinResources ?? {
              utxos: transparent.gt(0) ? [{ value: transparent }] : [],
            },
          }
        : undefined,
    };
  };

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
    const info = createMockInfo({ balance: new BigNumber(890) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    expect(output).toMatchObject({
      processedOperations: [],
      accountUpdate: {
        blockHeight: 5000,
        // balance = transparent(890) + orchard(0) = 890
        balance: new BigNumber(890),
      },
    });
  });

  it("marks existing notes as spent via spentKnownNullifiers even when no new transactions", () => {
    const NF1 = "aa".repeat(32);
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          orchardBalance: new BigNumber(100_000),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          ufvk: "uview1key",
          birthday: null,
          lastSyncTimestamp: null,
          lastProcessedBlock: 100,
          transactions: [
            {
              id: "tx-old",
              hex: "00",
              blockHeight: 100,
              blockHash: "hash-old",
              timestamp: 1700000000,
              fee: new BigNumber(0),
              decryptedData: {
                orchard_outputs: [
                  {
                    amount: new BigNumber(100_000),
                    memo: "",
                    transfer_type: "incoming",
                    isSpent: false,
                    nullifier: NF1,
                  },
                ],
                sapling_outputs: [],
              },
            },
          ],
          progress: 50,
          estimatedTimeRemaining: { hours: 0, minutes: 0 },
        },
      } as Partial<ZcashAccount>,
    };
    // Chunk with no new transactions but spentKnownNullifiers says NF1 was spent
    const result: ShieldedSyncResult = {
      transactions: [],
      lastProcessedBlock: 200,
      processedBlocks: 100,
      remainingBlocks: 0,
      spentKnownNullifiers: [NF1],
    };
    const info = createMockInfo({ balance: new BigNumber(0) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // The existing note must now be marked as spent
    const note =
      output.accountUpdate.privateInfo?.transactions?.[0]?.decryptedData?.orchard_outputs[0];
    expect(note?.isSpent).toBe(true);
    // Balance recomputed: no unspent notes -> 0
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(0));
  });

  it("should set balance to transparent + private and leave spendableBalance unset when processing shielded transactions", () => {
    const incomingTx: ShieldedTransaction = {
      id: "tx1",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash1",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(50000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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

    // balance = transparent(100000) + orchard(50000) = 150000; spendableBalance left to jsHelpers
    expect(output.accountUpdate.balance).toEqual(new BigNumber(150000));
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
        orchard_outputs: [
          { amount: txAmount, memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: txAmount, memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: outgoingAmount, memo: "", transfer_type: "outgoing", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: incomingAmount, memo: "", transfer_type: "incoming", isSpent: false },
        ],
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

    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(incomingAmount);
    // balance = transparent(100000) + orchard(5000)
    expect(output.accountUpdate.balance).toEqual(initialBalance.plus(incomingAmount));
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
        orchard_outputs: [
          { amount: new BigNumber(3000), memo: "", transfer_type: "outgoing", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: new BigNumber(4000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: new BigNumber(500), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
    expect(chunk1.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(4000));
    // balance = transparent(10000) + orchard(4000)
    expect(chunk1.accountUpdate.balance).toEqual(new BigNumber(14000));

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
    expect(chunk2.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(4500));
    // balance = transparent(10000) + orchard(4500)
    expect(chunk2.accountUpdate.balance).toEqual(new BigNumber(14500));
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
          { amount: new BigNumber(5000), memo: "hello", transfer_type: "incoming", isSpent: false },
        ],
        sapling_outputs: [
          { amount: new BigNumber(2000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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

    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(0));
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
        orchard_outputs: [
          { amount: new BigNumber(1000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
          { amount: new BigNumber(200), memo: "", transfer_type: "outgoing", isSpent: false },
          { amount: new BigNumber(1000), memo: "", transfer_type: "incoming", isSpent: false },
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
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(1000));
    // balance = transparent(100000) + orchard(1000)
    expect(output.accountUpdate.balance).toEqual(new BigNumber(101000));
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
        orchard_outputs: [
          { amount: new BigNumber(5000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
        sapling_outputs: [
          { amount: new BigNumber(2000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(0) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(5000));
    expect(output.accountUpdate.privateInfo?.saplingBalance).toEqual(new BigNumber(0));
    // balance = transparent(0) + orchard(5000)
    expect(output.accountUpdate.balance).toEqual(new BigNumber(5000));
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
        orchard_outputs: [
          { amount: new BigNumber(9000), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
    // balance = transparent(50000) + orchard(9000)
    expect(output.accountUpdate.balance).toEqual(new BigNumber(59000));
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
        orchard_outputs: [
          { amount: new BigNumber(8000), memo: "", transfer_type: "outgoing", isSpent: false },
        ],
        sapling_outputs: [],
      },
    };
    const output = reduceShieldedSyncResult(
      { processedOperations: [], accountUpdate: { operations: [] } as Partial<ZcashAccount> },
      { transactions: [tx], lastProcessedBlock: 100, processedBlocks: 1, remainingBlocks: 0 },
      createMockInfo({ balance: new BigNumber(50000) }),
      "acc-1",
    );
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(0));
    // balance = transparent(50000) + orchard(0)
    expect(output.accountUpdate.balance).toEqual(new BigNumber(50000));
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
          { amount: new BigNumber(5000), memo: "", transfer_type: "outgoing", isSpent: false },
          { amount: new BigNumber(1000), memo: "", transfer_type: "internal", isSpent: false },
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
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(1000));
    // balance = transparent(100000) + orchard(1000)
    expect(output.accountUpdate.balance).toEqual(new BigNumber(101000));
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
        orchard_outputs: [
          { amount: new BigNumber(800), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
    const info = createMockInfo({ balance: new BigNumber(700) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // balance = transparent(700) + orchard(0)
    expect(output).toMatchObject({
      processedOperations: [tx],
      accountUpdate: {
        blockHeight: 100,
        balance: new BigNumber(700),
      },
    });
  });

  it("uses note-based balance when isSpent fields are present (enriched notes with isSpent)", () => {
    // Two notes with isSpent — balance is direct sum, not delta
    const incomingTx: ShieldedTransaction = {
      id: "tx-enriched",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-enriched",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(5000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "aa".repeat(32),
          },
          {
            amount: new BigNumber(3000),
            memo: "",
            transfer_type: "internal",
            isSpent: false,
            nullifier: "bb".repeat(32),
          },
        ],
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
    const info = createMockInfo({ balance: new BigNumber(0) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // Direct sum: 5000 (incoming) + 3000 (internal) = 8000
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(8000));
  });

  it("treats notes without isSpent as unspent (conservative)", () => {
    const tx: ShieldedTransaction = {
      id: "tx-no-isspent",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-no-isspent",
      timestamp: 1700000000,
      fee: new BigNumber(100),
      decryptedData: {
        orchard_outputs: [
          { amount: new BigNumber(4000), memo: "", transfer_type: "incoming" } as any,
        ],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [] as BtcOperation[] } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [tx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: new BigNumber(0) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // Notes without isSpent are treated as unspent (conservative)
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(4000));
    expect(output.accountUpdate.privateInfo?.syncState).toBe("complete");
  });

  it("self-send scenario: balance = unspent incoming + unspent internal (not inflated by delta)", () => {
    // Self-send: 1 outgoing + 1 incoming (recipient = self) + 1 internal (change)
    // With delta: balance = incoming + internal - outgoing (would be wrong if amounts differ)
    // With note-based: balance = sum of notes where isSpent === false (correct)
    const selfSendTx: ShieldedTransaction = {
      id: "tx-selfsend",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-selfsend",
      timestamp: 1700000000,
      fee: new BigNumber(200),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(10000),
            memo: "",
            transfer_type: "outgoing",
            isSpent: true, // outgoing to recipient — excluded from balance
            nullifier: "aa".repeat(32),
          },
          {
            amount: new BigNumber(8000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false, // received at self address
            nullifier: "bb".repeat(32),
          },
          {
            amount: new BigNumber(1800),
            memo: "",
            transfer_type: "internal",
            isSpent: false, // change note
            nullifier: "cc".repeat(32),
          },
        ],
        sapling_outputs: [],
      },
    };
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: { operations: [] as BtcOperation[] } as Partial<ZcashAccount>,
    };
    const result: ShieldedSyncResult = {
      transactions: [selfSendTx],
      lastProcessedBlock: 100,
      processedBlocks: 1,
      remainingBlocks: 0,
    };
    const info = createMockInfo({ balance: new BigNumber(0) });

    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // Note-based: 8000 (incoming, unspent) + 1800 (internal, unspent) = 9800
    // Delta would give: 8000 + 1800 - 10000 = -200 (wrong!)
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(9800));
  });

  // ── scenario: incremental sync spent detection ──────────────

  it("incremental sync: marks previously-stored note as spent via spentKnownNullifiers", () => {
    // Scan 1 result: TX1 received 2.5M ZEC, note has NF1, isSpent=false
    const NF1 = "aa".repeat(32);
    const NF2 = "bb".repeat(32);
    const NF3 = "cc".repeat(32);

    const tx1: ShieldedTransaction = {
      id: "tx1-receive",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-100",
      timestamp: 1700000000,
      fee: new BigNumber(0),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(2_500_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: NF1,
          },
        ],
        sapling_outputs: [],
      },
    };

    // Accumulated state from previous sync: TX1 stored, balance = 2.5M
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          orchardBalance: new BigNumber(2_500_000),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          ufvk: "uview1key",
          birthday: null,
          lastSyncTimestamp: null,
          lastProcessedBlock: 100,
          transactions: [tx1],
          progress: 50,
          estimatedTimeRemaining: { hours: 0, minutes: 0 },
        },
      } as Partial<ZcashAccount>,
    };

    // Scan 2: TX2 is a self-send that spends TX1's note (NF1).
    // Outputs: 100k (incoming, to own address) + 2.39M (incoming, change) + 10k fee
    const tx2: ShieldedTransaction = {
      id: "tx2-self-send",
      hex: "00",
      blockHeight: 200,
      blockHash: "hash-200",
      timestamp: 1700001000,
      fee: new BigNumber(10_000),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(100_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: NF2,
          },
          {
            amount: new BigNumber(2_390_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: NF3,
          },
        ],
        sapling_outputs: [],
      },
    };

    // Rust detected that NF1 (from knownNullifiers) was spent in this range
    const result: ShieldedSyncResult = {
      transactions: [tx2],
      lastProcessedBlock: 200,
      processedBlocks: 100,
      remainingBlocks: 0,
      spentKnownNullifiers: [NF1],
    };

    const info = createMockInfo({ balance: new BigNumber(0) });
    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // TX1's note must now be marked as spent
    const storedTx1 = output.accountUpdate.privateInfo?.transactions?.find(
      t => t.id === "tx1-receive",
    );
    expect(storedTx1?.decryptedData?.orchard_outputs[0].isSpent).toBe(true);

    // Balance = sum of unspent notes only
    // TX1.note: 2.5M isSpent=true → excluded
    // TX2.note1: 100k isSpent=false → included
    // TX2.note2: 2.39M isSpent=false → included
    // Total = 2,490,000 (= 2.5M - 10k fee)
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(2_490_000));
  });

  it("full sync: both TX1 and TX2 in same scan — isSpent set by Rust directly", () => {
    const NF1 = "aa".repeat(32);

    // Full scan: TX1 received, then TX2 spends it. Rust sets isSpent=true on TX1's note.
    const tx1: ShieldedTransaction = {
      id: "tx1-receive",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-100",
      timestamp: 1700000000,
      fee: new BigNumber(0),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(2_500_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: true,
            nullifier: NF1,
          },
        ],
        sapling_outputs: [],
      },
    };

    const tx2: ShieldedTransaction = {
      id: "tx2-self-send",
      hex: "00",
      blockHeight: 200,
      blockHash: "hash-200",
      timestamp: 1700001000,
      fee: new BigNumber(10_000),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(100_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "bb".repeat(32),
          },
          {
            amount: new BigNumber(2_390_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "cc".repeat(32),
          },
        ],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
      } as Partial<ZcashAccount>,
    };

    const result: ShieldedSyncResult = {
      transactions: [tx1, tx2],
      lastProcessedBlock: 200,
      processedBlocks: 200,
      remainingBlocks: 0,
    };

    const info = createMockInfo({ balance: new BigNumber(0) });
    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // Same expected balance: 2,490,000
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(2_490_000));
  });

  it("rescan deduplicates persisted transactions — stale isSpent=false copy must not inflate balance", () => {
    // Scenario: TX1 was stored with isSpent=false in a previous sync.
    // A full rescan finds TX1 again (now isSpent=true) plus TX2.
    // Without deduplication, both copies of TX1 end up in allShieldedTx
    // and the stale isSpent=false copy inflates the balance.
    const NF1 = "aa".repeat(32);

    const tx1Stale: ShieldedTransaction = {
      id: "tx1-receive",
      hex: "00",
      blockHeight: 100,
      blockHash: "hash-100",
      timestamp: 1700000000,
      fee: new BigNumber(0),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(100_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: NF1,
          },
        ],
        sapling_outputs: [],
      },
    };

    // Accumulated state from previous sync: TX1 stored with isSpent=false
    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          orchardBalance: new BigNumber(100_000),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          ufvk: "uview1key",
          birthday: null,
          lastSyncTimestamp: null,
          lastProcessedBlock: null,
          transactions: [tx1Stale],
          progress: 0,
          estimatedTimeRemaining: { hours: 0, minutes: 0 },
        },
      } as Partial<ZcashAccount>,
    };

    // Full rescan finds TX1 (now isSpent=true) and TX2
    const tx1Fresh: ShieldedTransaction = {
      ...tx1Stale,
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(100_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: true,
            nullifier: NF1,
          },
        ],
        sapling_outputs: [],
      },
    };

    const tx2: ShieldedTransaction = {
      id: "tx2-send",
      hex: "00",
      blockHeight: 200,
      blockHash: "hash-200",
      timestamp: 1700001000,
      fee: new BigNumber(10_000),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(10_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "bb".repeat(32),
          },
          {
            amount: new BigNumber(80_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "cc".repeat(32),
          },
        ],
        sapling_outputs: [],
      },
    };

    const result: ShieldedSyncResult = {
      transactions: [tx1Fresh, tx2],
      lastProcessedBlock: 200,
      processedBlocks: 200,
      remainingBlocks: 0,
    };

    const info = createMockInfo({ balance: new BigNumber(0) });
    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // TX1 must appear exactly once (the fresh version with isSpent=true)
    const txIds = output.accountUpdate.privateInfo?.transactions?.map(t => t.id) ?? [];
    expect(txIds.filter(id => id === "tx1-receive")).toHaveLength(1);

    // The surviving TX1 must be the fresh one (isSpent=true)
    const storedTx1 = output.accountUpdate.privateInfo?.transactions?.find(
      t => t.id === "tx1-receive",
    );
    expect(storedTx1?.decryptedData?.orchard_outputs[0].isSpent).toBe(true);

    // Balance = unspent notes only:
    // TX1: 100k isSpent=true → excluded
    // TX2.note1: 10k → included
    // TX2.note2: 80k → included
    // Total = 90,000 (NOT 190,000 which would happen with the duplicate)
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(90_000));
  });

  it("rescan with all-new transactions does not lose persisted transactions from other block ranges", () => {
    // TX-old is persisted from a previous scan and NOT re-scanned (different block range).
    // TX-new is found in the current scan. TX-old must be preserved.
    const txOld: ShieldedTransaction = {
      id: "tx-old",
      hex: "00",
      blockHeight: 50,
      blockHash: "hash-50",
      timestamp: 1699000000,
      fee: new BigNumber(0),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(200_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
            nullifier: "dd".repeat(32),
          },
        ],
        sapling_outputs: [],
      },
    };

    const accumulated = {
      processedOperations: [] as ShieldedTransaction[],
      accountUpdate: {
        operations: [] as BtcOperation[],
        privateInfo: {
          orchardBalance: new BigNumber(200_000),
          saplingBalance: new BigNumber(0),
          syncState: "running" as const,
          ufvk: "uview1key",
          birthday: null,
          lastSyncTimestamp: null,
          lastProcessedBlock: 100,
          transactions: [txOld],
          progress: 0,
          estimatedTimeRemaining: { hours: 0, minutes: 0 },
        },
      } as Partial<ZcashAccount>,
    };

    const txNew: ShieldedTransaction = {
      id: "tx-new",
      hex: "00",
      blockHeight: 200,
      blockHash: "hash-200",
      timestamp: 1700001000,
      fee: new BigNumber(0),
      decryptedData: {
        orchard_outputs: [
          {
            amount: new BigNumber(50_000),
            memo: "",
            transfer_type: "incoming",
            isSpent: false,
          },
        ],
        sapling_outputs: [],
      },
    };

    const result: ShieldedSyncResult = {
      transactions: [txNew],
      lastProcessedBlock: 200,
      processedBlocks: 100,
      remainingBlocks: 0,
    };

    const info = createMockInfo({ balance: new BigNumber(0) });
    const output = reduceShieldedSyncResult(accumulated, result, info, "acc-1");

    // Both transactions must be present
    const txIds = output.accountUpdate.privateInfo?.transactions?.map(t => t.id) ?? [];
    expect(txIds).toContain("tx-old");
    expect(txIds).toContain("tx-new");
    expect(txIds).toHaveLength(2);

    // Balance = 200k + 50k
    expect(output.accountUpdate.privateInfo?.orchardBalance).toEqual(new BigNumber(250_000));
  });
});

// ── Serialization round-trip for enriched notes ───────────────────────

describe("serialization round-trip (toRaw → fromRaw)", () => {
  // Import serialization functions inline to keep test isolation
  const { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } = jest.requireActual(
    "../serialization",
  ) as typeof import("../serialization");

  it("enriched note fields survive toRaw → fromRaw round-trip", () => {
    const info: import("../types").ZcashPrivateInfo = {
      orchardBalance: new BigNumber(500_000),
      saplingBalance: new BigNumber(0),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1key",
      birthday: null,
      lastSyncTimestamp: null,
      lastProcessedBlock: 200,
      transactions: [
        {
          id: "tx-roundtrip",
          hex: "00",
          blockHeight: 100,
          blockHash: "hash",
          timestamp: 1700000000,
          fee: new BigNumber(10_000),
          decryptedData: {
            orchard_outputs: [
              {
                amount: new BigNumber(500_000),
                memo: "test",
                transfer_type: "incoming",
                nullifier: "aa".repeat(32),
                rho: "ee".repeat(32),
                rseed: "bb".repeat(32),
                cmx: "cc".repeat(32),
                position: "42",
                recipient: "dd".repeat(43),
                isSpent: false,
              },
            ],
            sapling_outputs: [],
          },
        },
      ],
    };

    const raw = toZcashPrivateInfoRaw(info);
    const restored = fromZcashPrivateInfoRaw(raw);

    const note = restored.transactions[0].decryptedData?.orchard_outputs[0];
    expect(note?.amount).toEqual(new BigNumber(500_000));
    expect(note?.nullifier).toBe("aa".repeat(32));
    expect(note?.rho).toBe("ee".repeat(32));
    expect(note?.rseed).toBe("bb".repeat(32));
    expect(note?.cmx).toBe("cc".repeat(32));
    expect(note?.position).toBe("42");
    expect(note?.recipient).toBe("dd".repeat(43));
    expect(note?.isSpent).toBe(false);
  });

  it("is_spent snake_case in raw → isSpent camelCase after rehydration", () => {
    const info: import("../types").ZcashPrivateInfo = {
      orchardBalance: new BigNumber(100),
      saplingBalance: new BigNumber(0),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: null,
      birthday: null,
      lastSyncTimestamp: null,
      lastProcessedBlock: null,
      transactions: [
        {
          id: "tx-spent",
          hex: "00",
          blockHeight: 50,
          blockHash: "hash",
          timestamp: 1700000000,
          fee: new BigNumber(0),
          decryptedData: {
            orchard_outputs: [
              {
                amount: new BigNumber(100),
                memo: "",
                transfer_type: "incoming",
                isSpent: true,
                nullifier: "ff".repeat(32),
              },
            ],
            sapling_outputs: [],
          },
        },
      ],
    };

    const raw = toZcashPrivateInfoRaw(info);
    // Verify raw uses is_spent (snake_case)
    expect(
      (raw.transactions[0].decryptedData?.orchard_outputs[0] as Record<string, unknown>).is_spent,
    ).toBe(true);

    const restored = fromZcashPrivateInfoRaw(raw);
    // Verify restored uses isSpent (camelCase)
    expect(restored.transactions[0].decryptedData?.orchard_outputs[0].isSpent).toBe(true);
  });

  it("notes without enriched fields survive round-trip (pre-upgrade compat)", () => {
    const info: import("../types").ZcashPrivateInfo = {
      orchardBalance: new BigNumber(1000),
      saplingBalance: new BigNumber(0),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: null,
      birthday: null,
      lastSyncTimestamp: null,
      lastProcessedBlock: null,
      transactions: [
        {
          id: "tx-legacy",
          hex: "00",
          blockHeight: 10,
          blockHash: "hash",
          timestamp: 1700000000,
          fee: new BigNumber(0),
          decryptedData: {
            orchard_outputs: [
              { amount: new BigNumber(1000), memo: "", transfer_type: "incoming" } as any,
            ],
            sapling_outputs: [],
          },
        },
      ],
    };

    const raw = toZcashPrivateInfoRaw(info);
    const restored = fromZcashPrivateInfoRaw(raw);

    const note = restored.transactions[0].decryptedData?.orchard_outputs[0];
    expect(note?.amount).toEqual(new BigNumber(1000));
    expect(note?.nullifier).toBeUndefined();
    expect(note?.rseed).toBeUndefined();
    expect(note?.isSpent).toBeUndefined();
  });
});

// ── rehydrateSyncResult: spentKnownNullifiers passthrough ─────────────

describe("rehydrateSyncResult", () => {
  const { rehydrateSyncResult } = jest.requireActual(
    "../serialization/rehydrate",
  ) as typeof import("../serialization/rehydrate");

  it("passes spentKnownNullifiers through rehydration", () => {
    const raw: import("../types").ShieldedSyncResultRaw = {
      processedBlocks: 10,
      remainingBlocks: 0,
      transactions: [],
      spentKnownNullifiers: ["aa".repeat(32), "bb".repeat(32)],
    };

    const result = rehydrateSyncResult(raw);
    expect(result.spentKnownNullifiers).toEqual(["aa".repeat(32), "bb".repeat(32)]);
  });

  it("omits spentKnownNullifiers when absent in raw", () => {
    const raw: import("../types").ShieldedSyncResultRaw = {
      processedBlocks: 5,
      remainingBlocks: 0,
      transactions: [],
    };

    const result = rehydrateSyncResult(raw);
    expect(result.spentKnownNullifiers).toBeUndefined();
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
        orchard_outputs: [
          { amount: new BigNumber(3710), memo: "", transfer_type: "outgoing", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: new BigNumber(4321), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
        orchard_outputs: [
          { amount: new BigNumber(585), memo: "", transfer_type: "incoming", isSpent: false },
        ],
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
        orchardBalance: new BigNumber(4321),
      },
    });
    expect(updates[0]?.operations).toHaveLength(2);

    expect(updates[1]).toMatchObject({
      blockHeight: 101,
      privateInfo: {
        orchardBalance: new BigNumber(4906),
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
          { amount: new BigNumber(3000), memo: "memo1", transfer_type: "incoming", isSpent: false },
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
          { amount: new BigNumber(2000), memo: "memo2", transfer_type: "incoming", isSpent: false },
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
    expect(pi1?.saplingBalance).toEqual(new BigNumber(0));
    expect(pi1?.orchardBalance).toEqual(new BigNumber(0));
    expect(pi1?.transactions).toHaveLength(1);
    expect(pi1?.ufvk).toBe("uview1testkey");
    expect(pi1?.birthday).toBe("2023-01-01");

    const pi2 = (updates[1] as Partial<ZcashAccount>).privateInfo;
    expect(pi2?.saplingBalance).toEqual(new BigNumber(0));
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
              {
                amount: new BigNumber(5000),
                memo: "hello",
                transfer_type: "incoming",
                isSpent: false,
              },
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
