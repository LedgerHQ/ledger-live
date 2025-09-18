import { padAddress } from "./padAddress";

describe("padAddress", () => {
  it("should pad a short address to 64 characters after 0x", () => {
    const input = "0x123";
    const result = padAddress(input);
    expect(result).toBe("0x0000000000000000000000000000000000000000000000000000000000000123");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should not modify an already properly padded address", () => {
    const input = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4000000000000000000000000";
    const result = padAddress(input);
    expect(result).toBe(input);
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should pad a normal ethereum address to 64 characters", () => {
    const input = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const result = padAddress(input);
    expect(result).toBe("0x000000000000000000000000742d35Cc6634C0532925a3b8D0B251d8c1743eC4");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should handle address with only one character after 0x", () => {
    const input = "0xa";
    const result = padAddress(input);
    expect(result).toBe("0x000000000000000000000000000000000000000000000000000000000000000a");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should handle empty address after 0x", () => {
    const input = "0x";
    const result = padAddress(input);
    expect(result).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should pad address with mixed case hex characters", () => {
    const input = "0xAbCdEf123456";
    const result = padAddress(input);
    expect(result).toBe("0x0000000000000000000000000000000000000000000000000000AbCdEf123456");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should handle address that needs only a few padding zeros", () => {
    const input = "0x123456789012345678901234567890123456789012345678901234567890123";
    const result = padAddress(input);
    expect(result).toBe("0x0123456789012345678901234567890123456789012345678901234567890123");
    expect(result.split("x")[1]).toHaveLength(64);
  });

  it("should preserve the 0x prefix", () => {
    const input = "0x123abc";
    const result = padAddress(input);
    expect(result.startsWith("0x")).toBe(true);
  });

  it("should handle maximum length input (63 chars after 0x)", () => {
    const input = "0x123456789012345678901234567890123456789012345678901234567890123";
    const result = padAddress(input);
    expect(result).toBe("0x0123456789012345678901234567890123456789012345678901234567890123");
    expect(result.split("x")[1]).toHaveLength(64);
  });
});
