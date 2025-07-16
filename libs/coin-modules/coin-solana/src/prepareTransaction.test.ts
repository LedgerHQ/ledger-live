import {
  Account,
  BlockhashWithExpiryBlockHeight,
  DecodedTransferInstruction,
  MessageCompiledInstruction,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransactionInstruction,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { ChainAPI } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import { SolanaAccount, Transaction, TransferCommand } from "./types";
import BigNumber from "bignumber.js";
import { transaction } from "./__tests__/fixtures/helpers.fixture";

jest.mock("./estimateMaxSpendable", () => {
  const originalModule = jest.requireActual("./estimateMaxSpendable");

  return {
    __esModule: true,
    ...originalModule,
    estimateFeeAndSpendable: jest.fn(
      (_api: ChainAPI, _account: Account, _transaction?: Transaction | undefined | null) =>
        Promise.resolve({ fee: 0, spendable: BigNumber(0) }),
    ),
  };
});

describe("testing prepareTransaction", () => {
  it("should return a new transaction from the raw transaction when user provide it", async () => {
    // Given
    const solanaTransaction = {
      message: {
        staticAccountKeys: [SystemProgram.programId],
        compiledInstructions: [
          {
            programIdIndex: 0,
            data: "some random data",
            accountKeyIndexes: [0],
          },
        ] as unknown as MessageCompiledInstruction[],
        isAccountSigner: (_index: number) => true,
        isAccountWritable: (_index: number) => true,
      } as unknown as VersionedMessage,
    } as VersionedTransaction;
    const deserializeSpy = jest.spyOn(VersionedTransaction, "deserialize");
    deserializeSpy.mockImplementationOnce(
      (_serializedTransaction: Uint8Array) => solanaTransaction,
    );

    const sender = PublicKey.unique();
    const recipient = PublicKey.unique();
    const decodeTransferSpy = jest.spyOn(SystemInstruction, "decodeTransfer");
    decodeTransferSpy.mockImplementationOnce(
      (_instruction: TransactionInstruction) =>
        ({
          lamports: BigInt(1),
          fromPubkey: sender,
          toPubkey: recipient,
        }) as DecodedTransferInstruction,
    );

    const estimatedFees = 0.00005;
    const rawTransaction = transaction("any random value");
    const chainAPI = api(estimatedFees);
    const getFeeForMessageSpy = jest.spyOn(chainAPI, "getFeeForMessage");

    // When
    const preparedTransaction = await prepareTransaction(
      {} as SolanaAccount,
      rawTransaction,
      chainAPI,
    );

    // Then
    expect(preparedTransaction).not.toBe(rawTransaction);

    expect(deserializeSpy).toHaveBeenCalledTimes(1);
    expect(deserializeSpy).toHaveBeenCalledWith(Buffer.from("any random value", "base64"));

    expect(decodeTransferSpy).toHaveBeenCalledTimes(1);
    expect(decodeTransferSpy).toHaveBeenCalledWith({
      data: Buffer.from("some random data"),
      programId: SystemProgram.programId,
      keys: [{ pubkey: SystemProgram.programId, isSigner: true, isWritable: true }],
    });

    expect(getFeeForMessageSpy).toHaveBeenCalledTimes(1);
    expect(getFeeForMessageSpy).toHaveBeenCalledWith(solanaTransaction.message);

    expect(preparedTransaction.family).toEqual("solana");
    expect(preparedTransaction.amount).toEqual(BigNumber(1));
    expect(preparedTransaction.recipient).toEqual(recipient.toString());
    expect(preparedTransaction.model.kind).toEqual("transfer");
    expect(preparedTransaction.model.uiState).toEqual({});
    expect(preparedTransaction.model.commandDescriptor!.fee).toEqual(estimatedFees);
    expect(preparedTransaction.model.commandDescriptor!.warnings).toEqual({});
    expect(preparedTransaction.model.commandDescriptor!.errors).toEqual({});

    const transferCommand = preparedTransaction.model.commandDescriptor!.command as TransferCommand;
    expect(transferCommand.kind).toEqual("transfer");
    expect(transferCommand.amount).toEqual(1);
    expect(transferCommand.sender).toEqual(sender.toString());
    expect(transferCommand.recipient).toEqual(recipient.toString());
  });

  it("should return a new transaction when user does not provide a raw one", async () => {
    const nonRawTransaction = transaction();
    const preparedTransaction = await prepareTransaction(
      {} as SolanaAccount,
      nonRawTransaction,
      {} as ChainAPI,
    );

    expect(preparedTransaction).not.toBe(nonRawTransaction);
  });
});

function api(estimatedFees?: number) {
  return {
    getLatestBlockhash: () => {
      return Promise.resolve({
        blockhash: "blockhash",
        lastValidBlockHeight: 1,
      } as BlockhashWithExpiryBlockHeight);
    },

    getFeeForMessage: (_message: VersionedMessage) => Promise.resolve(estimatedFees),
  } as ChainAPI;
}
