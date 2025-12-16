import BigNumber from "bignumber.js";
import { CASPER_MAX_TRANSFER_ID, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when transfer id is not present (case "%s")',
    (transferId?: string) => {
      const result = validateMemo(transferId);
      expect(result).toBe(true);
    },
  );

  it.each(["a", "a1", "1a", "a1a", "1&", "&1", "1&1"])(
    "should return false when transfer id contains anything else than a number",
    (transferId?: string) => {
      const result = validateMemo(transferId);
      expect(result).toBe(false);
    },
  );

  it.each([
    new BigNumber(CASPER_MAX_TRANSFER_ID),
    new BigNumber(CASPER_MAX_TRANSFER_ID).plus(1),
    new BigNumber(CASPER_MAX_TRANSFER_ID).plus(2),
  ])(
    "should return false when transfer id is only numeric and greater than maximum capser transfer id",
    (transferId: BigNumber) => {
      expect(validateMemo(transferId.toString())).toBe(false);
    },
  );

  it.each([
    new BigNumber(0),
    new BigNumber(CASPER_MAX_TRANSFER_ID).minus(1),
    new BigNumber(CASPER_MAX_TRANSFER_ID).minus(2),
  ])(
    "should return true when transfer id is only numeric and less than maximum capser transfer id",
    (transferId: BigNumber) => {
      expect(validateMemo(transferId.toString())).toBe(true);
    },
  );
});
