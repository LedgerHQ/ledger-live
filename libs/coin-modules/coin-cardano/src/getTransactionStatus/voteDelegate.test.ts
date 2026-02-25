import BigNumber from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";

import { CardanoAccount, Transaction } from "../types";
import { getVoteDelegateTransactionStatus } from "./voteDelegate";
import { buildTransaction } from "../buildTransaction";
import {
  CardanoInvalidDRepHex,
  CardanoNotEnoughFunds,
  CardanoStakeKeyDepositError,
} from "../errors";

jest.mock("../buildTransaction");

describe("getVoteDelegateTransactionStatus", () => {
  const mockBuildTransaction = buildTransaction as jest.Mock;

  const mockAccount = {
    spendableBalance: new BigNumber(10000000),
    cardanoResources: {
      protocolParams: {
        stakeKeyDeposit: "2000000",
      },
      delegation: {
        status: true,
      },
    },
  } as unknown as CardanoAccount;

  const mockTransaction = {
    dRepHex: "22" + "0".repeat(56),
    fees: new BigNumber(1),
  } as unknown as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return valid status when dRepAbstain is provided", async () => {
    const result = await getVoteDelegateTransactionStatus(mockAccount, mockTransaction);
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.estimatedFees.toString()).toBe("1");
  });

  it("should throw error if zero or multiple dRep options are provided", async () => {
    await expect(getVoteDelegateTransactionStatus(mockAccount, {} as Transaction)).rejects.toThrow(
      "Exactly one of dRepAbstain, dRepNoConfidence or dRepHex must be provided.",
    );

    await expect(
      getVoteDelegateTransactionStatus(mockAccount, {
        dRepAbstain: true,
        dRepHex: "testDRepHex",
      } as unknown as Transaction),
    ).rejects.toThrow("Exactly one of dRepAbstain, dRepNoConfidence or dRepHex must be provided.");
  });

  it("should return CardanoInvalidDRepHex error for invalid dRepHex", async () => {
    const txInvalidHex = {
      dRepHex: "invalidhex",
      fees: new BigNumber(1),
    } as unknown as Transaction;

    let result = await getVoteDelegateTransactionStatus(mockAccount, txInvalidHex);
    expect(result.errors.dRepHex).toBeInstanceOf(CardanoInvalidDRepHex);

    const validLengthInvalidHeader = "12" + "0".repeat(56);
    const txInvalidHeader = {
      dRepHex: validLengthInvalidHeader,
    } as unknown as Transaction;
    result = await getVoteDelegateTransactionStatus(mockAccount, txInvalidHeader);
    expect(result.errors.dRepHex).toBeInstanceOf(CardanoInvalidDRepHex);
  });

  it("should not return error for a valid dRepHex", async () => {
    const validDRepHex = "22" + "0".repeat(56);
    const tx = {
      dRepHex: validDRepHex,
      fees: new BigNumber(1),
    } as unknown as Transaction;

    const result = await getVoteDelegateTransactionStatus(mockAccount, tx);
    expect(result.errors).toEqual({});
  });

  it("should return CardanoNotEnoughFunds error if buildTransaction throws 'Not enough ADA'", async () => {
    mockBuildTransaction.mockRejectedValueOnce(new Error("Not enough ADA"));
    const result = await getVoteDelegateTransactionStatus(mockAccount, mockTransaction);
    expect(result.errors.amount).toBeInstanceOf(CardanoNotEnoughFunds);
  });

  it("should rethrow unknown errors from buildTransaction", async () => {
    const unknownError = new Error("Unknown error");
    mockBuildTransaction.mockRejectedValueOnce(unknownError);
    await expect(getVoteDelegateTransactionStatus(mockAccount, mockTransaction)).rejects.toThrow(
      unknownError,
    );
  });

  it("should return FeeNotLoaded error if fees are not set", async () => {
    const txWithoutFees = { ...mockTransaction, fees: undefined } as unknown as Transaction;
    const result = await getVoteDelegateTransactionStatus(mockAccount, txWithoutFees);
    expect(result.errors.fees).toBeInstanceOf(FeeNotLoaded);
  });

  it("should return CardanoStakeKeyDepositError if stake key not registered and balance < deposit", async () => {
    const poorAccount = {
      ...mockAccount,
      spendableBalance: new BigNumber(1000000), // less than 2000000 deposit
      cardanoResources: {
        ...mockAccount.cardanoResources,
        delegation: { status: false },
      },
    } as unknown as CardanoAccount;

    const result = await getVoteDelegateTransactionStatus(poorAccount, mockTransaction);
    expect(result.errors.amount).toBeInstanceOf(CardanoStakeKeyDepositError);
  });
});
