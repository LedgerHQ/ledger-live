import { listOperations } from "../listOperations";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc.mock";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeParsedTx({
  accountKeys,
  fee = 5000,
  preBalances,
  postBalances,
  slot = 100,
  blockTime = 1700000000,
  err = null,
}: {
  accountKeys: { pubkey: string; signer: boolean; writable: boolean }[];
  fee?: number;
  preBalances: number[];
  postBalances: number[];
  slot?: number;
  blockTime?: number;
  err?: unknown;
}) {
  return {
    transaction: {
      signatures: ["sig-placeholder"],
      message: {
        accountKeys,
        recentBlockhash: TEST_BLOCKHASH,
        instructions: [],
      },
    },
    meta: {
      fee,
      preBalances,
      postBalances,
      err,
      preTokenBalances: [],
      postTokenBalances: [],
    },
    slot,
    blockTime,
    version: "legacy" as const,
  };
}

describe("listOperations (MSW integration)", () => {
  it("should return empty page when no signatures found", async () => {
    server.use(
      rpcHandler({
        getSignaturesForAddress: () => [],
      }),
    );

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("should parse an OUT operation from RPC data", async () => {
    const blockTime = 1700000000;
    server.use(
      rpcHandler({
        getSignaturesForAddress: () => [
          {
            signature: "sig1",
            slot: 100,
            blockTime,
            err: null,
            memo: null,
            confirmationStatus: "finalized",
          },
        ],
        getTransaction: () =>
          makeParsedTx({
            accountKeys: [
              { pubkey: TEST_ADDRESS, signer: true, writable: true },
              { pubkey: TEST_RECIPIENT, signer: false, writable: true },
            ],
            preBalances: [1_000_000_000, 0],
            postBalances: [899_995_000, 100_000_000],
            slot: 100,
            blockTime,
          }),
      }),
    );

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toHaveLength(1);
    const op = result.items[0];
    expect(op.type).toBe("OUT");
    expect(op.value).toBe(100_000_000n);
    expect(op.senders).toEqual([TEST_ADDRESS]);
    expect(op.recipients).toEqual([TEST_RECIPIENT]);
    expect(op.tx.hash).toBe("sig1");
    expect(op.tx.fees).toBe(5000n);
    expect(op.tx.block.height).toBe(100);
    expect(op.tx.failed).toBe(false);
  });

  it("should filter by minHeight", async () => {
    const blockTime = 1700000000;
    server.use(
      rpcHandler({
        getSignaturesForAddress: () => [
          {
            signature: "sig-low",
            slot: 50,
            blockTime,
            err: null,
            memo: null,
            confirmationStatus: "finalized",
          },
          {
            signature: "sig-high",
            slot: 200,
            blockTime,
            err: null,
            memo: null,
            confirmationStatus: "finalized",
          },
        ],
        getTransaction: () =>
          makeParsedTx({
            accountKeys: [{ pubkey: TEST_ADDRESS, signer: true, writable: true }],
            preBalances: [1_000_000],
            postBalances: [995_000],
            blockTime,
          }),
      }),
    );

    const result = await listOperations(api, TEST_ADDRESS, { minHeight: 100, order: "desc" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tx.block.height).toBe(200);
  });

  it("should throw when order is asc", async () => {
    await expect(listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "asc" })).rejects.toThrow(
      "ascending order is not supported",
    );
  });

  describe("SPL Token operations", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

    it("should return an OUT token operation when sender's token balance decreases", async () => {
      const blockTime = 1700000000;
      server.use(
        rpcHandler({
          getSignaturesForAddress: () => [
            {
              signature: "sig-token-out",
              slot: 200,
              blockTime,
              err: null,
              memo: null,
              confirmationStatus: "finalized",
            },
          ],
          getTransaction: () => ({
            ...makeParsedTx({
              accountKeys: [
                { pubkey: TEST_ADDRESS, signer: true, writable: true },
                { pubkey: TEST_RECIPIENT, signer: false, writable: true },
              ],
              preBalances: [1_000_000_000, 2039280],
              postBalances: [999_995_000, 2039280],
              blockTime,
            }),
            meta: {
              fee: 5000,
              preBalances: [1_000_000_000, 2039280],
              postBalances: [999_995_000, 2039280],
              err: null,
              preTokenBalances: [
                {
                  accountIndex: 0,
                  mint: USDC_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
                },
              ],
              postTokenBalances: [
                {
                  accountIndex: 0,
                  mint: USDC_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "3000000", decimals: 6, uiAmount: 3.0 },
                },
                {
                  accountIndex: 1,
                  mint: USDC_MINT,
                  owner: TEST_RECIPIENT,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "2000000", decimals: 6, uiAmount: 2.0 },
                },
              ],
            },
          }),
        }),
      );

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);

      const op = tokenOps[0];
      expect(op.type).toBe("OUT");
      expect(op.value).toBe(2_000_000n);
      expect(op.senders).toEqual([TEST_ADDRESS]);
      expect(op.recipients).toEqual([TEST_RECIPIENT]);
      expect(op.asset).toEqual({
        type: "spl-token",
        assetReference: USDC_MINT,
      });
      expect(op.tx.hash).toBe("sig-token-out");
    });

    it("should return an IN token operation when recipient's token balance increases", async () => {
      const blockTime = 1700000000;
      server.use(
        rpcHandler({
          getSignaturesForAddress: () => [
            {
              signature: "sig-token-in",
              slot: 200,
              blockTime,
              err: null,
              memo: null,
              confirmationStatus: "finalized",
            },
          ],
          getTransaction: () => ({
            ...makeParsedTx({
              accountKeys: [
                { pubkey: TEST_RECIPIENT, signer: true, writable: true },
                { pubkey: TEST_ADDRESS, signer: false, writable: true },
              ],
              preBalances: [1_000_000_000, 500_000_000],
              postBalances: [999_995_000, 500_000_000],
              blockTime,
            }),
            meta: {
              fee: 5000,
              preBalances: [1_000_000_000, 500_000_000],
              postBalances: [999_995_000, 500_000_000],
              err: null,
              preTokenBalances: [
                {
                  accountIndex: 1,
                  mint: USDC_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "1000000", decimals: 6, uiAmount: 1.0 },
                },
              ],
              postTokenBalances: [
                {
                  accountIndex: 1,
                  mint: USDC_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "4000000", decimals: 6, uiAmount: 4.0 },
                },
                {
                  accountIndex: 0,
                  mint: USDC_MINT,
                  owner: TEST_RECIPIENT,
                  programId: TOKEN_PROGRAM_ID,
                  uiTokenAmount: { amount: "6000000", decimals: 6, uiAmount: 6.0 },
                },
              ],
            },
          }),
        }),
      );

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);

      const op = tokenOps[0];
      expect(op.type).toBe("IN");
      expect(op.value).toBe(3_000_000n);
      expect(op.recipients).toEqual([TEST_ADDRESS]);
      expect(op.senders).toEqual([TEST_RECIPIENT]);
      expect(op.asset).toEqual({
        type: "spl-token",
        assetReference: USDC_MINT,
      });
    });
  });

  describe("Token-2022 operations", () => {
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";
    const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

    it("should return an OUT Token-2022 operation", async () => {
      const blockTime = 1700000000;
      server.use(
        rpcHandler({
          getSignaturesForAddress: () => [
            {
              signature: "sig-t22-out",
              slot: 300,
              blockTime,
              err: null,
              memo: null,
              confirmationStatus: "finalized",
            },
          ],
          getTransaction: () => ({
            ...makeParsedTx({
              accountKeys: [
                { pubkey: TEST_ADDRESS, signer: true, writable: true },
                { pubkey: TEST_RECIPIENT, signer: false, writable: true },
              ],
              preBalances: [1_000_000_000, 2039280],
              postBalances: [999_995_000, 2039280],
              blockTime,
            }),
            meta: {
              fee: 5000,
              preBalances: [1_000_000_000, 2039280],
              postBalances: [999_995_000, 2039280],
              err: null,
              preTokenBalances: [
                {
                  accountIndex: 0,
                  mint: PYUSD_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_2022_PROGRAM_ID,
                  uiTokenAmount: { amount: "10000000", decimals: 6, uiAmount: 10.0 },
                },
              ],
              postTokenBalances: [
                {
                  accountIndex: 0,
                  mint: PYUSD_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_2022_PROGRAM_ID,
                  uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
                },
                {
                  accountIndex: 1,
                  mint: PYUSD_MINT,
                  owner: TEST_RECIPIENT,
                  programId: TOKEN_2022_PROGRAM_ID,
                  uiTokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 },
                },
              ],
            },
          }),
        }),
      );

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);

      const op = tokenOps[0];
      expect(op.type).toBe("OUT");
      expect(op.value).toBe(5_000_000n);
      expect(op.asset).toEqual({
        type: "spl-token-2022",
        assetReference: PYUSD_MINT,
      });
    });

    it("should return an IN Token-2022 operation", async () => {
      const blockTime = 1700000000;
      server.use(
        rpcHandler({
          getSignaturesForAddress: () => [
            {
              signature: "sig-t22-in",
              slot: 300,
              blockTime,
              err: null,
              memo: null,
              confirmationStatus: "finalized",
            },
          ],
          getTransaction: () => ({
            ...makeParsedTx({
              accountKeys: [
                { pubkey: TEST_RECIPIENT, signer: true, writable: true },
                { pubkey: TEST_ADDRESS, signer: false, writable: true },
              ],
              preBalances: [1_000_000_000, 500_000_000],
              postBalances: [999_995_000, 500_000_000],
              blockTime,
            }),
            meta: {
              fee: 5000,
              preBalances: [1_000_000_000, 500_000_000],
              postBalances: [999_995_000, 500_000_000],
              err: null,
              preTokenBalances: [],
              postTokenBalances: [
                {
                  accountIndex: 1,
                  mint: PYUSD_MINT,
                  owner: TEST_ADDRESS,
                  programId: TOKEN_2022_PROGRAM_ID,
                  uiTokenAmount: { amount: "8000000", decimals: 6, uiAmount: 8.0 },
                },
              ],
            },
          }),
        }),
      );

      const result = await listOperations(api, TEST_ADDRESS, { minHeight: 0, order: "desc" });

      const tokenOps = result.items.filter(op => op.asset.type !== "native");
      expect(tokenOps).toHaveLength(1);

      const op = tokenOps[0];
      expect(op.type).toBe("IN");
      expect(op.value).toBe(8_000_000n);
      expect(op.recipients).toEqual([TEST_ADDRESS]);
    });
  });
});
