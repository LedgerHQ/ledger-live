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
});
