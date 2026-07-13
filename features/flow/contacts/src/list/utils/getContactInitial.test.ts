import { getContactInitial } from "./getContactInitial";

describe("getContactInitial", () => {
  it("returns the first character in uppercase", () => {
    expect(getContactInitial("olive")).toBe("O");
    expect(getContactInitial("eleonore")).toBe("E");
  });

  it("preserves a Unicode initial", () => {
    expect(getContactInitial("💎 Ledger")).toBe("💎");
  });

  it("returns an empty string for an empty name", () => {
    expect(getContactInitial("")).toBe("");
  });
});
