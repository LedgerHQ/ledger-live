import { mapper } from "./transfer";

describe("Testing transfer mapper", () => {
  it("should map the kind transfer to the operation type OUT", () => {
    expect(mapper.kind).toEqual("transfer");
    expect(mapper.operationType).toEqual("OUT");
  });
});
