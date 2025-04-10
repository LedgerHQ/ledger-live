import { mapper } from "./stakeSplit";

describe("Testing stakeSplit mapper", () => {
  it("should map the kind stake.split to the operation type OUT", () => {
    expect(mapper.kind).toEqual("stake.split");
    expect(mapper.operationType).toEqual("OUT");
  });
});
