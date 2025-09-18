import { combine } from "./combine";

describe("combine", () => {
  it("responds with a Stringify version of the payload to broadcast", () => {
    // GIVEN
    const transaction = "0x000000001";
    const signature = "SIGNATURE";

    // WHEN
    const result = combine(transaction, signature);

    // THEN
    expect(JSON.parse(result)).toEqual({
      serialized: "0x000000001",
      signature: "SIGNATURE",
    });
  });
});
