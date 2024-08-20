import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./fee";
import { ICP_FEES } from "@zondax/ledger-live-icp/neurons";

describe("getEstimatedFees", () => {
  it("should return the correct ICP fees", () => {
    const fees = getEstimatedFees();
    expect(fees).toEqual(new BigNumber(ICP_FEES));
  });
});
