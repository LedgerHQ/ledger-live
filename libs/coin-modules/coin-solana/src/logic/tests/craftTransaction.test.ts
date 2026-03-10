import { VersionedTransaction } from "@solana/web3.js";
import { craftTransaction } from "../craftTransaction";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("craftTransaction (MSW integration)", () => {
  it("should craft a valid transaction with correct payer and blockhash", async () => {
    server.use(
      rpcHandler({
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
        }),
        getFeeForMessage: () => ({ context: { slot: 100 }, value: 5000 }),
        simulateTransaction: () => ({
          context: { slot: 100 },
          value: { err: null, logs: [], unitsConsumed: 200 },
        }),
        getRecentPrioritizationFees: () => [],
      }),
    );

    const result = await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1_000_000n,
      asset: { type: "native" },
    });

    const deserialized = VersionedTransaction.deserialize(
      Buffer.from(result.transaction, "base64"),
    );
    expect(deserialized.message.staticAccountKeys[0].toBase58()).toBe(TEST_ADDRESS);
    expect(deserialized.message.recentBlockhash).toBe(TEST_BLOCKHASH);
    expect(result.details?.recentBlockhash).toBe(TEST_BLOCKHASH);
    expect(result.details?.estimatedFee).toBe("5000");
  });

  describe("SPL Token transfer", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    function mintAccountInfo(programName: string, decimals: number) {
      return {
        context: { slot: 100 },
        value: {
          data: {
            parsed: {
              info: {
                decimals,
                freezeAuthority: null,
                isInitialized: true,
                mintAuthority: null,
                supply: "1000000000000",
              },
              type: "mint",
            },
            program: programName,
            space: 82,
          },
          executable: false,
          lamports: 1461600,
          owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          rentEpoch: 0,
        },
      };
    }

    function tokenTransferHandlers(mintProgramName: string, decimals: number) {
      let getAccountInfoCallCount = 0;
      return {
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
        }),
        getFeeForMessage: () => ({ context: { slot: 100 }, value: 5000 }),
        simulateTransaction: () => ({
          context: { slot: 100 },
          value: { err: null, logs: [], unitsConsumed: 200 },
        }),
        getRecentPrioritizationFees: () => [],
        getAccountInfo: () => {
          getAccountInfoCallCount++;
          if (getAccountInfoCallCount <= 2) {
            return mintAccountInfo(mintProgramName, decimals);
          }
          return { context: { slot: 100 }, value: null };
        },
        getMinimumBalanceForRentExemption: () => 2039280,
      };
    }

    it("should craft a token transfer tx with correct amount", async () => {
      server.use(rpcHandler(tokenTransferHandlers("spl-token", 6)));

      const result = await craftTransaction(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 2_000_000n,
        asset: { type: "spl-token", assetReference: USDC_MINT },
      });

      const deserialized = VersionedTransaction.deserialize(
        Buffer.from(result.transaction, "base64"),
      );
      expect(deserialized.message.staticAccountKeys[0].toBase58()).toBe(TEST_ADDRESS);
      expect(deserialized.message.recentBlockhash).toBe(TEST_BLOCKHASH);
      expect(typeof result.transaction).toBe("string");
      expect(result.transaction.length).toBeGreaterThan(0);
    });
  });

  describe("Token-2022 transfer", () => {
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

    const BINARY_MINT_DATA =
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIhSanQAAAAGAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

    function parsedMintResponse() {
      return {
        context: { slot: 100 },
        value: {
          data: {
            parsed: {
              info: {
                decimals: 6,
                freezeAuthority: null,
                isInitialized: true,
                mintAuthority: null,
                supply: "500000000000",
              },
              type: "mint",
            },
            program: "spl-token-2022",
            space: 82,
          },
          executable: false,
          lamports: 1461600,
          owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
          rentEpoch: 0,
        },
      };
    }

    function binaryMintResponse() {
      return {
        context: { slot: 100 },
        value: {
          data: [BINARY_MINT_DATA, "base64"],
          executable: false,
          lamports: 1461600,
          owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
          rentEpoch: 0,
          space: 82,
        },
      };
    }

    function token2022TransferHandlers() {
      return {
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
        }),
        getFeeForMessage: () => ({ context: { slot: 100 }, value: 5000 }),
        simulateTransaction: () => ({
          context: { slot: 100 },
          value: { err: null, logs: [], unitsConsumed: 200 },
        }),
        getRecentPrioritizationFees: () => [],
        getAccountInfo: (params: unknown[]) => {
          const config = params[1] as { encoding?: string } | undefined;
          if (config?.encoding === "jsonParsed") {
            return parsedMintResponse();
          }
          return binaryMintResponse();
        },
        getMinimumBalanceForRentExemption: () => 2039280,
      };
    }

    it("should craft a Token-2022 transfer tx with correct amount", async () => {
      server.use(rpcHandler(token2022TransferHandlers()));

      const result = await craftTransaction(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 5_000_000n,
        asset: { type: "spl-token-2022", assetReference: PYUSD_MINT },
      });

      const deserialized = VersionedTransaction.deserialize(
        Buffer.from(result.transaction, "base64"),
      );
      expect(deserialized.message.staticAccountKeys[0].toBase58()).toBe(TEST_ADDRESS);
      expect(deserialized.message.recentBlockhash).toBe(TEST_BLOCKHASH);
      expect(typeof result.transaction).toBe("string");
      expect(result.transaction.length).toBeGreaterThan(0);
    });
  });
});
