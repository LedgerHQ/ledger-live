import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  BlockhashWithExpiryBlockHeight,
  TransactionError,
  VersionedTransaction,
} from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { broadcast } from "../broadcast";

jest
  .spyOn(VersionedTransaction, "deserialize")
  .mockImplementation(() => ({ __mocked: true }) as unknown as VersionedTransaction);

function buildApi({
  simulateValues,
  sendSignature = "sig",
}: {
  simulateValues: Array<{ err: TransactionError | null }>;
  sendSignature?: string;
}) {
  const simulateTransaction = jest.fn();
  for (const v of simulateValues) {
    simulateTransaction.mockResolvedValueOnce({ value: v });
  }
  const sendRawTransaction = jest.fn().mockResolvedValue(sendSignature);
  const api = {
    simulateTransaction,
    sendRawTransaction,
  } as unknown as ChainAPI;
  return { api, simulateTransaction, sendRawTransaction };
}

async function expectInvalidTransactionError(promise: Promise<unknown>, message: string) {
  await expect(promise).rejects.toBeInstanceOf(InvalidTransactionError);
  await expect(promise).rejects.toThrow(message);
}

describe("broadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const txBase64 = Buffer.from("dummy-tx").toString("base64");

  it("simulates with sigVerify and proceeds when err is null", async () => {
    const { api, simulateTransaction, sendRawTransaction } = buildApi({
      simulateValues: [{ err: null }],
    });

    const result = await broadcast(api, txBase64);

    expect(result).toBe("sig");
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
    expect(simulateTransaction).toHaveBeenCalledWith(expect.anything(), {
      sigVerify: true,
      replaceRecentBlockhash: false,
      commitment: "confirmed",
    });
    expect(sendRawTransaction).toHaveBeenCalledWith(Buffer.from(txBase64, "base64"), undefined);
  });

  it("forwards recentBlockhash to sendRawTransaction", async () => {
    const recentBlockhash: BlockhashWithExpiryBlockHeight = {
      blockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
      lastValidBlockHeight: 280064048,
    };
    const { api, sendRawTransaction } = buildApi({ simulateValues: [{ err: null }] });

    const result = await broadcast(api, txBase64, { recentBlockhash });
    expect(result).toBe("sig");
    expect(sendRawTransaction).toHaveBeenCalledWith(
      Buffer.from(txBase64, "base64"),
      recentBlockhash,
    );
  });

  it("should throw an error if the simulation fails", async () => {
    const { api } = buildApi({ simulateValues: [{ err: "Network error" }] });
    await expect(broadcast(api, txBase64)).rejects.toThrow("Transaction simulation failed");
  });

  it.each<{ label: string; err: TransactionError; message: string }>([
    {
      label: "InsufficientFundsForRent",
      err: { InsufficientFundsForRent: { account_index: 0 } } as TransactionError,
      message: "Insufficient funds for rent",
    },
    {
      label: "InsufficientFundsForFee",
      err: "InsufficientFundsForFee",
      message: "Insufficient funds for fee",
    },
    { label: "AccountInUse", err: "AccountInUse", message: "Account in use" },
    { label: "AlreadyProcessed", err: "AlreadyProcessed", message: "Already processed" },
    { label: "BlockhashNotFound", err: "BlockhashNotFound", message: "Blockhash not found" },
    {
      label: "InstructionError Custom=17 (token account frozen)",
      err: { InstructionError: [0, { Custom: 17 }] } as TransactionError,
      message: "Token account frozen",
    },
    {
      label: "InstructionError Custom=1 (token insufficient funds)",
      err: { InstructionError: [0, { Custom: 1 }] } as TransactionError,
      message: "Insufficient funds",
    },
    {
      label: "InstructionError InsufficientFunds",
      err: { InstructionError: [0, "InsufficientFunds"] } as TransactionError,
      message: "Insufficient funds",
    },
    {
      label: "InstructionError fallback",
      err: { InstructionError: [0, { Custom: 9999 }] } as TransactionError,
      message: "Transaction simulation failed",
    },
    {
      label: "unknown top-level err",
      err: "string error" as TransactionError,
      message: "Transaction simulation failed",
    },
  ])("throws InvalidTransactionError on $label", async ({ err, message }) => {
    const { api, sendRawTransaction } = buildApi({ simulateValues: [{ err }] });

    await expectInvalidTransactionError(broadcast(api, txBase64), message);
    expect(sendRawTransaction).not.toHaveBeenCalled();
  });
});
