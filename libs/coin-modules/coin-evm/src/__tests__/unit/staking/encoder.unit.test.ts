import { ethers } from "ethers";
import { encodeStakingData, decodeStakingResult } from "../../../staking/encoder";
import { STAKING_CONTRACTS } from "../../../staking/contracts";
import { StakingOperation } from "../../../types/staking";

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
