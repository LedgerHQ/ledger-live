import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  BlockhashWithExpiryBlockHeight,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionError,
  VersionedTransaction,
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredTimeoutError,
} from "@solana/web3.js";
import { SolanaTxBlockhashExpired, SolanaTxConfirmationTimeout } from "../../errors";
import type { ChainAPI } from "../../network";
import { broadcast } from "../broadcast";

const RECENT_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

jest.spyOn(VersionedTransaction, "deserialize").mockImplementation(
  () =>
    ({
      message: {
        recentBlockhash: RECENT_BLOCKHASH,
        compiledInstructions: [],
        staticAccountKeys: [],
      },
    }) as unknown as VersionedTransaction,
);

const OTHER_PROGRAM = Keypair.generate().publicKey;

// The next deserialized transaction carries these instructions, each as [programId, data].
function mockInstructions(...instructions: Array<[PublicKey, number[]]>) {
  jest.mocked(VersionedTransaction.deserialize).mockImplementationOnce(
    () =>
      ({
        message: {
          recentBlockhash: RECENT_BLOCKHASH,
          staticAccountKeys: [OTHER_PROGRAM, ...instructions.map(([programId]) => programId)],
          compiledInstructions: instructions.map(([, data], i) => ({
            programIdIndex: i + 1,
            accountKeyIndexes: [0],
            data: Uint8Array.from(data),
          })),
        },
      }) as unknown as VersionedTransaction,
  );
}

const ADVANCE_NONCE = [4, 0, 0, 0];

function buildApi({
  simulateValues,
  sendSignature = "sig",
  blockhashStillValid = true,
}: {
  simulateValues: Array<{ err: TransactionError | null }>;
  sendSignature?: string;
  blockhashStillValid?: boolean;
}) {
  const simulateTransaction = jest.fn();
  for (const v of simulateValues) {
    simulateTransaction.mockResolvedValueOnce({ value: v });
  }
  const sendRawTransaction = jest.fn().mockResolvedValue(sendSignature);
  const isBlockhashValid = jest.fn().mockResolvedValue(blockhashStillValid);
  const api = {
    simulateTransaction,
    sendRawTransaction,
    isBlockhashValid,
  } as unknown as ChainAPI;
  return { api, simulateTransaction, sendRawTransaction, isBlockhashValid };
}

// Under fake timers, runs the 500 ms wait before the retry; nothing else in broadcast() waits on a timer.
async function settle<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  await jest.advanceTimersByTimeAsync(500);
  return promise;
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

  it("checks the blockhash at processed, then simulates with sigVerify and proceeds when err is null", async () => {
    const { api, simulateTransaction, sendRawTransaction, isBlockhashValid } = buildApi({
      simulateValues: [{ err: null }],
    });

    const result = await broadcast(api, txBase64);

    expect(result).toBe("sig");
    expect(isBlockhashValid).toHaveBeenCalledTimes(1);
    expect(isBlockhashValid).toHaveBeenCalledWith(RECENT_BLOCKHASH, "processed");
    expect(isBlockhashValid.mock.invocationCallOrder[0]).toBeLessThan(
      simulateTransaction.mock.invocationCallOrder[0],
    );
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

  it("throws SolanaTxBlockhashExpired without simulating when the blockhash has expired", async () => {
    const { api, simulateTransaction, sendRawTransaction, isBlockhashValid } = buildApi({
      simulateValues: [],
      blockhashStillValid: false,
    });

    await expect(broadcast(api, txBase64)).rejects.toBeInstanceOf(SolanaTxBlockhashExpired);
    expect(isBlockhashValid).toHaveBeenCalledWith(RECENT_BLOCKHASH, "processed");
    expect(simulateTransaction).not.toHaveBeenCalled();
    expect(sendRawTransaction).not.toHaveBeenCalled();
  });

  it.each([
    ["rejects", () => Promise.reject(new Error("node unreachable"))],
    [
      "throws",
      () => {
        throw new Error("node unreachable");
      },
    ],
  ])("simulates and sends when the validity check %s", async (_label, check) => {
    const { api, isBlockhashValid, simulateTransaction } = buildApi({
      simulateValues: [{ err: null }],
    });
    isBlockhashValid.mockImplementationOnce(check);

    await expect(broadcast(api, txBase64)).resolves.toBe("sig");
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
  });

  describe("durable-nonce transactions", () => {
    it("skips the expiry check, which always fails on a nonce value, and lets the simulation decide", async () => {
      mockInstructions([SystemProgram.programId, ADVANCE_NONCE]);
      const { api, isBlockhashValid, simulateTransaction } = buildApi({
        simulateValues: [{ err: null }],
        blockhashStillValid: false,
      });

      await expect(broadcast(api, txBase64)).resolves.toBe("sig");
      expect(isBlockhashValid).not.toHaveBeenCalled();
      expect(simulateTransaction).toHaveBeenCalledTimes(1);
    });

    it.each<[string, Array<[PublicKey, number[]]>]>([
      ["another System instruction first", [[SystemProgram.programId, [2, 0, 0, 0]]]],
      ["the same data from another program", [[OTHER_PROGRAM, ADVANCE_NONCE]]],
      ["data shorter than an instruction index", [[SystemProgram.programId, [4]]]],
      ["another index sharing the first byte", [[SystemProgram.programId, [4, 0, 0, 1]]]],
      [
        "AdvanceNonceAccount as the second instruction",
        [
          [SystemProgram.programId, [2, 0, 0, 0]],
          [SystemProgram.programId, ADVANCE_NONCE],
        ],
      ],
    ])("still checks the blockhash with %s", async (_label, instructions) => {
      mockInstructions(...instructions);
      const { api, isBlockhashValid, simulateTransaction } = buildApi({
        simulateValues: [],
        blockhashStillValid: false,
      });

      await expect(broadcast(api, txBase64)).rejects.toBeInstanceOf(SolanaTxBlockhashExpired);
      expect(isBlockhashValid).toHaveBeenCalledTimes(1);
      expect(simulateTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when the simulation cannot find the blockhash", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("simulates again after 500 ms when the blockhash is still valid, and sends when the retry finds it", async () => {
      const { api, simulateTransaction, sendRawTransaction, isBlockhashValid } = buildApi({
        simulateValues: [{ err: "BlockhashNotFound" }, { err: null }],
      });

      const promise = broadcast(api, txBase64);
      await jest.advanceTimersByTimeAsync(499);
      expect(isBlockhashValid).toHaveBeenCalledWith(RECENT_BLOCKHASH, "processed");
      expect(simulateTransaction).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(simulateTransaction).toHaveBeenCalledTimes(2);
      expect(simulateTransaction).toHaveBeenNthCalledWith(2, expect.anything(), {
        sigVerify: true,
        replaceRecentBlockhash: false,
        commitment: "confirmed",
      });

      await expect(promise).resolves.toBe("sig");
      expect(isBlockhashValid).toHaveBeenCalledTimes(1);
      expect(sendRawTransaction).toHaveBeenCalledTimes(1);
    });

    it("keeps Blockhash not found when the blockhash is still valid but the retry fails too", async () => {
      const { api, simulateTransaction, sendRawTransaction, isBlockhashValid } = buildApi({
        simulateValues: [{ err: "BlockhashNotFound" }, { err: "BlockhashNotFound" }],
      });

      const error = await settle(broadcast(api, txBase64)).catch(e => e);
      expect(error).toBeInstanceOf(InvalidTransactionError);
      expect(error.message).toBe("Blockhash not found");
      expect(error).not.toHaveProperty("err");
      expect(error).not.toHaveProperty("instructionIndex");
      expect(isBlockhashValid).toHaveBeenCalledTimes(1);
      expect(simulateTransaction).toHaveBeenCalledTimes(2);
      expect(sendRawTransaction).not.toHaveBeenCalled();
    });

    it("keeps Blockhash not found for a used durable nonce, without checking the blockhash", async () => {
      mockInstructions([SystemProgram.programId, ADVANCE_NONCE]);
      const { api, isBlockhashValid, simulateTransaction, sendRawTransaction } = buildApi({
        simulateValues: [{ err: "BlockhashNotFound" }, { err: "BlockhashNotFound" }],
      });

      await expectInvalidTransactionError(settle(broadcast(api, txBase64)), "Blockhash not found");
      expect(isBlockhashValid).not.toHaveBeenCalled();
      expect(simulateTransaction).toHaveBeenCalledTimes(2);
      expect(sendRawTransaction).not.toHaveBeenCalled();
    });

    it("lets a failed retry call through and sends nothing", async () => {
      const { api, simulateTransaction, sendRawTransaction } = buildApi({
        simulateValues: [{ err: "BlockhashNotFound" }],
      });
      const original = new Error("node unreachable");
      simulateTransaction.mockRejectedValueOnce(original);

      await expect(settle(broadcast(api, txBase64))).rejects.toBe(original);
      expect(sendRawTransaction).not.toHaveBeenCalled();
    });

    it("reports the retry's own failure", async () => {
      const { api, sendRawTransaction, isBlockhashValid } = buildApi({
        simulateValues: [{ err: "BlockhashNotFound" }, { err: "AccountInUse" }],
      });

      await expectInvalidTransactionError(settle(broadcast(api, txBase64)), "Account in use");
      expect(isBlockhashValid).toHaveBeenCalledTimes(1);
      expect(sendRawTransaction).not.toHaveBeenCalled();
    });
  });

  it.each<{ label: string; err: TransactionError | null }>([
    { label: "a successful simulation", err: null },
    { label: "AccountInUse", err: "AccountInUse" },
    { label: "an InstructionError", err: { InstructionError: [0, "InsufficientFunds"] } },
  ])("checks the blockhash once and does not simulate again on $label", async ({ err }) => {
    const { api, isBlockhashValid, simulateTransaction } = buildApi({ simulateValues: [{ err }] });

    await broadcast(api, txBase64).catch(() => undefined);
    expect(isBlockhashValid).toHaveBeenCalledTimes(1);
    expect(simulateTransaction).toHaveBeenCalledTimes(1);
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

  it.each<{ label: string; err: TransactionError }>([
    { label: "InsufficientFundsForRent", err: { InsufficientFundsForRent: { account_index: 0 } } },
    { label: "InsufficientFundsForFee", err: "InsufficientFundsForFee" },
    { label: "AccountInUse", err: "AccountInUse" },
    { label: "AlreadyProcessed", err: "AlreadyProcessed" },
  ])("attaches no context fields on $label", async ({ err }) => {
    const { api } = buildApi({ simulateValues: [{ err }] });

    const error = await broadcast(api, txBase64).catch(e => e);
    expect(error).not.toHaveProperty("err");
    expect(error).not.toHaveProperty("instructionIndex");
  });

  it.each<{ label: string; err: TransactionError; message: string }>([
    {
      label: "Custom=17 (token account frozen)",
      err: { InstructionError: [2, { Custom: 17 }] },
      message: "Token account frozen",
    },
    {
      label: "Custom=1 (token insufficient funds)",
      err: { InstructionError: [2, { Custom: 1 }] },
      message: "Insufficient funds",
    },
    {
      label: "InsufficientFunds",
      err: { InstructionError: [2, "InsufficientFunds"] },
      message: "Insufficient funds",
    },
    {
      label: "fallback",
      err: { InstructionError: [2, { Custom: 9999 }] },
      message: "Transaction simulation failed",
    },
  ])("attaches err and instructionIndex on InstructionError $label", async ({ err, message }) => {
    const { api } = buildApi({ simulateValues: [{ err }] });

    const error = await broadcast(api, txBase64).catch(e => e);
    expect(error).toBeInstanceOf(InvalidTransactionError);
    expect(error.message).toBe(message);
    expect(error).toMatchObject({ err, instructionIndex: 2 });
  });

  it("attaches err without instructionIndex on unknown top-level err", async () => {
    const err = { SomethingNew: { foo: 1 } } as unknown as TransactionError;
    const { api } = buildApi({ simulateValues: [{ err }] });

    const error = await broadcast(api, txBase64).catch(e => e);
    expect(error.message).toBe("Transaction simulation failed");
    expect(error).toMatchObject({ err });
    expect(error).not.toHaveProperty("instructionIndex");
  });

  it.each([
    ["a timeout", () => new TransactionExpiredTimeoutError("sig", 30)],
    ["an exceeded block height", () => new TransactionExpiredBlockheightExceededError("sig")],
  ])("maps %s to SolanaTxConfirmationTimeout", async (_name, makeError) => {
    const { api, sendRawTransaction } = buildApi({ simulateValues: [{ err: null }] });
    sendRawTransaction.mockRejectedValueOnce(makeError());

    await expect(broadcast(api, txBase64)).rejects.toThrow(SolanaTxConfirmationTimeout);
  });

  it("lets any other broadcast failure through untouched", async () => {
    const { api, sendRawTransaction } = buildApi({ simulateValues: [{ err: null }] });
    const original = new Error("node unreachable");
    sendRawTransaction.mockRejectedValueOnce(original);

    await expect(broadcast(api, txBase64)).rejects.toBe(original);
  });
});
