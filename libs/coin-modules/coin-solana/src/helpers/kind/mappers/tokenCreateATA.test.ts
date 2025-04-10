import { mapper } from "./tokenCreateATA";

describe("Testing tokenCreateATA mapper", () => {
  it("should map the kind token.createATA to the operation type OPT_IN", () => {
    expect(mapper.kind).toEqual("token.createATA");
    expect(mapper.operationType).toEqual("OPT_IN");
  });
});
