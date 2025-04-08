import { mapper } from "./stakeDelegate";

describe("Testing stakeDelegate mapper", () => {
  it("should map the kind stake.delegate to the operation type DELEGATE", () => {
    expect(mapper.kind).toEqual("stake.delegate");
    expect(mapper.operationType).toEqual("DELEGATE");
  });
});
