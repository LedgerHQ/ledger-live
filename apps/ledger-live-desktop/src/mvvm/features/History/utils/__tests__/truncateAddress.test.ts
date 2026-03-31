import { truncateAddress } from "../truncateAddress";

describe("truncateAddress", () => {
  it("should return the full address if it is short", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("should truncate a long address", () => {
    expect(truncateAddress("0x1234567890abcdef")).toBe("0x1234...cdef");
  });
});
