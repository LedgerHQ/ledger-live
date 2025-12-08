import { getStakingABI, isPayable } from "../../../staking/abis";

describe("getStakingABI", () => {
  it("should return SEI ABI for sei_network_evm", () => {
    const abi = getStakingABI("sei_network_evm");
    expect(abi).toBeInstanceOf(Array);
    expect(abi?.length).toBeGreaterThan(0);
  });

  it("should return CELO ABI for celo", () => {
    const abi = getStakingABI("celo");
    expect(abi).toBeInstanceOf(Array);
    expect(abi?.length).toBeGreaterThan(0);
  });

  it("should return undefined for unsupported currency", () => {
    const abi = getStakingABI("unsupported_currency");
    expect(abi).toBeUndefined();
  });
});

describe("isPayable", () => {
  describe("SEI Network", () => {
    it("should return true for delegate function (payable)", () => {
      const result = isPayable("sei_network_evm", "delegate");
      expect(result).toBe(true);
    });

    it("should return false for undelegate function (nonpayable)", () => {
      const result = isPayable("sei_network_evm", "undelegate");
      expect(result).toBe(false);
    });

    it("should return false for redelegate function (nonpayable)", () => {
      const result = isPayable("sei_network_evm", "redelegate");
      expect(result).toBe(false);
    });

    it("should return false for delegation function (view)", () => {
      const result = isPayable("sei_network_evm", "delegation");
      expect(result).toBe(false);
    });

    it("should return false for non-existent function", () => {
      const result = isPayable("sei_network_evm", "nonExistentFunction");
      expect(result).toBe(false);
    });
  });

  describe("CELO", () => {
    it("should return false for delegateGovernanceVotes function (nonpayable)", () => {
      const result = isPayable("celo", "delegateGovernanceVotes");
      expect(result).toBe(false);
    });

    it("should return false for revokeDelegatedGovernanceVotes function (nonpayable)", () => {
      const result = isPayable("celo", "revokeDelegatedGovernanceVotes");
      expect(result).toBe(false);
    });

    it("should return false for getAccountTotalLockedGold function (view)", () => {
      const result = isPayable("celo", "getAccountTotalLockedGold");
      expect(result).toBe(false);
    });

    it("should return false for getTotalPendingWithdrawals function (view)", () => {
      const result = isPayable("celo", "getTotalPendingWithdrawals");
      expect(result).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should return false for unsupported currency", () => {
      const result = isPayable("unsupported_currency", "delegate");
      expect(result).toBe(false);
    });

    it("should return false for empty function name", () => {
      const result = isPayable("sei_network_evm", "");
      expect(result).toBe(false);
    });

    it("should return false for empty currency ID", () => {
      const result = isPayable("", "delegate");
      expect(result).toBe(false);
    });
  });
});
