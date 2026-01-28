import { Methods, calculateEstimatedFees } from "./common";

describe("common", () => {
  describe("Methods enum", () => {
    it("should have Transfer = 0", () => {
      expect(Methods.Transfer).toBe(0);
    });

    it("should have ERC20Transfer = 1", () => {
      expect(Methods.ERC20Transfer).toBe(1);
    });

    it("should have InvokeEVM = 3844450837", () => {
      expect(Methods.InvokeEVM).toBe(3844450837);
    });
  });

  describe("calculateEstimatedFees", () => {
    it("should calculate fees as gasFeeCap * gasLimit", () => {
      const gasFeeCap = 100n;
      const gasLimit = 1000n;

      const result = calculateEstimatedFees(gasFeeCap, gasLimit);

      expect(result).toBe(100000n);
    });

    it("should handle large numbers", () => {
      const gasFeeCap = 1000000000n; // 1 gwei
      const gasLimit = 21000n;

      const result = calculateEstimatedFees(gasFeeCap, gasLimit);

      expect(result).toBe(21000000000000n);
    });

    it("should return 0 when gasLimit is 0", () => {
      const gasFeeCap = 100n;
      const gasLimit = 0n;

      const result = calculateEstimatedFees(gasFeeCap, gasLimit);

      expect(result).toBe(0n);
    });

    it("should return 0 when gasFeeCap is 0", () => {
      const gasFeeCap = 0n;
      const gasLimit = 1000n;

      const result = calculateEstimatedFees(gasFeeCap, gasLimit);

      expect(result).toBe(0n);
    });
  });
});
