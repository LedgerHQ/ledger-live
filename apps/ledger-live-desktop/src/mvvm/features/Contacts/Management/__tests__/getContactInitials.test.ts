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

  it("works with non-letter characters as the leading char of a token", () => {
    // "brian (me)" → first token "brian", last token "(me)"
    expect(getContactInitials("brian (me)")).toBe("B(");
  });

  it("handles digit-only names without crashing", () => {
    expect(getContactInitials("123")).toBe("1");
  });
});
