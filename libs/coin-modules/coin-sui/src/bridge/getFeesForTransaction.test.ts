import { BigNumber } from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getEstimatedFees from "./getFeesForTransaction";

const estimateFees = jest.fn();

jest.mock("../logic", () => {
  return {
    estimateFees: (arg: any) => estimateFees(arg),
  };
});

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();

  beforeEach(() => {
    estimateFees.mockClear();
  });

  it("returns fees estimation by sui sdk", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const gasBudget = BigInt("3976000");
    estimateFees.mockResolvedValue(gasBudget);

    // WHEN
    const result = await getEstimatedFees({
      account,
      transaction,
    });

    // THEN
    expect(estimateFees).toHaveBeenCalledTimes(1);
    expect(estimateFees.mock.lastCall).not.toBeNull();
    expect(result.toString()).toEqual(gasBudget.toString());
  });

  it("forwards stakedSuiId and useAllAmount when mode is undelegate", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const stakedSuiId = "0xa5581752d1f6c436bb902641ee080450f2fa42bd2ef3f3cae262824cb3703fa6";
    const undelegateTransaction = createFixtureTransaction({
      mode: "undelegate" as const,
      stakedSuiId,
      useAllAmount: true,
      amount: BigNumber(1000000000),
    });
    estimateFees.mockResolvedValue(BigInt("3976000"));

    // WHEN
    await getEstimatedFees({ account, transaction: undelegateTransaction });

    // THEN
    expect(estimateFees).toHaveBeenCalledTimes(1);
    expect(estimateFees.mock.lastCall[0]).toMatchObject({
      type: "undelegate",
      intentType: "staking",
      stakedSuiId,
      useAllAmount: true,
    });
  });

  it("omits stakedSuiId from the call when undefined (does not coerce to empty string)", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const sendTransaction = createFixtureTransaction(); // mode: "send", no stakedSuiId
    estimateFees.mockResolvedValue(BigInt("3976000"));

    // WHEN
    await getEstimatedFees({ account, transaction: sendTransaction });

    // THEN
    const args = estimateFees.mock.lastCall[0];
    expect("stakedSuiId" in args).toBe(false);
  });
});
