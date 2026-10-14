import { BigNumber } from "bignumber.js";
import type { TransactionStatus } from "../../../generated/types";
import { withoutWaivedStatus } from "./waivedStatus";

const makeStatus = (
  errors: Record<string, Error>,
  warnings: Record<string, Error> = {},
): TransactionStatus => ({
  errors,
  warnings,
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(1),
  totalSpent: new BigNumber(1),
});

describe("withoutWaivedStatus", () => {
  it("drops the waived error and warning keys and keeps the others", () => {
    const status = makeStatus(
      { gasPrice: new Error("not enough TRX"), recipient: new Error("invalid") },
      { amount: new Error("no energy"), fee: new Error("high") },
    );

    const result = withoutWaivedStatus(status, ["gasPrice"], ["amount"]);

    expect(Object.keys(result.errors)).toEqual(["recipient"]);
    expect(Object.keys(result.warnings)).toEqual(["fee"]);
    expect(result.amount).toBe(status.amount);
  });

  it("returns the same status when no waived key is present", () => {
    const status = makeStatus({ recipient: new Error("invalid") });

    expect(withoutWaivedStatus(status, ["gasPrice"], ["amount"])).toBe(status);
  });

  it("returns the same status when nothing is waived", () => {
    const status = makeStatus({ gasPrice: new Error("not enough TRX") });

    expect(withoutWaivedStatus(status, [], [])).toBe(status);
  });
});
