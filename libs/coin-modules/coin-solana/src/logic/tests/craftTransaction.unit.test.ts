/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import {
  BlockhashWithExpiryBlockHeight,
  PublicKey,
  RecentPrioritizationFees,
  VersionedTransaction,
} from "@solana/web3.js";
import { transaction } from "../../__tests__/fixtures/helpers.fixture";
import type { ChainAPI } from "../../network";
import type { Transaction } from "../../types";
import { DUMMY_SIGNATURE } from "../../utils";
import { buildVersionedTransaction, craftTransaction } from "../craftTransaction";

jest.mock("../../network/chain/web3", () => ({
  ...jest.requireActual("../../network/chain/web3"),
  buildTransferInstructions: jest.fn().mockResolvedValue([]),
  buildTokenTransferInstructions: jest.fn().mockResolvedValue([]),
  getMaybeMintAccount: jest.fn(),
  getMaybeTokenMintProgram: jest.fn(),
  getMaybeTokenAccount: jest.fn(),
  findAssociatedTokenAccountPubkey: jest.fn(),
}));

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

// ---------------------------------------------------------------------------
// craftTransaction
// ---------------------------------------------------------------------------

describe("craftTransaction", () => {
  const mockGetLatestBlockhash = jest.fn();
  const mockGetFeeForMessage = jest.fn();

  const api = {
    getLatestBlockhash: mockGetLatestBlockhash,
    getFeeForMessage: mockGetFeeForMessage,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should craft a valid base64-encoded transaction with correct payer and blockhash", async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 280064048,
    });
    mockGetFeeForMessage.mockResolvedValue(5000);

    const result = await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    });

    const deserialized = VersionedTransaction.deserialize(
      Buffer.from(result.transaction, "base64"),
    );
    expect(deserialized.message.staticAccountKeys[0].toBase58()).toBe(TEST_ADDRESS);
    expect(deserialized.message.recentBlockhash).toBe(TEST_BLOCKHASH);
    expect(result.details?.recentBlockhash).toBe(TEST_BLOCKHASH);
    expect(result.details?.lastValidBlockHeight).toBe(280064048);
    expect(result.details?.estimatedFee).toBe("5000");
  });

  it("should use custom fees when provided and skip getFeeForMessage", async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 280064048,
    });

    const result = await craftTransaction(
      api,
      {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      },
      { value: 10000n },
    );

    expect(result.details?.estimatedFee).toBe("10000");
    expect(mockGetFeeForMessage).not.toHaveBeenCalled();
  });

  it("should throw for invalid sender address", async () => {
    await expect(
      craftTransaction(api, {
        intentType: "transaction",
        type: "send",
        sender: "invalid!!!",
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Invalid sender address");
  });

  it("should throw for invalid recipient address", async () => {
    await expect(
      craftTransaction(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: "invalid!!!",
        amount: 1000000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Invalid recipient address");
  });

  it("should throw for amount exceeding MAX_SAFE_INTEGER", async () => {
    await expect(
      craftTransaction(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: BigInt(Number.MAX_SAFE_INTEGER) + 1n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Amount exceeds safe integer range");
  });

  it("should throw for non-send intents", async () => {
    await expect(
      craftTransaction(api, {
        intentType: "staking",
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      } as unknown as TransactionIntent),
    ).rejects.toThrow("Only send transaction intents are supported");
  });

  it("should fallback to default fee (5000) when getFeeForMessage returns null", async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 280064048,
    });
    mockGetFeeForMessage.mockResolvedValue(null);

    const result = await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    });

    expect(result.details?.estimatedFee).toBe("5000");
  });

  it("should pass memo through to transfer command", async () => {
    const { buildTransferInstructions } = jest.requireMock("../../network/chain/web3");
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 280064048,
    });
    mockGetFeeForMessage.mockResolvedValue(5000);

    await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
      memo: "test memo",
    } as unknown as TransactionIntent);

    expect(buildTransferInstructions).toHaveBeenCalledWith(
      api,
      expect.objectContaining({ memo: "test memo" }),
    );
  });

  describe("Token-2022 transfer fee", () => {
    const {
      getMaybeMintAccount,
      getMaybeTokenMintProgram,
      getMaybeTokenAccount,
      findAssociatedTokenAccountPubkey,
      buildTokenTransferInstructions,
    } = jest.requireMock("../../network/chain/web3");

    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const CWIF_MINT = "7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1";
    const SENDER_ATA = new PublicKey("AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ");

    function setupTokenMocks(opts: {
      mintDecimals?: number;
      tokenProgram?: string;
      transferFeeConfig?:
        | {
            newerTransferFee: { epoch: number; maximumFee: number; transferFeeBasisPoints: number };
            olderTransferFee: { epoch: number; maximumFee: number; transferFeeBasisPoints: number };
          }
        | undefined;
      recipientAtaExists?: boolean;
      currentEpoch?: number;
    }) {
      const {
        mintDecimals = 6,
        tokenProgram = "spl-token-2022",
        transferFeeConfig,
        recipientAtaExists = true,
        currentEpoch = 100,
      } = opts;

      const extensions = transferFeeConfig
        ? [
            {
              extension: "transferFeeConfig",
              state: {
                ...transferFeeConfig,
                transferFeeConfigAuthority: null,
                withdrawWithheldAuthority: null,
                withheldAmount: 0,
              },
            },
          ]
        : undefined;

      getMaybeMintAccount.mockResolvedValue({
        decimals: mintDecimals,
        supply: "1000000000",
        isInitialized: true,
        mintAuthority: null,
        freezeAuthority: null,
        extensions,
      });
      getMaybeTokenMintProgram.mockResolvedValue(tokenProgram);
      getMaybeTokenAccount.mockResolvedValue(recipientAtaExists ? { mint: CWIF_MINT } : undefined);
      findAssociatedTokenAccountPubkey.mockResolvedValue(SENDER_ATA);
      buildTokenTransferInstructions.mockResolvedValue([]);

      const mockApi = {
        getLatestBlockhash: mockGetLatestBlockhash,
        getFeeForMessage: mockGetFeeForMessage,
        getEpochInfo: jest.fn().mockResolvedValue({ epoch: currentEpoch }),
        connection: {},
      } as unknown as ChainAPI;

      mockGetLatestBlockhash.mockResolvedValue({
        blockhash: TEST_BLOCKHASH,
        lastValidBlockHeight: 280064048,
      });
      mockGetFeeForMessage.mockResolvedValue(5000);

      return mockApi;
    }

    it("should calculate transfer fee for Token-2022 token with transferFeeConfig", async () => {
      const mockApi = setupTokenMocks({
        transferFeeConfig: {
          newerTransferFee: { epoch: 50, maximumFee: 1000000, transferFeeBasisPoints: 100 },
          olderTransferFee: { epoch: 0, maximumFee: 500000, transferFeeBasisPoints: 50 },
        },
        currentEpoch: 100,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        asset: { type: "spl-token-2022", assetReference: CWIF_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.objectContaining({
          extensions: expect.objectContaining({
            transferFee: expect.objectContaining({
              transferFee: expect.any(Number),
              transferAmountIncludingFee: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it("should not set extensions for SPL token without transfer fee config", async () => {
      const mockApi = setupTokenMocks({
        tokenProgram: "spl-token",
        transferFeeConfig: undefined,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.not.objectContaining({
          extensions: expect.anything(),
        }),
      );
    });

    it("should use computeTransferFeeFromTotal for useAllAmount", async () => {
      const mockApi = setupTokenMocks({
        transferFeeConfig: {
          newerTransferFee: { epoch: 50, maximumFee: 1000000, transferFeeBasisPoints: 100 },
          olderTransferFee: { epoch: 0, maximumFee: 500000, transferFeeBasisPoints: 50 },
        },
        currentEpoch: 100,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 500n,
        useAllAmount: true,
        asset: { type: "spl-token-2022", assetReference: CWIF_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.objectContaining({
          extensions: expect.objectContaining({
            transferFee: expect.objectContaining({
              transferAmountIncludingFee: 500,
            }),
          }),
        }),
      );
    });

    it("should cap transfer fee at maximumFee for send-all", async () => {
      const mockApi = setupTokenMocks({
        transferFeeConfig: {
          newerTransferFee: { epoch: 50, maximumFee: 2, transferFeeBasisPoints: 5000 },
          olderTransferFee: { epoch: 0, maximumFee: 1, transferFeeBasisPoints: 5000 },
        },
        currentEpoch: 100,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        useAllAmount: true,
        asset: { type: "spl-token-2022", assetReference: CWIF_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.objectContaining({
          extensions: expect.objectContaining({
            transferFee: expect.objectContaining({
              transferFee: 2,
              transferAmountIncludingFee: 1000,
              transferAmountExcludingFee: 998,
            }),
          }),
        }),
      );
    });

    it("should use olderTransferFee when currentEpoch < newerTransferFee.epoch", async () => {
      const mockApi = setupTokenMocks({
        transferFeeConfig: {
          newerTransferFee: { epoch: 200, maximumFee: 1000000, transferFeeBasisPoints: 500 },
          olderTransferFee: { epoch: 0, maximumFee: 1000000, transferFeeBasisPoints: 100 },
        },
        currentEpoch: 100,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 10000n,
        useAllAmount: true,
        asset: { type: "spl-token-2022", assetReference: CWIF_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.objectContaining({
          extensions: expect.objectContaining({
            transferFee: expect.objectContaining({
              feeBps: 100,
              transferAmountIncludingFee: 10000,
              transferFee: 100,
              transferAmountExcludingFee: 9900,
            }),
          }),
        }),
      );
    });

    it("should create ATA when recipient does not have one", async () => {
      const mockApi = setupTokenMocks({
        recipientAtaExists: false,
      });

      await craftTransaction(mockApi, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        asset: { type: "spl-token-2022", assetReference: CWIF_MINT, assetOwner: TEST_ADDRESS },
      });

      expect(buildTokenTransferInstructions).toHaveBeenCalledWith(
        mockApi,
        expect.objectContaining({
          recipientDescriptor: expect.objectContaining({
            shouldCreateAsAssociatedTokenAccount: true,
          }),
        }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// buildVersionedTransaction
// ---------------------------------------------------------------------------

const mockAddSignature = jest.fn();
const mockSerialize = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
let spiedDeserialize: jest.Spied<typeof VersionedTransaction.deserialize> | undefined = undefined;

function setDeserialize(
  tx: VersionedTransaction,
): jest.Spied<typeof VersionedTransaction.deserialize> {
  return jest.spyOn(VersionedTransaction, "deserialize").mockReturnValue(tx);
}

function createMockChainApi(blockhash: string, lastValidBlockHeight: number): ChainAPI {
  const mockBlockhash: BlockhashWithExpiryBlockHeight = {
    blockhash,
    lastValidBlockHeight,
  };
  const mockRecentPrioritizationFees: RecentPrioritizationFees[] = [];
  return {
    getLatestBlockhash: jest.fn().mockResolvedValue(mockBlockhash),
    getSimulationComputeUnits: jest.fn().mockResolvedValue(null),
    getRecentPrioritizationFees: jest.fn().mockResolvedValue(mockRecentPrioritizationFees),
  } as unknown as ChainAPI;
}

describe("buildVersionedTransaction", () => {
  const ADDRESS = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
  const BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";
  const LAST_VALID_BLOCK_HEIGHT = 1;
  const SIGNATURE = Buffer.from("any random value");
  const OLD_BLOCKHASH = "8RgQBB8zzKkv4iuHMo5F9Ku3rRDGjXbQxd1FgiFzqQ97";
  const VALID_SIGNATURE = Buffer.from(
    "validSignatureData12345678901234567890123456789012345678901234567890123456789012345678901234567890",
  );

  const createMockVersionedTransaction = () =>
    ({
      signatures: [DUMMY_SIGNATURE],
      message: {
        recentBlockhash: BLOCKHASH,
      },
      addSignature: mockAddSignature,
      serialize: mockSerialize,
    }) as unknown as VersionedTransaction;

  afterEach(() => {
    spiedDeserialize?.mockReset();
    jest.clearAllMocks();
  });

  it("should decode raw transaction and use it when user provide it", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        rawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(solanaTransaction).toEqual(expectedSolanaTransaction);
    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    addSignatureCallback(SIGNATURE);
    expect(mockAddSignature).toHaveBeenCalledTimes(1);
    expect(mockAddSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(1);
    expect(spiedDeserialize).toHaveBeenCalledWith(Buffer.from(rawTransaction.raw!, "base64"));
  });

  it("should build the transaction when user does not provide raw", async () => {
    spiedDeserialize = setDeserialize(createMockVersionedTransaction());

    const nonRawTransaction = transaction();
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        nonRawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    solanaTransaction.addSignature = jest.fn();
    addSignatureCallback(SIGNATURE);
    expect(solanaTransaction.addSignature).toHaveBeenCalledTimes(1);
    expect(solanaTransaction.addSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(0);
  });

  it("should update blockhash for raw transaction with different blockhash when only dummy signatures are present", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    expectedSolanaTransaction.message.recentBlockhash = OLD_BLOCKHASH;
    expectedSolanaTransaction.signatures = [DUMMY_SIGNATURE];

    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        rawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(solanaTransaction.message.recentBlockhash).toBe(BLOCKHASH);
    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    addSignatureCallback(SIGNATURE);
    expect(mockAddSignature).toHaveBeenCalledTimes(1);
    expect(mockAddSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(1);
    expect(spiedDeserialize).toHaveBeenCalledWith(Buffer.from(rawTransaction.raw!, "base64"));
  });

  it("should NOT update blockhash for raw transaction with different blockhash when valid signatures are present", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    expectedSolanaTransaction.message.recentBlockhash = OLD_BLOCKHASH;
    expectedSolanaTransaction.signatures = [VALID_SIGNATURE];

    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        rawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(solanaTransaction.message.recentBlockhash).toBe(OLD_BLOCKHASH);
    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    addSignatureCallback(SIGNATURE);
    expect(mockAddSignature).toHaveBeenCalledTimes(1);
    expect(mockAddSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(1);
    expect(spiedDeserialize).toHaveBeenCalledWith(Buffer.from(rawTransaction.raw!, "base64"));
  });

  it("should NOT update blockhash for raw transaction when mix of dummy and valid signatures are present", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    expectedSolanaTransaction.message.recentBlockhash = OLD_BLOCKHASH;
    expectedSolanaTransaction.signatures = [DUMMY_SIGNATURE, VALID_SIGNATURE];

    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        rawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(solanaTransaction.message.recentBlockhash).toBe(OLD_BLOCKHASH);
    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    addSignatureCallback(SIGNATURE);
    expect(mockAddSignature).toHaveBeenCalledTimes(1);
    expect(mockAddSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(1);
    expect(spiedDeserialize).toHaveBeenCalledWith(Buffer.from(rawTransaction.raw!, "base64"));
  });

  it("should update blockhash for raw transaction when all signatures are dummy (multiple dummy signatures)", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    expectedSolanaTransaction.message.recentBlockhash = OLD_BLOCKHASH;
    expectedSolanaTransaction.signatures = [DUMMY_SIGNATURE, DUMMY_SIGNATURE, DUMMY_SIGNATURE];

    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildVersionedTransaction(
        ADDRESS,
        rawTransaction,
        createMockChainApi(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
      );

    expect(solanaTransaction.message.recentBlockhash).toBe(BLOCKHASH);
    expect(recentBlockhash).toEqual(
      expect.objectContaining({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
      }),
    );

    addSignatureCallback(SIGNATURE);
    expect(mockAddSignature).toHaveBeenCalledTimes(1);
    expect(mockAddSignature).toHaveBeenCalledWith(new PublicKey(ADDRESS), SIGNATURE);

    expect(spiedDeserialize).toHaveBeenCalledTimes(1);
    expect(spiedDeserialize).toHaveBeenCalledWith(Buffer.from(rawTransaction.raw!, "base64"));
  });
});

describe("buildInstructions edge cases", () => {
  const ADDRESS = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
  const BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";

  it("should throw when commandDescriptor is undefined", async () => {
    const tx = {
      family: "solana",
      amount: 0,
      recipient: "",
      model: { kind: "transfer", uiState: {} },
    } as unknown as Transaction;

    await expect(
      buildVersionedTransaction(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
    ).rejects.toThrow("missing command descriptor");
  });

  it("should throw when commandDescriptor has errors", async () => {
    const tx = {
      family: "solana",
      amount: 0,
      recipient: "",
      model: {
        kind: "transfer",
        uiState: {},
        commandDescriptor: {
          command: { kind: "transfer", sender: ADDRESS, recipient: ADDRESS, amount: 0 },
          fee: 0,
          warnings: {},
          errors: { amount: new Error("Amount too low") },
        },
      },
    } as unknown as Transaction;

    await expect(
      buildVersionedTransaction(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
    ).rejects.toThrow("can not build invalid command");
  });

  it("should throw for raw command kind", async () => {
    const tx = {
      family: "solana",
      amount: 0,
      recipient: "",
      model: {
        kind: "raw",
        uiState: {},
        commandDescriptor: {
          command: { kind: "raw" },
          fee: 0,
          warnings: {},
          errors: {},
        },
      },
    } as unknown as Transaction;

    await expect(
      buildVersionedTransaction(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
    ).rejects.toThrow("Raw transactions should not be built with this function");
  });

  it("should handle raw transaction without signatures field", async () => {
    const expectedSolanaTransaction = {
      signatures: [],
      message: {
        recentBlockhash: BLOCKHASH,
      },
      addSignature: jest.fn(),
      serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
    };
    jest
      .spyOn(VersionedTransaction, "deserialize")
      .mockReturnValue(expectedSolanaTransaction as unknown as VersionedTransaction);

    const tx = {
      family: "solana",
      amount: 0,
      recipient: "",
      raw: "dGVzdA==",
      model: { kind: "transfer", uiState: {} },
    } as unknown as Transaction;

    const [solTx] = await buildVersionedTransaction(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1));

    expect(solTx).toEqual(expectedSolanaTransaction);
    expect(solTx.message.recentBlockhash).toBe(BLOCKHASH);
  });
});
