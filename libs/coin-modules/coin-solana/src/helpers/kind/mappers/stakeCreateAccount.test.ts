import { mapper } from "./stakeCreateAccount";

describe("Testing stakeCreateAccount mapper", () => {
  it("should map the kind stake.createAccount to the operation type DELEGATE", () => {
    expect(mapper.kind).toEqual("stake.createAccount");
    expect(mapper.operationType).toEqual("DELEGATE");
  });
});
