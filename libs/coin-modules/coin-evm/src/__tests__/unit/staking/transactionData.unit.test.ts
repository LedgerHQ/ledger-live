import { buildTransactionParams } from "../../../staking/transactionData";
import { StakingOperation } from "../../../types/staking";

describe("buildTransactionParams", () => {
  const validatorAddress = "seivaloper1abc123";
  const amount = 1000000000000000000n;
  const dstValidatorAddress = "seivaloper1def456";
  const delegatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

  describe("SEI Network", () => {
    const currencyId = "sei_evm";

    it("should build params for delegate operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "delegate" as StakingOperation,
        validatorAddress,
        amount,
      );

      expect(params).toEqual([validatorAddress]);
    });

    it("should build params for undelegate operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "undelegate" as StakingOperation,
        validatorAddress,
        amount,
      );

      expect(params).toEqual([validatorAddress, amount]);
    });

    it("should build params for redelegate operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "redelegate" as StakingOperation,
        validatorAddress,
        amount,
        dstValidatorAddress,
      );

      expect(params).toEqual([validatorAddress, dstValidatorAddress, amount]);
    });

    it("should throw error for redelegate without dstValAddress", () => {
      expect(() => {
        buildTransactionParams(
          currencyId,
          "redelegate" as StakingOperation,
          validatorAddress,
          amount,
        );
      }).toThrow("SEI redelegate requires dstValAddress");
    });

    it("should build params for getStakedBalance operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "getStakedBalance" as StakingOperation,
        validatorAddress,
        amount,
        validatorAddress,
        delegatorAddress,
      );

      expect(params).toEqual([delegatorAddress, validatorAddress]);
    });

    it("should throw error for getStakedBalance without required params", () => {
      expect(() => {
        buildTransactionParams(
          currencyId,
          "getStakedBalance" as StakingOperation,
          validatorAddress,
          amount,
        );
      }).toThrow("SEI getStakedBalance requires delegator and dstValAddress");
    });
  });

  describe("CELO", () => {
    const currencyId = "celo";
    const celoValidatorAddress = "0x123456789abcdef";

    it("should build params for delegate operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "delegate" as StakingOperation,
        celoValidatorAddress,
        amount,
      );

      expect(params).toEqual([celoValidatorAddress, amount]);
    });

    it("should build params for undelegate operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "undelegate" as StakingOperation,
        celoValidatorAddress,
        amount,
      );

      expect(params).toEqual([celoValidatorAddress, amount]);
    });

    it("should throw error for redelegate operation (not supported)", () => {
      expect(() => {
        buildTransactionParams(
          currencyId,
          "redelegate" as StakingOperation,
          celoValidatorAddress,
          amount,
        );
      }).toThrow("Celo does not support redelegate");
    });

    it("should build params for getStakedBalance operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "getStakedBalance" as StakingOperation,
        celoValidatorAddress,
        amount,
      );

      expect(params).toEqual([celoValidatorAddress]);
    });

    it("should build params for getUnstakedBalance operation", () => {
      const params = buildTransactionParams(
        currencyId,
        "getUnstakedBalance" as StakingOperation,
        celoValidatorAddress,
        amount,
      );

      expect(params).toEqual([celoValidatorAddress]);
    });
  });

  describe("Error handling", () => {
    it("should throw error for unsupported currency", () => {
      expect(() => {
        buildTransactionParams(
          "unsupported_currency",
          "delegate" as StakingOperation,
          validatorAddress,
          amount,
        );
      }).toThrow("Unsupported staking currency: unsupported_currency");
    });

    it("should throw error for unsupported operation type", () => {
      expect(() => {
        buildTransactionParams(
          "sei_evm",
          "invalidOperation" as StakingOperation,
          validatorAddress,
          amount,
        );
      }).toThrow("Unsupported transaction type for sei_evm: invalidOperation");
    });
  });
});
