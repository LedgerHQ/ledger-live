import { formatAddress } from "../formatAddress";

describe("formatAddress", () => {
  it("should format an address when lenght is greater than 11", () => {
    const address = "0x1234567890abcdef";
    expect(formatAddress(address)).toBe("0x12...cdef");
  });

  it("should return the same address when length is 11 or less", () => {
    const address = "12345678901";
    const formattedAddress = formatAddress(address);
    expect(formattedAddress).toBe(address);
  });

  it("should return the address when lenght is less than 11", () => {
    const address = "0x12345678";
    expect(formatAddress(address)).toBe(address);
  });
});
