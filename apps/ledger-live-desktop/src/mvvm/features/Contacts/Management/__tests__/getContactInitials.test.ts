import { getContactInitials } from "../utils/getContactInitials";

describe("getContactInitials", () => {
  it("returns '' for an empty string", () => {
    expect(getContactInitials("")).toBe("");
  });

  it("returns '' for whitespace-only input", () => {
    expect(getContactInitials("   ")).toBe("");
  });

  it("returns one uppercase letter for a single-token name", () => {
    expect(getContactInitials("me")).toBe("M");
    expect(getContactInitials("Alice")).toBe("A");
  });

  it("returns first + last uppercase letters for a multi-token name", () => {
    expect(getContactInitials("Benoit Lucet")).toBe("BL");
  });

  it("uses the LAST token's first letter for 3+ tokens", () => {
    expect(getContactInitials("  alice  bob  carol  ")).toBe("AC");
  });

  it("uppercases lowercased input", () => {
    expect(getContactInitials("john doe")).toBe("JD");
  });

  it("skips tokens that don't start with an ASCII letter (parenthesized suffix)", () => {
    // "Brian (Me)" → first letter token "Brian", "(Me)" is filtered out
    expect(getContactInitials("Brian (Me)")).toBe("B");
  });

  it("returns '' for digit-only or symbol-only input", () => {
    expect(getContactInitials("123")).toBe("");
    expect(getContactInitials("###")).toBe("");
  });
});
