import { mapper } from "./tokenTransfer";

describe("Testing tokenTransfer mapper", () => {
  it("should map the kind token.transfer to the operation type FEES", () => {
    expect(mapper.kind).toEqual("token.transfer");
    expect(mapper.operationType).toEqual("FEES");
  });
});
