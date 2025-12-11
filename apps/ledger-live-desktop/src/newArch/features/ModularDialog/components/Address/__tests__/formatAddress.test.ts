import { formatAddress } from "../formatAddress";

describe("formatAddress", () => {
  it("should format address correctly with default options", () => {
    const address = "1234567890abcdef1234567890abcdef12345678";
    const formattedAddress = formatAddress(address);
    expect(formattedAddress).toBe("1234...5678");
  });

  it("should format address correctly with custom options", () => {
    const address = "1234567890abcdef1234567890abcdef12345678bbbbbbbbbb";
    const formattedAddress = formatAddress(address, {
      prefixLength: 8,
      suffixLength: 8,
      separator: "---",
    });
    expect(formattedAddress).toBe("12345678---bbbbbbbb");
  });

  it("should return the original address if it's shorter than the threshold", () => {
    const address = "12345";
    const formattedAddress = formatAddress(address);
    expect(formattedAddress).toBe(address);
  });

  it("should return an empty string if the address is empty", () => {
    const formattedAddress = formatAddress("");
    expect(formattedAddress).toBe("");
  });

  it("should return all the address if threshold is greater to address lenght", () => {
    const address = "123456789";
    const formattedAddress = formatAddress(address, {
      threshold: 10,
    });
    expect(formattedAddress).toBe("123456789");
  });

  it("should handle addresses with only suffix length", () => {
    const address = "1234567890abcdef";
    const formattedAddress = formatAddress(address, {
      prefixLength: 0,
      suffixLength: 10,
      separator: "---",
    });
    expect(formattedAddress).toBe("---7890abcdef");
  });

  it("should handle addresses with no separator", () => {
    const address = "1234567890abcdef1234567890abcdef";
    const formattedAddress = formatAddress(address, {
      prefixLength: 5,
      suffixLength: 5,
      separator: "",
    });
    expect(formattedAddress).toBe("12345bcdef");
  });
});
