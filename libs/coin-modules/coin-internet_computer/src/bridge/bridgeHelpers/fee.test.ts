import BigNumber from "bignumber.js";
import { ICP_FEES } from "../../consts";
import { getEstimatedFees } from "./fee";

describe("getEstimatedFees", () => {
  it("should return the ICP fee constant as BigNumber", () => {
    expect(getEstimatedFees()).toEqual(new BigNumber(ICP_FEES));
  });
});
