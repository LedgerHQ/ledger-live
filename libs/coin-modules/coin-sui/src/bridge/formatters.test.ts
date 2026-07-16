import { BigNumber } from "bignumber.js";
import { fromOperationExtraRaw, toOperationExtraRaw } from "./formatters";

describe("formatters", () => {
  describe("fromOperationExtraRaw", () => {
    it("should return an empty object when no extraRaw is provided", () => {
      const result = fromOperationExtraRaw(undefined);
      expect(result).toEqual({});
    });

    it("hydrates coinType, validatorAddress, stakedAmount", () => {
      const result = fromOperationExtraRaw({
        coinType: "0x2::sui::SUI",
        validatorAddress: "0xabc",
        stakedAmount: "1000000000",
      });
      expect(result).toEqual({
        coinType: "0x2::sui::SUI",
        validatorAddress: "0xabc",
        stakedAmount: "1000000000",
      });
    });

    it("ignores unknown raw keys and missing fields", () => {
      const result = fromOperationExtraRaw({ stakedAmount: "42", noise: "drop" });
      expect(result).toEqual({ stakedAmount: "42" });
    });
  });

  describe("toOperationExtraRaw", () => {
    it("should return an empty object when no extra is provided", () => {
      const result = toOperationExtraRaw(undefined);
      expect(result).toEqual({});
    });

    it("emits only string fields supported by the raw form", () => {
      const result = toOperationExtraRaw({
        coinType: "0x2::sui::SUI",
        validatorAddress: "0xabc",
        stakedAmount: "1000000000",
      });
      expect(result).toEqual({
        coinType: "0x2::sui::SUI",
        validatorAddress: "0xabc",
        stakedAmount: "1000000000",
      });
    });

    it("drops transferAmount (BigNumber, optimistic-only — never persisted)", () => {
      const result = toOperationExtraRaw({
        stakedAmount: "1",
        transferAmount: new BigNumber(5),
      });
      expect(result).toEqual({ stakedAmount: "1" });
    });
  });

  describe("round-trip", () => {
    it("preserves staking extras across raw → live → raw", () => {
      const raw = {
        coinType: "0x2::sui::SUI",
        validatorAddress: "0xv1",
        stakedAmount: "5000000000",
      };
      expect(toOperationExtraRaw(fromOperationExtraRaw(raw))).toEqual(raw);
    });
  });
});
