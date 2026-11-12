import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import { CardanoInvalidProtoParams, CardanoUnreadableStakeKeyDeposit } from "../errors";
import type { CardanoAccount, Transaction } from "../types";
import { getUndelegateTransactionStatus } from "./undelegate";

jest.mock("../buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));

const mockedBuildTransaction = jest.mocked(buildTransaction);

const account = {
  balance: new BigNumber(10e6),
  cardanoResources: { delegation: { status: true } },
} as unknown as CardanoAccount;

const undelegateTx = {
  family: "cardano",
  mode: "undelegate",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(170_000),
} as Transaction;

describe("getUndelegateTransactionStatus", () => {
  beforeEach(() => {
    mockedBuildTransaction.mockReset();
  });

  it("reports invalid protocol params as an amount error when the build rejects them", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new CardanoInvalidProtoParams());

    const status = await getUndelegateTransactionStatus(account, undelegateTx);

    expect(status.errors.amount).toBeInstanceOf(CardanoInvalidProtoParams);
  });

  it("reports an unreadable stake key deposit as an amount error", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new CardanoUnreadableStakeKeyDeposit());

    const status = await getUndelegateTransactionStatus(account, undelegateTx);

    expect(status.errors.amount).toBeInstanceOf(CardanoUnreadableStakeKeyDeposit);
  });

  it("re-throws unexpected build errors", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error("Unexpected programming error"));

    await expect(getUndelegateTransactionStatus(account, undelegateTx)).rejects.toThrow(
      "Unexpected programming error",
    );
  });
});
