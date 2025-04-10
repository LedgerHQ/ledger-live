import { mapper } from "./stakeUndelegate";

describe("Testing stakeUndelegate mapper", () => {
  it("should map the kind stake.undelegate to the operation type UNDELEGATE", () => {
    expect(mapper.kind).toEqual("stake.undelegate");
    expect(mapper.operationType).toEqual("UNDELEGATE");
  });
});
