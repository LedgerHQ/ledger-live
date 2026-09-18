import { initialTrustchainState, TrustchainStateSchema } from "./schema";
import { makeTrustchainState } from "./schema.mock";

describe("TrustchainStateSchema", () => {
  it("accepts the initial empty state", () => {
    expect(TrustchainStateSchema.parse(initialTrustchainState)).toEqual(initialTrustchainState);
  });

  it("accepts a mocked populated state", () => {
    const state = makeTrustchainState();
    expect(TrustchainStateSchema.parse(state)).toEqual(state);
  });

  it("rejects a private key field on the member handle", () => {
    expect(() =>
      TrustchainStateSchema.parse({
        ...makeTrustchainState(),
        memberKey: {
          id: "member-key",
          publicKey: "02".padEnd(66, "0"),
          privateKey: "aa",
        },
      }),
    ).toThrow();
  });
});
