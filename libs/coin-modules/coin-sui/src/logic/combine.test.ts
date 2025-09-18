import { combine } from "./combine";

describe("combine", () => {
  test("should correctly combine transaction and signature", () => {
    const tx = "abcdef1234567890";
    const signature = "signature123";
    const result = combine(tx, signature);
    // Expected format: length (4 hex chars) + tx + signature
    expect(result).toBe("0010abcdef1234567890signature123");
  });

  test("should handle empty transaction", () => {
    const tx = "";
    const signature = "signature123";
    const result = combine(tx, signature);
    expect(result).toBe("0000signature123");
  });

  test("should handle empty signature", () => {
    const tx = "abcdef1234567890";
    const signature = "";
    const result = combine(tx, signature);
    expect(result).toBe("0010abcdef1234567890");
  });

  test("should pad transaction length with zeros", () => {
    const tx = "a"; // length 1
    const signature = "sig";
    const result = combine(tx, signature);
    expect(result).toBe("0001asig");
  });

  test("should handle longer transactions", () => {
    const tx = "a".repeat(256); // length 256 (0x100)
    const signature = "sig";
    const result = combine(tx, signature);
    expect(result).toBe("0100" + "a".repeat(256) + "sig");
  });
});
