import { fixPrefixCase } from "./fixPrefixCase";

describe("fixPrefixCase", () => {
  it("should convert uppercase 0X prefix to lowercase 0x", () => {
    const input = "0X1234567890abcdef";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x1234567890abcdef");
  });

  it("should keep lowercase 0x prefix unchanged", () => {
    const input = "0x1234567890abcdef";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x1234567890abcdef");
  });

  it("should add 0x prefix when missing", () => {
    const input = "1234567890abcdef";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x1234567890abcdef");
  });

  it("should handle empty string by adding 0x prefix", () => {
    const input = "";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x");
  });

  it("should handle mixed case prefix 0X", () => {
    const input = "0X123abc";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x123abc");
  });

  it("should handle string starting with just 0 by adding x", () => {
    const input = "01234";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x01234");
  });

  it("should handle valid ethereum address", () => {
    const input = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4");
  });

  it("should handle address without prefix", () => {
    const input = "742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const result = fixPrefixCase(input);
    expect(result).toBe("0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4");
  });
});
