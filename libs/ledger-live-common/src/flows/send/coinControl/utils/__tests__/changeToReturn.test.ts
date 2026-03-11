import { BigNumber } from "bignumber.js";
import { getChangeToReturn, hasTxOutputs } from "../changeToReturn";
import type { TransactionStatus } from "../../../../generated/types";

describe("changeToReturn", () => {
  describe("hasTxOutputs", () => {
    it("returns false when status has no txOutputs", () => {
      const status = { errors: {} } as TransactionStatus;
      expect(hasTxOutputs(status)).toBe(false);
    });

    it("returns true when status has txOutputs", () => {
      const status = {
        errors: {},
        txOutputs: [{ isChange: false, value: new BigNumber(100) }],
      } as TransactionStatus & { txOutputs: ReadonlyArray<{ isChange: boolean; value: BigNumber }> };
      expect(hasTxOutputs(status)).toBe(true);
    });
  });

  describe("getChangeToReturn", () => {
    it("returns zero when status has no txOutputs", () => {
      const status = { errors: {} } as TransactionStatus;
      expect(getChangeToReturn(status)).toEqual(new BigNumber(0));
    });

    it("returns zero when txOutputs is empty", () => {
      const status = {
        errors: {},
        txOutputs: [],
      } as TransactionStatus & { txOutputs: ReadonlyArray<{ isChange: boolean; value: BigNumber }> };
      expect(getChangeToReturn(status)).toEqual(new BigNumber(0));
    });

    it("returns zero when no output is change", () => {
      const status = {
        errors: {},
        txOutputs: [
          { isChange: false, value: new BigNumber(1000) },
          { isChange: false, value: new BigNumber(500) },
        ],
      } as TransactionStatus & { txOutputs: ReadonlyArray<{ isChange: boolean; value: BigNumber }> };
      expect(getChangeToReturn(status)).toEqual(new BigNumber(0));
    });

    it("returns sum of change outputs only", () => {
      const status = {
        errors: {},
        txOutputs: [
          { isChange: false, value: new BigNumber(1000) },
          { isChange: true, value: new BigNumber(200) },
          { isChange: true, value: new BigNumber(300) },
        ],
      } as TransactionStatus & { txOutputs: ReadonlyArray<{ isChange: boolean; value: BigNumber }> };
      expect(getChangeToReturn(status)).toEqual(new BigNumber(500));
    });

    it("returns single change output", () => {
      const status = {
        errors: {},
        txOutputs: [{ isChange: true, value: new BigNumber(150) }],
      } as TransactionStatus & { txOutputs: ReadonlyArray<{ isChange: boolean; value: BigNumber }> };
      expect(getChangeToReturn(status)).toEqual(new BigNumber(150));
    });
  });
});
