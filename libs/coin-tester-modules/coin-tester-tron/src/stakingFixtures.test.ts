import { toBase58Witness } from "./stakingFixtures";

describe("toBase58Witness", () => {
  it("converts a 41-prefixed hex witness address to base58check", () => {
    // The tronbox/tre sole witness, read from a block header's `witness_address`.
    expect(toBase58Witness("417e5f4552091a69125d5dfcb7b8c2659029395bdf")).toMatch(
      /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    );
  });

  it("passes an already-base58 address through untouched", () => {
    const base58 = toBase58Witness("417e5f4552091a69125d5dfcb7b8c2659029395bdf");
    expect(toBase58Witness(base58)).toBe(base58);
  });

  it("rejects an empty address rather than returning a bogus one", () => {
    expect(() => toBase58Witness("")).toThrow(/witness address/i);
  });
});
