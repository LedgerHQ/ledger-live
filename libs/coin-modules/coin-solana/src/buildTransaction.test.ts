import {
  BlockhashWithExpiryBlockHeight,
  PublicKey,
  RecentPrioritizationFees,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { buildTransactionWithAPI } from "./buildTransaction";
import { ChainAPI } from "./network";
import { transaction } from "./__tests__/fixtures/helpers.fixture";

describe("Testing buildTransaction", () => {
  const ADDRESS = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
  const BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";
  const LAST_VALID_BLOCK_HEIGHT = 1;
  const SIGNATURE = Buffer.from("any random value");

  afterEach(() => jest.clearAllMocks());

  it("should decode raw transaction and use it when user provide it", async () => {
    const expectedSolanaTransaction = {} as VersionedTransaction;
    expectedSolanaTransaction.addSignature = jest.fn();

    VersionedTransaction.deserialize = jest.fn(
      (_serializedTransaction: Uint8Array) => expectedSolanaTransaction,
    );

    const rawTransaction = transaction("test");
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
    expect(expectedSolanaTransaction.addSignature).toHaveBeenCalledTimes(1);
    expect(expectedSolanaTransaction.addSignature).toHaveBeenCalledWith(
      new PublicKey(ADDRESS),
      SIGNATURE,
    );

    expect(VersionedTransaction.deserialize).toHaveBeenCalledTimes(1);
    expect(VersionedTransaction.deserialize).toHaveBeenCalledWith(
      Buffer.from(rawTransaction.raw!, "base64"),
    );
  });

  it("should build the transaction when user does not provide raw", async () => {
    VersionedTransaction.deserialize = jest.fn(
      (_serializedTransaction: Uint8Array) => ({}) as VersionedTransaction,
    );

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

    expect(VersionedTransaction.deserialize).toHaveBeenCalledTimes(0);
  });
});

function api(blockhash: string, lastValidBlockHeight: number) {
  return {
    getLatestBlockhash: () =>
      Promise.resolve({
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      } as BlockhashWithExpiryBlockHeight),
    getSimulationComputeUnits: (_instructions: Array<TransactionInstruction>, _payer: PublicKey) =>
      null,
    getRecentPrioritizationFees: (_accounts: string[]) => [] as RecentPrioritizationFees[],
  } as unknown as ChainAPI;
}
