import type { DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { dropMemoLengthPrefixIfAny, listOperations } from "../listOperations";

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

  // The wallet owns no token account by default, so the only signature stream is its own and the
  // cases below read exactly as they did before token accounts were queried too.
  const mockGetParsedTokenAccountsByOwner = jest.fn().mockResolvedValue({ value: [] });
  const mockGetParsedToken2022AccountsByOwner = jest.fn().mockResolvedValue({ value: [] });

  const api = {
    getSignaturesForAddress: mockGetSignaturesForAddress,
    getParsedTransactions: mockGetParsedTransactions,
    getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner,
    getParsedToken2022AccountsByOwner: mockGetParsedToken2022AccountsByOwner,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
    mockGetParsedToken2022AccountsByOwner.mockResolvedValue({ value: [] });
  });

  it("should return empty list when no signatures found", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  // A batched transfer credits several accounts; keeping only the first silently dropped the rest.
  it("names every account the transaction credited", async () => {
    const second = "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx";
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
    ]);
    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(second) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 0, 0],
          postBalances: [799_995_000, 100_000_000, 100_000_000],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items[0]).toMatchObject({
      type: "OUT",
      senders: [TEST_ADDRESS],
      recipients: [TEST_RECIPIENT, second],
    });
  });

  // Ported from the legacy `getMainAccOperationTypeFromTx`: without these an ATA creation reads as
  // a plain fee payment, and a freeze as nothing at all.
  describe("account operations beyond transfers", () => {
    function singleInstruction(program: string, type: string) {
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        {
          transaction: {
            signatures: ["sig1"],
            message: {
              accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
              recentBlockhash: TEST_BLOCKHASH,
              instructions: [{ program, parsed: { type, info: {} } }],
            },
          },
          meta: { fee: 5000, preBalances: [1_000_000_000], postBalances: [999_995_000] },
        },
      ]);
    }

    it.each([
      ["spl-associated-token-account", "associate", "OPT_OUT"],
      ["spl-token", "closeAccount", "OPT_OUT"],
      ["spl-token", "freezeAccount", "FREEZE"],
      ["spl-token", "thawAccount", "UNFREEZE"],
      ["spl-token-2022", "thawAccount", "UNFREEZE"],
    ])("types a lone %s/%s instruction as %s", async (program, type, expected) => {
      singleInstruction(program, type);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0]).toMatchObject({ type: expected, value: 5000n });
    });

    it("leaves a transfer alone", async () => {
      singleInstruction("system", "transfer");

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0]).toMatchObject({ type: "FEES" });
    });

    // A memo rides alongside the real instruction; counting it would hide the operation's nature.
    it("ignores a memo when counting instructions", async () => {
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        {
          transaction: {
            signatures: ["sig1"],
            message: {
              accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
              recentBlockhash: TEST_BLOCKHASH,
              instructions: [
                { program: "spl-token", parsed: { type: "freezeAccount", info: {} } },
                { program: "spl-memo", parsed: { type: "memo", info: {} } },
              ],
            },
          },
          meta: { fee: 5000, preBalances: [1_000_000_000], postBalances: [999_995_000] },
        },
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0]).toMatchObject({ type: "FREEZE" });
    });
  });

  it("should return OUT operations from parsed transactions", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(TEST_RECIPIENT) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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

  // A third party sending SPL into an existing token account names neither the recipient wallet nor
  // its fee payer, so the transaction is absent from the wallet's own signature history. The legacy
  // bridge queried each token account for exactly this reason.
  it("finds an incoming token transfer through the token account's own history", async () => {
    const blockTime = 1700000000;
    const ata = "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi";
    const mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [{ pubkey: new PublicKey(ata) }],
    });
    // Empty for the wallet, one signature for its token account.
    mockGetSignaturesForAddress.mockImplementation(async (source: string) =>
      source === ata ? [{ signature: "sig-ata", slot: 100, blockTime, err: null }] : [],
    );

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig-ata"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(ata) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
          },
        },
        meta: {
          fee: 5000,
          preBalances: [1_000_000_000, 2_039_280],
          postBalances: [999_995_000, 2_039_280],
          preTokenBalances: [
            {
              accountIndex: 1,
              mint,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID.toBase58(),
              uiTokenAmount: { amount: "0" },
            },
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID.toBase58(),
              uiTokenAmount: { amount: "500" },
            },
          ],
        },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
    expect(result.items[0].value).toBe(500n);
  });

  it("should detect FEES operations when fee payer has zero net change", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig1"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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

    const txs = sigs.map(sig => ({
      transaction: {
        signatures: [sig.signature],
        message: {
          accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
          recentBlockhash: TEST_BLOCKHASH,
          instructions: [],
        },
      },
      meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
    }));
    mockGetParsedTransactions.mockResolvedValue(txs);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    // The cursor carries one `before` per signature stream, so assert what it resumes rather than
    // how it is encoded.
    mockGetSignaturesForAddress.mockClear();
    await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc", cursor: result.next });
    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(
      TEST_ADDRESS,
      expect.objectContaining({ before: "sig-99" }),
    );
  });

  // The cursor names the streams still to walk, so a paged sync must not re-read the token accounts.
  it("discovers the signature streams once, not on every page", async () => {
    const blockTime = 1700000000;
    const sigs = Array.from({ length: 100 }, (_, i) => ({
      signature: `sig-${i}`,
      slot: 200 - i,
      blockTime,
      err: null,
    }));
    mockGetSignaturesForAddress.mockResolvedValue(sigs);
    mockGetParsedTransactions.mockResolvedValue(sigs.map(() => null));

    const first = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });
    expect(mockGetParsedTokenAccountsByOwner).toHaveBeenCalledTimes(1);

    await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc", cursor: first.next });

    expect(mockGetParsedTokenAccountsByOwner).toHaveBeenCalledTimes(1);
  });

  it("should not set next cursor when result count is less than limit", async () => {
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
    ]);
    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig1"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig-low"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
          },
        },
        meta: { fee: 5000, preBalances: [1000000], postBalances: [995000] },
      },
      {
        transaction: {
          signatures: ["sig-high"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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

    const txs = sigs.map(sig => ({
      transaction: {
        signatures: [sig.signature],
        message: {
          accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
          recentBlockhash: TEST_BLOCKHASH,
          instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
      { signature: "sig1", slot: 101, blockTime, err: null },
      { signature: "sig2", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      null,
      {
        transaction: {
          signatures: ["sig2"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(OTHER_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_RECIPIENT) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(TEST_RECIPIENT) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(THIRD_ADDRESS) },
              { pubkey: new PublicKey(TEST_ADDRESS) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [
              { pubkey: new PublicKey(TEST_ADDRESS) },
              { pubkey: new PublicKey(OTHER) },
            ],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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
          signatures: ["sig1"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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

  it("should match each signature with its own transaction when the RPC batch is reordered", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 101, blockTime, err: null },
      { signature: "sig2", slot: 100, blockTime, err: null },
    ]);

    const txSig1 = {
      transaction: {
        signatures: ["sig1"],
        message: {
          accountKeys: [
            { pubkey: new PublicKey(TEST_ADDRESS) },
            { pubkey: new PublicKey(TEST_RECIPIENT) },
          ],
          recentBlockhash: TEST_BLOCKHASH,
          instructions: [],
        },
      },
      meta: {
        fee: 5000,
        preBalances: [1_000_000_000, 0],
        postBalances: [899_995_000, 100_000_000],
      },
    };
    const txSig2 = {
      transaction: {
        signatures: ["sig2"],
        message: {
          accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
          recentBlockhash: TEST_BLOCKHASH,
          instructions: [],
        },
      },
      meta: {
        fee: 5000,
        preBalances: [1_000_000_000],
        postBalances: [1_672_400_000],
      },
    };

    // JSON-RPC batch responses are not order-guaranteed: return them swapped.
    mockGetParsedTransactions.mockResolvedValue([txSig2, txSig1]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      tx: expect.objectContaining({ hash: "sig1" }),
      type: "OUT",
      value: 100_000_000n,
    });
    expect(result.items[1]).toMatchObject({
      tx: expect.objectContaining({ hash: "sig2" }),
      type: "IN",
      value: 672_405_000n,
    });
  });

  it("should skip signatures missing from the parsed transactions batch", async () => {
    const blockTime = 1700000000;
    mockGetSignaturesForAddress.mockResolvedValue([
      { signature: "sig1", slot: 101, blockTime, err: null },
      { signature: "sig2", slot: 100, blockTime, err: null },
    ]);

    mockGetParsedTransactions.mockResolvedValue([
      {
        transaction: {
          signatures: ["sig2"],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
          },
        },
        meta: { fee: 5000, preBalances: [1_000_000], postBalances: [995_000] },
      },
    ]);

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tx.hash).toBe("sig2");
  });

  it("should keep the cursor when a full page yields no operation", async () => {
    const blockTime = 1700000000;
    const sigs = Array.from({ length: 100 }, (_, i) => ({
      signature: `sig-${i}`,
      slot: 200 - i,
      blockTime,
      err: null,
    }));
    mockGetSignaturesForAddress.mockResolvedValue(sigs);
    mockGetParsedTransactions.mockResolvedValue(sigs.map(() => null));

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toEqual([]);
    mockGetSignaturesForAddress.mockClear();
    await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc", cursor: result.next });
    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(
      TEST_ADDRESS,
      expect.objectContaining({ before: "sig-99" }),
    );
  });

  it("should throw when order is asc", async () => {
    await expect(listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "asc" })).rejects.toThrow(
      "ascending order is not supported",
    );
  });

  describe("staking operations", () => {
    const VOTE_ACCOUNT = "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4";
    const STAKE_ACCOUNT = "9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b";

    function makeParsedIx(program: string, type: string, info?: Record<string, unknown>) {
      return { program, parsed: { type, info } };
    }

    function makeStakingTx(
      instructions: object[],
      {
        preBalance = 10_000_000_000,
        postBalance = 7_000_000_000,
        fee = 5000,
        signature = "sig1",
      } = {},
    ) {
      return {
        transaction: {
          signatures: [signature],
          message: {
            accountKeys: [{ pubkey: new PublicKey(TEST_ADDRESS) }],
            recentBlockhash: TEST_BLOCKHASH,
            instructions,
          },
        },
        meta: {
          fee,
          preBalances: [preBalance],
          postBalances: [postBalance],
        },
      };
    }

    it("should detect DELEGATE via create+delegate (3 instructions)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-delegate-create", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx(
          [
            makeParsedIx("system", "createAccountWithSeed"),
            makeParsedIx("stake", "initialize"),
            makeParsedIx("stake", "delegate", { voteAccount: VOTE_ACCOUNT }),
          ],
          { signature: "sig-delegate-create" },
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items).toHaveLength(1);
      const op = result.items[0];
      expect(op.type).toBe("DELEGATE");
      expect(op.value).toBe(0n);
      expect(op.details).toEqual({
        stake: { address: VOTE_ACCOUNT, amount: 3_000_000_000n },
      });
    });

    it("should detect DELEGATE via standalone delegate (1 instruction)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-delegate-solo", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx([makeParsedIx("stake", "delegate", { voteAccount: VOTE_ACCOUNT })], {
          signature: "sig-delegate-solo",
          preBalance: 5_000_000_000,
          postBalance: 4_999_995_000,
        }),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items).toHaveLength(1);
      const op = result.items[0];
      expect(op.type).toBe("DELEGATE");
      expect(op.value).toBe(0n);
      expect(op.details).toEqual({
        stake: { address: VOTE_ACCOUNT, amount: 5000n },
      });
    });

    it("should detect UNDELEGATE via deactivate", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-undelegate", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx([makeParsedIx("stake", "deactivate")], {
          signature: "sig-undelegate",
          preBalance: 5_000_000_000,
          postBalance: 4_999_995_000,
        }),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items).toHaveLength(1);
      const op = result.items[0];
      expect(op.type).toBe("UNDELEGATE");
      expect(op.value).toBe(0n);
      expect(op.details).toBeUndefined();
    });

    it("should detect WITHDRAW_UNBONDED via withdraw", async () => {
      const blockTime = 1700000000;
      const withdrawLamports = 2_000_000_000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-withdraw", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx(
          [
            makeParsedIx("stake", "withdraw", {
              stakeAccount: STAKE_ACCOUNT,
              lamports: withdrawLamports,
            }),
          ],
          {
            signature: "sig-withdraw",
            preBalance: 5_000_000_000,
            postBalance: 6_999_995_000,
            fee: 5000,
          },
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items).toHaveLength(1);
      const op = result.items[0];
      expect(op.type).toBe("WITHDRAW_UNBONDED");
      expect(op.value).toBe(5000n);
      expect(op.details).toEqual({
        stake: { address: STAKE_ACCOUNT, amount: BigInt(withdrawLamports) },
      });
    });

    it("should detect DELEGATE via createAccount (not createAccountWithSeed)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-delegate-create2", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx(
          [
            makeParsedIx("system", "createAccount"),
            makeParsedIx("stake", "initialize"),
            makeParsedIx("stake", "delegate", { voteAccount: VOTE_ACCOUNT }),
          ],
          { signature: "sig-delegate-create2" },
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("DELEGATE");
    });

    it("should not set feesPayer on DELEGATE operation", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-delegate", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx([makeParsedIx("stake", "delegate", { voteAccount: VOTE_ACCOUNT })], {
          signature: "sig-delegate",
        }),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0].type).toBe("DELEGATE");
      expect(result.items[0].tx.feesPayer).toBeUndefined();
    });

    it("should not set feesPayer on UNDELEGATE operation", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-undelegate", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx([makeParsedIx("stake", "deactivate")], {
          signature: "sig-undelegate",
        }),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0].type).toBe("UNDELEGATE");
      expect(result.items[0].tx.feesPayer).toBeUndefined();
    });

    it("should not set feesPayer on WITHDRAW_UNBONDED operation", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-withdraw", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeStakingTx(
          [
            makeParsedIx("stake", "withdraw", {
              stakeAccount: STAKE_ACCOUNT,
              lamports: 1_000_000_000,
            }),
          ],
          { signature: "sig-withdraw" },
        ),
      ]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items[0].type).toBe("WITHDRAW_UNBONDED");
      expect(result.items[0].tx.feesPayer).toBeUndefined();
    });

    it("should set feesPayer on native OUT operation (non-staking)", async () => {
      const blockTime = 1700000000;
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig-out", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        {
          transaction: {
            signatures: ["sig-out"],
            message: {
              accountKeys: [
                { pubkey: new PublicKey(TEST_ADDRESS) },
                { pubkey: new PublicKey(TEST_RECIPIENT) },
              ],
              recentBlockhash: TEST_BLOCKHASH,
              instructions: [],
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

      expect(result.items[0].type).toBe("OUT");
      expect(result.items[0].tx.feesPayer).toBe(TEST_ADDRESS);
    });
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
          signatures: ["sig1"],
          message: {
            accountKeys: accountKeys.map(k => ({ pubkey: new PublicKey(k) })),
            recentBlockhash: TEST_BLOCKHASH,
            instructions: [],
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

    // A burn empties the account like a send does, but the tokens go nowhere. Legacy typed it
    // `BURN` (`getTokenAccOperationType`); without it the history shows a transfer to no one.
    it("types a lone burn instruction as BURN", async () => {
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
      ]);
      const tx = makeTxWithTokenBalances(
        [
          {
            accountIndex: 0,
            mint: USDC_MINT,
            owner: TEST_ADDRESS,
            programId: TOKEN_PROGRAM_ID_STR,
            uiTokenAmount: { amount: "1000" },
          },
        ],
        [
          {
            accountIndex: 0,
            mint: USDC_MINT,
            owner: TEST_ADDRESS,
            programId: TOKEN_PROGRAM_ID_STR,
            uiTokenAmount: { amount: "400" },
          },
        ],
      );
      tx.transaction.message.instructions = [
        { program: "spl-token", parsed: { type: "burn", info: {} } },
      ] as never;
      mockGetParsedTransactions.mockResolvedValue([tx]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOp = result.items.find(op => op.asset.type !== "native");
      expect(tokenOp).toMatchObject({ type: "BURN", value: 600n });
    });

    // Freezing moves nothing, so the change carries a zero delta and is normally skipped. Only a
    // freeze or a thaw lifts that guard -- legacy also emitted a `NONE` for every idle touch.
    it.each([
      ["freezeAccount", "FREEZE"],
      ["thawAccount", "UNFREEZE"],
    ])("emits %s on the token account as %s", async (type, expected) => {
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
      ]);
      const balance = {
        accountIndex: 0,
        mint: USDC_MINT,
        owner: TEST_ADDRESS,
        programId: TOKEN_PROGRAM_ID_STR,
        uiTokenAmount: { amount: "1000" },
      };
      const tx = makeTxWithTokenBalances([balance], [balance]);
      tx.transaction.message.instructions = [
        { program: "spl-token", parsed: { type, info: {} } },
      ] as never;
      mockGetParsedTransactions.mockResolvedValue([tx]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOp = result.items.find(op => op.asset.type !== "native");
      expect(tokenOp).toMatchObject({ type: expected, value: 0n });
    });

    it("still skips a token account the transaction left untouched", async () => {
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime: 1700000000, err: null },
      ]);
      const balance = {
        accountIndex: 0,
        mint: USDC_MINT,
        owner: TEST_ADDRESS,
        programId: TOKEN_PROGRAM_ID_STR,
        uiTokenAmount: { amount: "1000" },
      };
      mockGetParsedTransactions.mockResolvedValue([makeTxWithTokenBalances([balance], [balance])]);

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      expect(result.items.find(op => op.asset.type !== "native")).toBeUndefined();
    });

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

    // Regression for LIVE-35047: Ledger Live / coin-service address token
    // sub-accounts by their token-account (ATA) address, but Solana's token
    // balance records only carry the wallet `owner`. Querying by the ATA must
    // still surface the token operation (previously the owner-only match dropped
    // it, making e.g. a swap's USDC leg invisible).
    it("surfaces token ops when queried by the token-account (ATA) address (LIVE-35047)", async () => {
      const blockTime = 1700000000;
      const TOKEN_ACCOUNT = "AVHhsobqNw3b3XD43fz7Crq3d3UxFYZfHAByh7ogZoeN";
      mockGetSignaturesForAddress.mockResolvedValue([
        { signature: "sig1", slot: 100, blockTime, err: null },
      ]);
      mockGetParsedTransactions.mockResolvedValue([
        makeTxWithTokenBalances(
          [
            {
              accountIndex: 1,
              mint: USDC_MINT,
              owner: TEST_ADDRESS, // Solana records the WALLET as owner, never the ATA
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: {
                amount: "3576636",
                decimals: 6,
                uiAmount: 3.576636,
              },
            },
          ],
          [
            {
              accountIndex: 1,
              mint: USDC_MINT,
              owner: TEST_ADDRESS,
              programId: TOKEN_PROGRAM_ID_STR,
              uiTokenAmount: {
                amount: "5112194",
                decimals: 6,
                uiAmount: 5.112194,
              },
            },
          ],
          [TEST_ADDRESS, TOKEN_ACCOUNT], // ATA is accountKeys[1]
        ),
      ]);

      // Query by the token-account address, not the wallet.
      const result = await listOperations(api, TOKEN_ACCOUNT, {
        minHeight: 0,
        order: "desc",
      });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0].type).toBe("IN");
      expect(tokenOps[0].value).toBe(1_535_558n);
      expect(tokenOps[0].asset).toEqual({
        type: "spl-token",
        assetReference: USDC_MINT,
        assetOwner: TEST_ADDRESS, // resolves to the wallet owner, not the queried ATA
      });
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

    // No fallback to `accountKeys`: an account absent from the token balances did not receive
    // anything, and the first one that isn't the owner is usually a program id.
    it("names no recipient when none appears in the token balances", async () => {
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
      expect(tokenOps[0].recipients).toEqual([]);
      expect(tokenOps[0].senders).toEqual([TEST_ADDRESS]);
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

  describe("dropMemoLengthPrefixIfAny", () => {
    // The RPC prefixes the memo with its length in *bytes*, which cannot index a UTF-16 string.
    it.each([
      ["[5] hello", "hello"],
      ["[6] héllo", "héllo"],
      ["[11] 🚀 to moon", "🚀 to moon"],
    ])("drops the length prefix of %s", (raw, expected) => {
      expect(dropMemoLengthPrefixIfAny(raw)).toBe(expected);
    });

    it.each(["no prefix at all", "[not a number] x", "[5]no space"])(
      "leaves %s untouched",
      memo => {
        expect(dropMemoLengthPrefixIfAny(memo)).toBe(memo);
      },
    );
  });
});
