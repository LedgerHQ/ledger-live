import { ethers } from "ethers";
import { StakingOperation } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";
import { encodeStakingData, decodeStakingResult } from "./encoder";
import { extractSeiDelegation, getSeiDelegationAmount } from "../utils";

describe("encodeStakingData", () => {
  describe("SEI Network", () => {
    const currencyId = "sei_evm";
    const config = STAKING_CONTRACTS[currencyId];

    it("should encode delegate operation", () => {
      const validatorAddress = "seivaloper1abc123";
      const params = [validatorAddress];

      const encoded = encodeStakingData({
        currencyId,
        operation: "delegate" as StakingOperation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });

    it("should encode undelegate operation", () => {
      const validatorAddress = "seivaloper1abc123";
      const amount = 1000000000000000000n;
      const params = [validatorAddress, amount];

      const encoded = encodeStakingData({
        currencyId,
        operation: "undelegate" as StakingOperation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });

    it("should encode redelegate operation", () => {
      const srcAddress = "seivaloper1abc123";
      const dstAddress = "seivaloper1def456";
      const amount = 1000000000000000000n;
      const params = [srcAddress, dstAddress, amount];

      const encoded = encodeStakingData({
        currencyId,
        operation: "redelegate" as StakingOperation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });

    it("should encode claim rewards operation", () => {
      const operation: StakingOperation = "claimReward";
      const validatorAddress = "seivaloper1abc123";
      const params = [validatorAddress];

      const encoded = encodeStakingData({
        currencyId,
        operation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });
  });

  describe("Monad", () => {
    const currencyId = "monad";
    const config = STAKING_CONTRACTS[currencyId];
    const validatorId = 42n;
    const delegatorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const amount = 1000000000000000000n; // 1 MON in wei

    it("should encode delegate with known selector 0x84994fec", () => {
      const encoded = encodeStakingData({
        currencyId,
        operation: "delegate" as StakingOperation,
        config,
        params: [validatorId],
      });
      expect(encoded.startsWith("0x84994fec")).toBe(true);
    });

    it("should encode undelegate with known selector 0x5cf41514", () => {
      const encoded = encodeStakingData({
        currencyId,
        operation: "undelegate" as StakingOperation,
        config,
        params: [validatorId, amount, 0],
      });
      expect(encoded.startsWith("0x5cf41514")).toBe(true);
    });

    it("should encode claimReward (claimRewards) with known selector 0xa76e2ca5", () => {
      const encoded = encodeStakingData({
        currencyId,
        operation: "claimReward" as StakingOperation,
        config,
        params: [validatorId],
      });
      expect(encoded.startsWith("0xa76e2ca5")).toBe(true);
    });

    it("should encode getStakedBalance (getDelegator) with known selector 0x573c1ce0", () => {
      const encoded = encodeStakingData({
        currencyId,
        operation: "getStakedBalance" as StakingOperation,
        config,
        params: [validatorId, delegatorAddress],
      });
      expect(encoded.startsWith("0x573c1ce0")).toBe(true);
    });
  });

  describe("CELO", () => {
    const currencyId = "celo";
    const config = STAKING_CONTRACTS[currencyId];

    it("should encode delegate operation", () => {
      const account = "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d";
      const value = 1000000000000000000n;
      const params = [account, value];

      const encoded = encodeStakingData({
        currencyId,
        operation: "delegate" as StakingOperation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });

    it("should encode undelegate operation", () => {
      const account = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
      const value = 1000000000000000000n;
      const params = [account, value];

      const encoded = encodeStakingData({
        currencyId,
        operation: "undelegate" as StakingOperation,
        config,
        params,
      });

      expect(encoded.startsWith("0x")).toBe(true);
    });
  });

  describe("Error handling", () => {
    const config = STAKING_CONTRACTS["sei_evm"];

    it("should throw error for unsupported currency", () => {
      expect(() => {
        encodeStakingData({
          currencyId: "unsupported_currency",
          operation: "delegate" as StakingOperation,
          config,
          params: ["validator"],
        });
      }).toThrow("No ABI found for staking currency: unsupported_currency");
    });

    it("should throw error for unsupported operation", () => {
      expect(() => {
        encodeStakingData({
          currencyId: "sei_evm",
          operation: "invalidOperation" as StakingOperation,
          config,
          params: ["validator"],
        });
      }).toThrow("Operation 'invalidOperation' not supported for currency: sei_evm");
    });
  });
});

describe("decodeStakingResult", () => {
  describe("Monad", () => {
    const currencyId = "monad";
    const config = STAKING_CONTRACTS[currencyId];

    it("should decode getDelegator result and expose stake as decoded[0]", () => {
      const stakeAmount = 2500000000000000000n; // 2.5 MON in wei

      // Build a getDelegator-shaped result using the Monad ABI.
      const iface = new ethers.Interface([
        {
          type: "function",
          name: "getDelegator",
          inputs: [
            { name: "validatorId", type: "uint64", internalType: "uint64" },
            { name: "delegator", type: "address", internalType: "address" },
          ],
          outputs: [
            { name: "stake", type: "uint256", internalType: "uint256" },
            { name: "accRewardPerToken", type: "uint256", internalType: "uint256" },
            { name: "unclaimedRewards", type: "uint256", internalType: "uint256" },
            { name: "deltaStake", type: "uint256", internalType: "uint256" },
            { name: "nextDeltaStake", type: "uint256", internalType: "uint256" },
            { name: "deltaEpoch", type: "uint64", internalType: "uint64" },
            { name: "nextDeltaEpoch", type: "uint64", internalType: "uint64" },
          ],
          stateMutability: "nonpayable",
        },
      ]);

      const encodedResult = iface.encodeFunctionResult("getDelegator", [
        stakeAmount,    // stake
        0n,             // accRewardPerToken
        100000000n,     // unclaimedRewards
        0n,             // deltaStake
        0n,             // nextDeltaStake
        0n,             // deltaEpoch
        0n,             // nextDeltaEpoch
      ]);

      const decoded = decodeStakingResult(currencyId, "getStakedBalance" as StakingOperation, config, encodedResult);

      expect(decoded[0]).toBe(stakeAmount);
    });
  });

  describe("SEI Network", () => {
    const currencyId = "sei_evm";
    const config = STAKING_CONTRACTS[currencyId];

    it("should decode delegation result", () => {
      const mockBalance = {
        amount: 1000000000000000000n,
        denom: "usei",
      };
      const mockDelegation = {
        delegator_address: "sei1abc123",
        shares: 1000000000000000000n,
        decimals: 18n,
        validator_address: "seivaloper1abc123",
      };

      const iface = new ethers.Interface([
        {
          inputs: [
            { internalType: "address", name: "delegator", type: "address" },
            { internalType: "string", name: "valAddress", type: "string" },
          ],
          name: "delegation",
          outputs: [
            {
              components: [
                {
                  components: [
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "string", name: "denom", type: "string" },
                  ],
                  internalType: "struct Balance",
                  name: "balance",
                  type: "tuple",
                },
                {
                  components: [
                    { internalType: "string", name: "delegator_address", type: "string" },
                    { internalType: "uint256", name: "shares", type: "uint256" },
                    { internalType: "uint256", name: "decimals", type: "uint256" },
                    { internalType: "string", name: "validator_address", type: "string" },
                  ],
                  internalType: "struct DelegationDetails",
                  name: "delegation",
                  type: "tuple",
                },
              ],
              internalType: "struct Delegation",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ]);

      const encodedResult = iface.encodeFunctionResult("delegation", [
        [mockBalance, mockDelegation],
      ]);

      const decoded = decodeStakingResult(
        currencyId,
        "getStakedBalance" as StakingOperation,
        config,
        encodedResult,
      );

      expect(decoded).toBeInstanceOf(Array);
      expect(decoded.length).toBeGreaterThan(0);
    });

    it("should produce an ethers.Result compatible with extractSeiDelegation", () => {
      const useiAmount = 5000000n; // 5 SEI in usei (6 decimals)
      const iface = new ethers.Interface([
        {
          inputs: [
            { internalType: "address", name: "delegator", type: "address" },
            { internalType: "string", name: "valAddress", type: "string" },
          ],
          name: "delegation",
          outputs: [
            {
              components: [
                {
                  components: [
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "string", name: "denom", type: "string" },
                  ],
                  internalType: "struct Balance",
                  name: "balance",
                  type: "tuple",
                },
                {
                  components: [
                    { internalType: "string", name: "delegator_address", type: "string" },
                    { internalType: "uint256", name: "shares", type: "uint256" },
                    { internalType: "uint256", name: "decimals", type: "uint256" },
                    { internalType: "string", name: "validator_address", type: "string" },
                  ],
                  internalType: "struct DelegationDetails",
                  name: "delegation",
                  type: "tuple",
                },
              ],
              internalType: "struct Delegation",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ]);

      const encodedResult = iface.encodeFunctionResult("delegation", [
        [
          { amount: useiAmount, denom: "usei" },
          {
            delegator_address: "sei1abc",
            shares: useiAmount,
            decimals: 6n,
            validator_address: "seivaloper1xyz",
          },
        ],
      ]);

      const decoded = decodeStakingResult(
        "sei_evm",
        "getStakedBalance" as StakingOperation,
        STAKING_CONTRACTS["sei_evm"],
        encodedResult,
      );

      const delegation = extractSeiDelegation(decoded);
      expect(delegation?.balance.denom).toBe("usei");

      const amount = getSeiDelegationAmount(delegation);
      expect(amount).toBe(useiAmount * 10n ** 12n);
    });
  });

  describe("Error handling", () => {
    const config = STAKING_CONTRACTS["sei_evm"];

    it("should throw error for unsupported currency", () => {
      expect(() => {
        decodeStakingResult(
          "unsupported_currency",
          "getStakedBalance" as StakingOperation,
          config,
          "0x",
        );
      }).toThrow("No ABI found for staking currency: unsupported_currency");
    });

    it("should throw error for unsupported operation", () => {
      expect(() => {
        decodeStakingResult("sei_evm", "invalidOperation" as StakingOperation, config, "0x");
      }).toThrow("Operation 'invalidOperation' not supported for currency: sei_evm");
    });
  });
});
