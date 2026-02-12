import { getRecipientDisplayValue, getRecipientSearchPrefillValue } from "../utils";

describe("getRecipientDisplayValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientDisplayValue(null)).toBe("");
  });

  it("should return formatted address without ENS", () => {
    expect(getRecipientDisplayValue({ address: "0x1234567890abcdef" })).toBe("0x123...bcdef");
  });

  it("should use custom options for formatting", () => {
    expect(
      getRecipientDisplayValue(
        { address: "0x1234567890abcdef" },
        { prefixLength: 4, suffixLength: 4 },
      ),
    ).toBe("0x12...cdef");
  });

  it("should return ENS name with formatted address when ENS exists", () => {
    expect(
      getRecipientDisplayValue({ address: "0x1234567890abcdef", ensName: "vitalik.eth" }),
    ).toBe("vitalik.eth (0x123...bcdef)");
  });

  it("should support custom prefix/suffix length", () => {
    expect(
      getRecipientDisplayValue(
        { address: "0x1234567890abcdef" },
        { prefixLength: 4, suffixLength: 4 },
      ),
    ).toBe("0x12...cdef");
  });
});

describe("getRecipientSearchPrefillValue", () => {
  it("should return empty for null recipient", () => {
    expect(getRecipientSearchPrefillValue(null)).toBe("");
  });

  it("should return address when no ENS", () => {
    expect(getRecipientSearchPrefillValue({ address: "0x1234567890abcdef" })).toBe(
      "0x1234567890abcdef",
    );
  });

  it("should return ENS name when present", () => {
    expect(
      getRecipientSearchPrefillValue({ address: "0x1234567890abcdef", ensName: "vitalik.eth" }),
    ).toBe("vitalik.eth");
  });
});
