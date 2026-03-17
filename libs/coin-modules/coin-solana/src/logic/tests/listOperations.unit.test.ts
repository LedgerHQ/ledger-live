/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { DeepPartialReturn } from "@ledgerhq/coin-framework/test/utils";
import { PublicKey } from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { listOperations } from "../listOperations";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

describe("listOperations", () => {
  const mockGetSignaturesForAddress = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getSignaturesForAddress"]>
  >;
  const mockGetParsedTransactions = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getParsedTransactions"]>
  >;

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
          hash: "",
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

  it("should throw when order is asc", async () => {
    await expect(listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "asc" })).rejects.toThrow(
      "ascending order is not supported",
    );
  });

  describe("token operations", () => {
    const TOKEN_PROGRAM_ID_STR = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

    function makeTxWithTokenBalances(
      preTokenBalances: object[],
      postTokenBalances: object[],
      accountKeys: string[] = [TEST_ADDRESS],
    ) {
      return {
        transaction: {
          message: {
            accountKeys: accountKeys.map(k => ({ pubkey: new PublicKey(k) })),
            recentBlockhash: TEST_BLOCKHASH,
          },
        },
        meta: {
          fee: 5000,
          preBalances: accountKeys.map(() => 1_000_000),
          postBalances: accountKeys.map(() => 1_000_000),
          preTokenBalances,
          postTokenBalances,
        },
      };
    }

    it("should detect a fully spent token (present in pre, absent from post)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
          [],
          [TEST_ADDRESS, TEST_RECIPIENT],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].type).toBe("OUT");
      expect(tokenOps[0].value).toBe(5_000_000n);
    });

    it("should skip tokens with zero delta", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(0);
    });

    it("should fall back to spl-token for unknown programId", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: "UnknownProgramId111111111111111111111111111",
              uiTokenAmount: { amount: "1000000", decimals: 6, uiAmount: 1.0 },
            },
          ],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].asset).toEqual({
        type: "spl-token",
        assetReference: USDC_MINT,
        assetOwner: TEST_ADDRESS,
      });
      expect(tokenOps[0].details).toEqual({
        ledgerOpType: "IN",
        assetAmount: "1000000",
        assetSenders: [],
        assetRecipients: [TEST_ADDRESS],
        internal: true,
      });
    });

    it("should fall back to accountKeys for counterparty when not in token balances", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "3000000", decimals: 6, uiAmount: 3.0 },
            },
          ],
          [TEST_ADDRESS, TEST_RECIPIENT],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].type).toBe("OUT");
      expect(tokenOps[0].recipients).toEqual([TEST_RECIPIENT]);
    });

    it("should handle token operation with no counterparty (single account)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "1000000", decimals: 6, uiAmount: 1.0 },
            },
          ],
          [TEST_ADDRESS],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].type).toBe("IN");
      expect(tokenOps[0].senders).toEqual([]);
      expect(tokenOps[0].recipients).toEqual([TEST_ADDRESS]);
    });

    it("should handle multiple token changes in a single transaction", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "3000000", decimals: 6, uiAmount: 3.0 },
            },
            {
              accountIndex: 0,
              mint: BONK_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "9000000", decimals: 5, uiAmount: 90.0 },
            },
          ],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(2);

      const usdcOp = tokenOps.find(
        op => (op.asset as { assetReference?: string }).assetReference === USDC_MINT,
      )!;
      expect(usdcOp.type).toBe("OUT");
      expect(usdcOp.value).toBe(2_000_000n);

      const bonkOp = tokenOps.find(
        op => (op.asset as { assetReference?: string }).assetReference === BONK_MINT,
      )!;
      expect(bonkOp.type).toBe("IN");
      expect(bonkOp.value).toBe(9_000_000n);
    });

    it("should find counterparty in postTokenBalances when absent from preTokenBalances (new ATA)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
            },
          ],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "3000000", decimals: 6, uiAmount: 3.0 },
            },
            {
              accountIndex: 1,
              mint: USDC_MINT,
              owner: TEST_RECIPIENT,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "2000000", decimals: 6, uiAmount: 2.0 },
            },
          ],
          [TEST_ADDRESS, TEST_RECIPIENT],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].type).toBe("OUT");
      expect(tokenOps[0].recipients).toEqual([TEST_RECIPIENT]);
    });

    it("should include internal: true in token operation details", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [],
          [
            {
              accountIndex: 0,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: { amount: "1000000", decimals: 6, uiAmount: 1.0 },
            },
          ],
          [TEST_ADDRESS],
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].details).toEqual(expect.objectContaining({ internal: true }));
    });
  });
});
