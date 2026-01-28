import { combine } from "./combine";

describe("combine", () => {
  const mockCraftedTransaction = JSON.stringify({
    txPayload: "a56776657273696f6e00",
    details: {
      nonce: 5,
      method: 0,
      sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      params: "",
      value: "100000000000000000",
      gasFeeCap: "100000",
      gasPremium: "50000",
      gasLimit: "1000000",
    },
  });

  it("should combine unsigned transaction with signature", () => {
    const signature = "0102030405060708";

    const result = combine(mockCraftedTransaction, signature);
    const parsed = JSON.parse(result);

    expect(parsed.message).toBeDefined();
    expect(parsed.signature).toBeDefined();
    expect(parsed.signature.type).toBe(1); // secp256k1
  });

  it("should convert hex signature to base64", () => {
    const hexSignature = "deadbeef";

    const result = combine(mockCraftedTransaction, hexSignature);
    const parsed = JSON.parse(result);

    expect(parsed.signature.data).toBe(Buffer.from("deadbeef", "hex").toString("base64"));
  });

  it("should include all message fields from crafted transaction", () => {
    const signature = "aabbccdd";

    const result = combine(mockCraftedTransaction, signature);
    const parsed = JSON.parse(result);

    expect(parsed.message.version).toBe(0);
    expect(parsed.message.method).toBe(0);
    expect(parsed.message.nonce).toBe(5);
    expect(parsed.message.to).toBe("f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y");
    expect(parsed.message.from).toBe("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");
    expect(parsed.message.value).toBe("100000000000000000");
    expect(parsed.message.gaslimit).toBe(1000000);
    expect(parsed.message.gasfeecap).toBe("100000");
    expect(parsed.message.gaspremium).toBe("50000");
  });

  it("should ignore pubkey parameter", () => {
    const signature = "aabbccdd";
    const pubkey = "04abcdef...";

    // Should not throw and pubkey is not used
    const result = combine(mockCraftedTransaction, signature, pubkey);
    const parsed = JSON.parse(result);

    expect(parsed.message).toBeDefined();
    expect(parsed.signature).toBeDefined();
  });

  it("should handle empty params", () => {
    const signature = "aabbccdd";

    const result = combine(mockCraftedTransaction, signature);
    const parsed = JSON.parse(result);

    expect(parsed.message.params).toBe("");
  });

  it("should handle token transfer with params", () => {
    const tokenCraftedTx = JSON.stringify({
      txPayload: "a56776657273696f6e00",
      details: {
        nonce: 10,
        method: 3844450837,
        sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
        recipient: "f410f3huuiyauahgjp7xjbvb7yfpuhvpyxvnqx3qy",
        params: "encoded_transfer_params",
        value: "0",
        gasFeeCap: "200000",
        gasPremium: "100000",
        gasLimit: "2000000",
      },
    });

    const signature = "aabbccdd";
    const result = combine(tokenCraftedTx, signature);
    const parsed = JSON.parse(result);

    expect(parsed.message.method).toBe(3844450837);
    expect(parsed.message.params).toBe("encoded_transfer_params");
    expect(parsed.message.value).toBe("0");
  });

  describe("error handling", () => {
    it("should throw for malformed JSON input", () => {
      const malformedJson = "not valid json {";
      const signature = "aabbccdd";

      expect(() => combine(malformedJson, signature)).toThrow(
        "Invalid unsigned transaction: malformed JSON",
      );
    });

    it("should throw for missing details object", () => {
      const noDetails = JSON.stringify({
        txPayload: "a56776657273696f6e00",
        // missing details
      });
      const signature = "aabbccdd";

      expect(() => combine(noDetails, signature)).toThrow(
        "Invalid unsigned transaction: missing details",
      );
    });

    it("should throw for missing required fields (sender)", () => {
      const missingSender = JSON.stringify({
        txPayload: "a56776657273696f6e00",
        details: {
          nonce: 5,
          recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
          // missing sender
        },
      });
      const signature = "aabbccdd";

      expect(() => combine(missingSender, signature)).toThrow(
        "Invalid unsigned transaction: missing required fields (sender, recipient, nonce)",
      );
    });

    it("should throw for missing required fields (recipient)", () => {
      const missingRecipient = JSON.stringify({
        txPayload: "a56776657273696f6e00",
        details: {
          nonce: 5,
          sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
          // missing recipient
        },
      });
      const signature = "aabbccdd";

      expect(() => combine(missingRecipient, signature)).toThrow(
        "Invalid unsigned transaction: missing required fields (sender, recipient, nonce)",
      );
    });

    it("should throw for missing required fields (nonce)", () => {
      const missingNonce = JSON.stringify({
        txPayload: "a56776657273696f6e00",
        details: {
          sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
          recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
          // missing nonce
        },
      });
      const signature = "aabbccdd";

      expect(() => combine(missingNonce, signature)).toThrow(
        "Invalid unsigned transaction: missing required fields (sender, recipient, nonce)",
      );
    });
  });
});
