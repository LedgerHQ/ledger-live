import { PublicKey } from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { listOperations } from "../listOperations";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

describe("listOperations", () => {
  const mockGetSignaturesForAddress = jest.fn();
  const mockGetParsedTransactions = jest.fn();

  const api = {
    getSignaturesForAddress: mockGetSignaturesForAddress,
    getParsedTransactions: mockGetParsedTransactions,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty list when no signatures found", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("should return OUT operations from parsed transactions", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(TEST_RECIPIENT) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 0],
          postBalances: [899_995_000, 100_000_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: `${TEST_ADDRESS}-sig1-OUT-0`,
      type: "OUT",
      value: 100_000_000n,
      asset: { type: "native" },
      senders: [TEST_ADDRESS],
      recipients: [TEST_RECIPIENT],
      tx: {
        hash: "sig1",
        block: {
          height: 100,
          hash: TEST_BLOCKHASH,
          time: new Date(blockTime * 1000),
        },
        fees: 5000n,
        feesPayer: TEST_ADDRESS,
        date: new Date(blockTime * 1000),
        failed: false,
      },
    });
  });

  it("should detect IN operations", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 0],
          postBalances: [899_995_000, 100_000_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
    expect(result.items[0].value).toBe(BigInt(100_000_000));
    expect(result.items[0].senders).toEqual([TEST_RECIPIENT]);
    expect(result.items[0].recipients).toEqual([TEST_ADDRESS]);
  });

  it("should detect FEES operations when fee payer has zero net change", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000],
          postBalances: [999_995_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("FEES");
    expect(result.items[0].value).toBe(5000n);
  });

  it("should pass cursor as before parameter", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([]);

    await listOperations(api, TEST_ADDRESS, {
      minHeight: 0,
      cursor: "prev-sig-hash",
      order: "desc",
    });

    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(TEST_ADDRESS, {
      limit: 100,
      before: "prev-sig-hash",
    });
  });

  it("should set next cursor when result count equals limit", async () => {
    const blockTime = 1700000000;
    const sigs = Array.from({ length: 100 }, (_, i) => ({
      signature: `sig-${i}`,
      slot: 200 - i,
      blockTime,
      err: null,
    }));
    mockGetSignaturesForAddress.mockResolvedValue(sigs);

    const txs = sigs.map(() => ({
      transaction: {
        message: {
          accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
          recentBlockhash: TEST_BLOCKHASH,
        },
      },
      meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
    }));
    mockGetParsedTransactions.mockResolvedValue(txs);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.next).toBe("sig-99");
  });

  it("should not set next cursor when result count is less than limit", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
    ]);
    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.next).toBeUndefined();
  });

  it("should filter by minHeight", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig-low", slot: 50, blockTime, err: null },
      { signature: "sig-high", slot: 200, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 100, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tx.block.height).toBe(200);
  });

  it("should not set next cursor when all items are filtered by minHeight", async () => {
    const blockTime = 1700000000;
    const sigs = Array.from({ length: 100 }, (_, i) => ({
      signature: `sig-${i}`,
      slot: 10 + i,
      blockTime,
      err: null,
    }));
    mockGetSignaturesForAddress.mockResolvedValue(sigs);

    const txs = sigs.map(() => ({
      transaction: {
        message: {
          accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
          recentBlockhash: TEST_BLOCKHASH,
        },
      },
      meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
    }));
    mockGetParsedTransactions.mockResolvedValue(txs);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 99999, order: "desc" });

    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("should mark failed transactions", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: { InstructionError: [0, "Custom"] } },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tx.failed).toBe(true);
  });

  it("should skip transactions with null meta", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
      { signature: "sig2", slot: 101, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      null,
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tx.hash).toBe("sig2");
  });

  it("should skip transactions where address is not in accountKeys", async () => {
    const blockTime = 1700000000;
    const OTHER_ADDRESS = "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b";
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(OTHER_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(0);
  });

  it("should detect NONE type for non-fee-payer with zero balance delta", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 500_000],
          postBalances: [999_995_000, 500_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("NONE");
    expect(result.items[0].value).toBe(0n);
  });

  it("should detect IN operation when fee payer receives funds (deltaWithoutFee > 0)", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(TEST_RECIPIENT) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [500_000_000, 600_000_000],
          postBalances: [699_995_000, 400_000_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
    expect(result.items[0].value).toBe(200_000_000n);
    expect(result.items[0].recipients).toEqual([TEST_ADDRESS]);
  });

  it("should detect OUT operation for non-fee-payer with negative balance delta", async () => {
    const blockTime = 1700000000;
    const THIRD_ADDRESS = "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b";
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(THIRD_ADDRESS) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [500_000_000, 300_000_000],
          postBalances: [699_995_000, 100_000_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("OUT");
    expect(result.items[0].value).toBe(200_000_000n);
    expect(result.items[0].senders).toEqual([TEST_ADDRESS]);
  });

  it("should handle no counterparty when all other accounts have zero balance delta", async () => {
    const blockTime = 1700000000;
    const OTHER = "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b";
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(OTHER) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 500_000],
          postBalances: [899_995_000, 500_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("OUT");
    expect(result.items[0].senders).toEqual([TEST_ADDRESS]);
    expect(result.items[0].recipients).toEqual([]);
  });

  it("should skip transactions with null blockTime", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime: null, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(0);
  });

  it("should propagate errors from getSignaturesForAddress", async () => {
    mockGetSignaturesForAddress.mockRejectedValue(new Error("RPC error"));

    await expect(
      listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" }),
    ).rejects.toThrow("RPC error");
  });

  it("should reverse items when order is asc", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig-first", slot: 200, blockTime, err: null },
      { signature: "sig-second", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
      {
        transaction: {
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "asc" });

    expect(result.items[0].tx.block.height).toBe(100);
    expect(result.items[1].tx.block.height).toBe(200);
  });
});
