import { toAccountAddress } from "./address";

describe("toAccountAddress", () => {
  it("answers the fresh address of the synced account", () => {
    expect(toAccountAddress({ freshAddress: "bc1qfresh" })).toEqual({ freshAddress: "bc1qfresh" });
  });

  it("rejects an account without a fresh address", () => {
    expect(() => toAccountAddress({ freshAddress: "" })).toThrow();
  });
});
