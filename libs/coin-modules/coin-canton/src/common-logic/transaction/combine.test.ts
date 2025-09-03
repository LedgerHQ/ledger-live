import { combine } from "./combine";

describe("combine", () => {
  it("responds with a Stringify version of the payload to broadcast", () => {
    // GIVEN
    const transaction = {
      transaction: {
        serialized: "SERIALIZED",
        json: "JSON",
        hash: "HASH",
      },
    };
    const signature = "SIGNATURE";

    // WHEN
    const result = combine(JSON.stringify(transaction), signature);

    // THEN
    expect(JSON.parse(result)).toEqual({
      transaction: {
        serialized: "SERIALIZED",
        json: "JSON",
        hash: "HASH",
      },
      signature: "SIGNATURE",
    });
  });
});
