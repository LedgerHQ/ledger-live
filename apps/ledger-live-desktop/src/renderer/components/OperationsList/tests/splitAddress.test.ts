import { splitAddress } from "../AddressCell";

describe("splitAddress", () => {
  it("should split address with a dot correctly", () => {
    const result = splitAddress("0.0.931774");
    expect(result).toEqual({ left: "0.", right: "0.931774" });
  });

  it("should split address with a special character and a dot correctly", () => {
    const result = splitAddress("abc.def-ghi");
    expect(result).toEqual({ left: "abc.", right: "def-ghi" });
  });

  it("should split address with a special characters", () => {
    const result = splitAddress("abc-def-ghi");
    expect(result).toEqual({ left: "abc-", right: "def-ghi" });
  });

  it("should split address without a dot correctly", () => {
    const result = splitAddress("abcdefghi");
    expect(result).toEqual({ left: "abc", right: "defghi" });
  });

  it("should handle empty string", () => {
    const result = splitAddress("");
    expect(result).toEqual({ left: "", right: "" });
  });

  it("should handle string with one character", () => {
    const result = splitAddress("a");
    expect(result).toEqual({ left: "", right: "a" });
  });

  it("should handle string with two characters", () => {
    const result = splitAddress("ab");
    expect(result).toEqual({ left: "a", right: "b" });
  });
});
