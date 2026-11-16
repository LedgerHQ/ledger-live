import BigNumber from "bignumber.js";
import { estimateMaxSpendable } from "../../estimateMaxSpendable";
import getEstimatedFees from "../../getFeesForTransaction";
import { IconAccount } from "../../types";

jest.mock("../../getFeesForTransaction");

const mockedGetEstimatedFees = jest.mocked(getEstimatedFees);

const makeAccount = (spendableBalance: number) =>
  ({
    type: "Account",
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
    iconResources: { nonce: 0, totalDelegated: new BigNumber(0), votingPower: new BigNumber(0) },
    pendingOperations: [],
  }) as unknown as IconAccount;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetEstimatedFees.mockResolvedValue(new BigNumber(10));
  });

  it("returns the spendable balance minus the fees when sending all funds", async () => {
    const result = await estimateMaxSpendable({
      account: makeAccount(1000),
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(990));
    expect(mockedGetEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({ useAllAmount: true }),
      }),
    );
  });

  it("returns zero when the fees exceed the spendable balance", async () => {
    const result = await estimateMaxSpendable({
      account: makeAccount(5),
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("returns the spendable balance minus the fees for a non send mode", async () => {
    const result = await estimateMaxSpendable({
      account: makeAccount(1000),
      parentAccount: undefined,
      transaction: { mode: "delegate" } as never,
    });

    expect(result).toEqual(new BigNumber(990));
  });
});
