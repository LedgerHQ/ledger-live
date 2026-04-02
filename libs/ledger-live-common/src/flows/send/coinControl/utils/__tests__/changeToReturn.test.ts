import { BigNumber } from "bignumber.js";
import { getChangeToReturn, hasTxOutputs, type StatusWithTxOutputs } from "../changeToReturn";
import type { TransactionStatus } from "../../../../../coin-modules/transaction-types";

const createStatus = (
  overrides: Partial<TransactionStatus> & {
    txOutputs?: Array<{ isChange: boolean; value: BigNumber }>;
  } = {},
): StatusWithTxOutputs => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
  ...overrides,
});

describe("changeToReturn", () => {
  describe("hasTxOutputs", () => {
    it("returns false when status has no txOutputs", () => {
      expect(hasTxOutputs(createStatus())).toBe(false);
    });

    it("returns true when status has txOutputs", () => {
      expect(
        hasTxOutputs(createStatus({ txOutputs: [{ isChange: false, value: new BigNumber(100) }] })),
      ).toBe(true);
    });
  });

  describe("getChangeToReturn", () => {
    it("returns zero when status has no txOutputs", () => {
      expect(getChangeToReturn(createStatus())).toEqual(new BigNumber(0));
    });

    it("returns zero when txOutputs is empty", () => {
      expect(getChangeToReturn(createStatus({ txOutputs: [] }))).toEqual(new BigNumber(0));
    });

    it("returns zero when no output is change", () => {
      const status = createStatus({
        txOutputs: [
          { isChange: false, value: new BigNumber(1000) },
          { isChange: false, value: new BigNumber(500) },
        ],
      });
      expect(getChangeToReturn(status)).toEqual(new BigNumber(0));
    });

    it("returns sum of change outputs only", () => {
      const status = createStatus({
        txOutputs: [
          { isChange: false, value: new BigNumber(1000) },
          { isChange: true, value: new BigNumber(200) },
          { isChange: true, value: new BigNumber(300) },
        ],
      });
      expect(getChangeToReturn(status)).toEqual(new BigNumber(500));
    });

    it("returns single change output", () => {
      const status = createStatus({
        txOutputs: [{ isChange: true, value: new BigNumber(150) }],
      });
      expect(getChangeToReturn(status)).toEqual(new BigNumber(150));
    });
  });
});
