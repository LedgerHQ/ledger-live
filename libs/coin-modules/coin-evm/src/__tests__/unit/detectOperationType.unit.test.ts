import { isStakingOperation } from "../../staking";
import { StakingOperation } from "../../types/staking";

describe("isStakingOperation", () => {
  const validOperations: StakingOperation[] = [
    "delegate",
    "undelegate",
    "redelegate",
    "getStakedBalance",
    "getUnstakedBalance",
  ];

  const invalidOperations: string[] = [
    "invalidOperation1",
    "invalidOperation2",
    "randomString",
    "12345",
    "",
  ];

  it("should return true for valid staking operations", () => {
    validOperations.forEach(operation => {
      expect(isStakingOperation(operation)).toBe(true);
    });
  });

  it("should return false for invalid staking operations", () => {
    invalidOperations.forEach(operation => {
      expect(isStakingOperation(operation)).toBe(false);
    });
  });

  it("should return false for non-staking strings", () => {
    expect(isStakingOperation("someRandomString")).toBe(false);
  });
});
