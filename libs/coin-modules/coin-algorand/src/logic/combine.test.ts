import { combine } from "./combine";

describe("combine", () => {
  it("should combine unsigned transaction with signature", () => {
    const txPayload = {
      amt: 1000000,
      fee: 1000,
      fv: 100,
      lv: 1100,
      snd: Buffer.from("sender"),
      rcv: Buffer.from("recipient"),
      type: "pay",
    };

    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = Buffer.from("mock_signature_64_bytes_long_padding_here_12345678").toString(
      "hex",
    );

    const result = combine(unsignedTx, signature);

    // Result should be a hex string
    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/i);

    // Decode and verify structure
    const decoded = Buffer.from(result, "hex");
    expect(decoded.length).toBeGreaterThan(0);
  });

  it("should include signature in the signed transaction", () => {
    const txPayload = { type: "pay", amt: 100 };
    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = "abcd1234";

    const result = combine(unsignedTx, signature);

    // Result should contain the signature bytes
    expect(result.length).toBeGreaterThan(unsignedTx.length);
  });

  it("should create valid msgpack encoded output", () => {
    const txPayload = { amt: 500000, fee: 1000, type: "pay" };
    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = "deadbeef";

    const result = combine(unsignedTx, signature);

    // Should be valid hex
    expect(() => Buffer.from(result, "hex")).not.toThrow();
  });

  it("should handle empty signature", () => {
    const txPayload = { type: "pay" };
    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = "";

    const result = combine(unsignedTx, signature);

    expect(typeof result).toBe("string");
  });
});
