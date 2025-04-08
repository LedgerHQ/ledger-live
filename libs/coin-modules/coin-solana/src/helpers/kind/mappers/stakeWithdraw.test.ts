import { mapper } from "./stakeWithdraw";

describe("Testing stakeWithdraw mapper", () => {
  it("should map the kind stake.withdraw to the operation type IN", () => {
    expect(mapper.kind).toEqual("stake.withdraw");
    expect(mapper.operationType).toEqual("IN");
  });
});
