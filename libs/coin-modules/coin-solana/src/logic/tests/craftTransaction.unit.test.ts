import {
  BlockhashWithExpiryBlockHeight,
  PublicKey,
  RecentPrioritizationFees,
  VersionedTransaction,
} from "@solana/web3.js";
import { transaction } from "../../bridge/__tests__/fixtures/helpers.fixture";
import type { ChainAPI } from "../../network";
import { DUMMY_SIGNATURE } from "../../utils";
import { buildTransactionWithAPI, craftTransaction } from "../craftTransaction";

jest.mock("../../network/chain/web3", () => ({
  ...jest.requireActual("../../network/chain/web3"),
  buildTransferInstructions: jest.fn().mockResolvedValue([]),
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
      } as any),
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
    } as any);

    expect(buildTransferInstructions).toHaveBeenCalledWith(
      api,
      expect.objectContaining({ memo: "test memo" }),
    );
  });
});

// ---------------------------------------------------------------------------
// buildTransactionWithAPI
// ---------------------------------------------------------------------------

const mockAddSignature = jest.fn();
const mockSerialize = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
let spiedDeserialize: jest.Spied<typeof VersionedTransaction.deserialize> | undefined = undefined;

function setDeserialize(tx: any): jest.Spied<typeof VersionedTransaction.deserialize> {
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

describe("buildTransactionWithAPI", () => {
  const ADDRESS = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
  const BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";
  const LAST_VALID_BLOCK_HEIGHT = 1;
  const SIGNATURE = Buffer.from("any random value");
  const OLD_BLOCKHASH = "8RgQBB8zzKkv4iuHMo5F9Ku3rRDGjXbQxd1FgiFzqQ97";
  const VALID_SIGNATURE = Buffer.from(
    "validSignatureData12345678901234567890123456789012345678901234567890123456789012345678901234567890",
  );

  const createMockVersionedTransaction = () => ({
    signatures: [DUMMY_SIGNATURE],
    message: {
      recentBlockhash: BLOCKHASH,
    },
    addSignature: mockAddSignature,
    serialize: mockSerialize,
  });

  afterEach(() => {
    spiedDeserialize?.mockReset();
    jest.clearAllMocks();
  });

  it("should decode raw transaction and use it when user provide it", async () => {
    const expectedSolanaTransaction = createMockVersionedTransaction();
    spiedDeserialize = setDeserialize(expectedSolanaTransaction);

    const rawTransaction = transaction({ raw: "test" });
    const [solanaTransaction, recentBlockhash, addSignatureCallback] =
      await buildTransactionWithAPI(
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
      await buildTransactionWithAPI(
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
      await buildTransactionWithAPI(
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
      await buildTransactionWithAPI(
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
    } as any;

    await expect(
      buildTransactionWithAPI(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
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
    } as any;

    await expect(
      buildTransactionWithAPI(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
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
    } as any;

    await expect(
      buildTransactionWithAPI(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1)),
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
      .mockReturnValue(expectedSolanaTransaction as any);

    const tx = {
      family: "solana",
      amount: 0,
      recipient: "",
      raw: "dGVzdA==",
      model: { kind: "transfer", uiState: {} },
    } as any;

    const [solTx] = await buildTransactionWithAPI(ADDRESS, tx, createMockChainApi(BLOCKHASH, 1));

    expect(solTx).toEqual(expectedSolanaTransaction);
    expect(solTx.message.recentBlockhash).toBe(BLOCKHASH);
  });
});
