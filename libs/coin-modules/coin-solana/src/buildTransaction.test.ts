import {
  BlockhashWithExpiryBlockHeight,
  PublicKey,
  RecentPrioritizationFees,
  VersionedTransaction,
} from "@solana/web3.js";
import { buildTransactionWithAPI } from "./buildTransaction";
import { ChainAPI } from "./network";
import { transaction } from "./__tests__/fixtures/helpers.fixture";
import { DUMMY_SIGNATURE } from "./utils";

// Mock VersionedTransaction
const mockAddSignature = jest.fn();
const mockSerialize = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));

const createMockVersionedTransaction = () => ({
  signatures: [DUMMY_SIGNATURE],
  message: {
    recentBlockhash: "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC",
  },
  addSignature: mockAddSignature,
  serialize: mockSerialize,
});

let spiedDeserialize: jest.Spied<typeof VersionedTransaction.deserialize> | undefined = undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setDeserialize(tx: any): jest.Spied<typeof VersionedTransaction.deserialize> {
  return jest.spyOn(VersionedTransaction, "deserialize").mockReturnValue(tx);
}

describe("Testing buildTransaction", () => {
  const ADDRESS = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
  const BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";
  const LAST_VALID_BLOCK_HEIGHT = 1;
  const SIGNATURE = Buffer.from("any random value");

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
        api(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
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
        api(BLOCKHASH, LAST_VALID_BLOCK_HEIGHT),
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
});

function api(blockhash: string, lastValidBlockHeight: number) {
  const mockBlockhash: BlockhashWithExpiryBlockHeight = {
    blockhash: blockhash,
    lastValidBlockHeight: lastValidBlockHeight,
  };

  const mockRecentPrioritizationFees: RecentPrioritizationFees[] = [];

  // Create a mock ChainAPI with only the methods we need
  const mockChainApi = {
    getLatestBlockhash: jest.fn().mockResolvedValue(mockBlockhash),
    getSimulationComputeUnits: jest.fn().mockResolvedValue(null),
    getRecentPrioritizationFees: jest.fn().mockResolvedValue(mockRecentPrioritizationFees),
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return mockChainApi as unknown as ChainAPI;
}
