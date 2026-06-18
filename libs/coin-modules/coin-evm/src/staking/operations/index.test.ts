import { StakingOperation } from "../../types/staking";
import { buildTransactionParams } from ".";

describe("buildTransactionParams", () => {
  const validatorAddress = "seivaloper1abc123";
  // 1 SEI expressed in the EVM-native unit (18 decimals). The precompile
  // expects `undelegate` / `redelegate` amounts in usei (6 decimals), so the
  // calldata should carry 10^6 for the same 1 SEI.
  const amount = 1000000000000000000n;
  const amountInUsei = 1000000n;
  const dstValidatorAddress = "seivaloper1def456";
  const delegatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

  describe("SEI Network", () => {
    const currencyId = "sei_evm";

    it("should build params for delegate operation", () => {
      const params = buildTransactionParams(currencyId, "delegate" as StakingOperation, {
        valAddress: validatorAddress,
        amount,
      });

      expect(params).toEqual([validatorAddress]);
    });

    it("should build params for undelegate operation (amount converted from 18-dec EVM to 6-dec usei)", () => {
      const params = buildTransactionParams(currencyId, "undelegate" as StakingOperation, {
        valAddress: validatorAddress,
        amount,
      });

      expect(params).toEqual([validatorAddress, amountInUsei]);
    });

    it("should build params for redelegate operation (amount converted from 18-dec EVM to 6-dec usei)", () => {
      const params = buildTransactionParams(currencyId, "redelegate" as StakingOperation, {
        valAddress: validatorAddress,
        amount,
        dstValAddress: dstValidatorAddress,
      });

      expect(params).toEqual([validatorAddress, dstValidatorAddress, amountInUsei]);
    });

    it("should truncate sub-usei precision on undelegate (precompile has 6-decimal precision)", () => {
      // 1.234567891 SEI -> truncated to 1.234567 uSEI (9th and later decimals dropped)
      const params = buildTransactionParams(currencyId, "undelegate" as StakingOperation, {
        valAddress: validatorAddress,
        amount: 1234567891000000000n,
      });

      expect(params).toEqual([validatorAddress, 1234567n]);
    });

    it("should throw error for redelegate without dstValAddress", () => {
      expect(() => {
        buildTransactionParams(currencyId, "redelegate" as StakingOperation, {
          valAddress: validatorAddress,
          amount,
        });
      }).toThrow("RedelegateDstValAddressRequired");
    });

    it("should build params for getStakedBalance operation", () => {
      const params = buildTransactionParams(currencyId, "getStakedBalance" as StakingOperation, {
        valAddress: validatorAddress,
        amount,
        dstValAddress: validatorAddress,
        delegator: delegatorAddress,
      });

      expect(params).toEqual([delegatorAddress, validatorAddress]);
    });

    it("should throw error for getStakedBalance without required params", () => {
      expect(() => {
        buildTransactionParams(currencyId, "getStakedBalance" as StakingOperation, {
          valAddress: validatorAddress,
          amount,
        });
      }).toThrow("Sei getStakedBalance requires delegator and dstValAddress");
    });

    it("should return the correct params for a claim rewards", () => {
      const transactionType: StakingOperation = "claimReward";
      const params = buildTransactionParams(currencyId, transactionType, {
        valAddress: validatorAddress,
        amount,
      });

      expect(params).toEqual([validatorAddress]);
    });
  });

  describe("Monad", () => {
    it("builds params for delegate operation (valId as bigint, amount carried by msg.value)", () => {
      const params = buildTransactionParams("monad", "delegate" as StakingOperation, {
        valId: "42",
        amount: 1000000000000000000n,
      });

      expect(params).toStrictEqual([42n]);
    });

    it("builds params for claimReward operation (valId as bigint)", () => {
      const params = buildTransactionParams("monad", "claimReward" as StakingOperation, {
        valId: "42",
        amount: 0n,
      });

      expect(params).toStrictEqual([42n]);
    });

    it("builds params for compoundReward operation (valId as bigint)", () => {
      const params = buildTransactionParams("monad", "compoundReward" as StakingOperation, {
        valId: "42",
        amount: 0n,
      });

      expect(params).toStrictEqual([42n]);
    });

    it("throws when monad staking is missing valId", () => {
      expect(() => {
        buildTransactionParams("monad", "delegate" as StakingOperation, {
          amount: 1000000000000000000n,
        });
      }).toThrow("monad staking requires valId");
    });

    it("builds params for undelegate operation (valId, amount, withdrawId as bigints)", () => {
      const params = buildTransactionParams("monad", "undelegate" as StakingOperation, {
        valId: "42",
        amount: 1000000000000000000n,
        withdrawId: "7",
      });

      expect(params).toStrictEqual([42n, 1000000000000000000n, 7n]);
    });

    it("throws when monad undelegate is missing withdrawId", () => {
      expect(() => {
        buildTransactionParams("monad", "undelegate" as StakingOperation, {
          valId: "42",
          amount: 1000000000000000000n,
        });
      }).toThrow("monad undelegate requires withdrawId");
    });

    it("builds params for withdraw operation (valId, withdrawId as bigints)", () => {
      const params = buildTransactionParams("monad", "withdraw" as StakingOperation, {
        valId: "42",
        amount: 0n,
        withdrawId: "7",
      });

      expect(params).toStrictEqual([42n, 7n]);
    });

    it("throws when monad withdraw is missing withdrawId", () => {
      expect(() => {
        buildTransactionParams("monad", "withdraw" as StakingOperation, {
          valId: "42",
          amount: 0n,
        });
      }).toThrow("monad withdraw requires withdrawId");
    });
  });

  describe("CELO", () => {
    const currencyId = "celo";
    const celoValidatorAddress = "0x123456789abcdef";

    it("should build params for delegate operation", () => {
      const params = buildTransactionParams(currencyId, "delegate" as StakingOperation, {
        valAddress: celoValidatorAddress,
        amount,
      });

      expect(params).toEqual([celoValidatorAddress, amount]);
    });

    it("should build params for undelegate operation", () => {
      const params = buildTransactionParams(currencyId, "undelegate" as StakingOperation, {
        valAddress: celoValidatorAddress,
        amount,
      });

      expect(params).toEqual([celoValidatorAddress, amount]);
    });

    it("should throw error for redelegate operation (not supported)", () => {
      expect(() => {
        buildTransactionParams(currencyId, "redelegate" as StakingOperation, {
          valAddress: celoValidatorAddress,
          amount,
        });
      }).toThrow("Celo does not support redelegate");
    });

    it("should build params for getStakedBalance operation", () => {
      const params = buildTransactionParams(currencyId, "getStakedBalance" as StakingOperation, {
        valAddress: celoValidatorAddress,
        amount,
      });

      expect(params).toEqual([celoValidatorAddress]);
    });

    it("should build params for getUnstakedBalance operation", () => {
      const params = buildTransactionParams(currencyId, "getUnstakedBalance" as StakingOperation, {
        valAddress: celoValidatorAddress,
        amount,
      });

      expect(params).toEqual([celoValidatorAddress]);
    });
  });

  describe("Error handling", () => {
    it("should throw error for unsupported currency", () => {
      expect(() => {
        buildTransactionParams("unsupported_currency", "delegate" as StakingOperation, {
          valAddress: validatorAddress,
          amount,
        });
      }).toThrow("Unsupported staking currency: unsupported_currency");
    });

    it("should throw error for unsupported operation type", () => {
      expect(() => {
        buildTransactionParams("sei_evm", "invalidOperation" as StakingOperation, {
          valAddress: validatorAddress,
          amount,
        });
      }).toThrow("Unsupported transaction type for sei_evm: invalidOperation");
    });

    it.each(["sei_evm", "celo"])("throws when %s staking is missing valAddress", currencyId => {
      expect(() => {
        buildTransactionParams(currencyId, "delegate" as StakingOperation, { amount });
      }).toThrow(`${currencyId} staking requires valAddress`);
    });
  });
});
