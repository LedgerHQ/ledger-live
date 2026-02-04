/**
 * Unit tests for combine function.
 * Tests transaction signing combination logic (Story 4.5).
 */
import { combine } from "./combine";

describe("combine", () => {
  const VALID_UNSIGNED_TX = JSON.stringify({
    nonce: 42,
    value: "1000000000000000000",
    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    gasPrice: 1000000000,
    gasLimit: 50000,
    chainID: "1",
    version: 2,
    options: 1,
  });

  const VALID_SIGNATURE =
    "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  describe("Task 4.2: Combines valid unsigned transaction with signature", () => {
    it("combines valid unsigned transaction with signature", () => {
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);

      const parsed = JSON.parse(result);
      expect(parsed.signature).toBe(VALID_SIGNATURE);
      expect(parsed.nonce).toBe(42);
      expect(parsed.value).toBe("1000000000000000000");
    });
  });

  describe("Task 4.3: Returns JSON string with signature field", () => {
    it("returns JSON string format", () => {
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
      expect(typeof result).toBe("string");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("result contains signature field", () => {
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("signature");
    });
  });

  describe("Task 4.4: Handles malformed JSON input gracefully (AC: #3)", () => {
    it("throws error for malformed JSON input with original error message", () => {
      expect(() => combine("invalid json", VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: malformed JSON",
      );
      // Verify it includes original error details
      try {
        combine("invalid json", VALID_SIGNATURE);
      } catch (error) {
        expect((error as Error).message).toContain("malformed JSON");
      }
    });

    it("throws error for partial JSON", () => {
      expect(() => combine('{"nonce": 42', VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: malformed JSON",
      );
    });

    it("throws error for empty string input", () => {
      expect(() => combine("", VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: malformed JSON",
      );
    });

    it("throws error for null input", () => {
      expect(() => combine("null", VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: must be an object",
      );
    });

    it("throws error for array input", () => {
      // Arrays are objects in JS, so they pass the object check but fail required fields validation
      expect(() => combine("[]", VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: missing or invalid required fields",
      );
    });
  });

  describe("Task 4.5: Handles empty signature string (AC: #3)", () => {
    it("handles empty signature string", () => {
      const result = combine(VALID_UNSIGNED_TX, "");
      const parsed = JSON.parse(result);
      expect(parsed.signature).toBe("");
    });

    it("handles whitespace signature", () => {
      const result = combine(VALID_UNSIGNED_TX, "   ");
      const parsed = JSON.parse(result);
      expect(parsed.signature).toBe("   ");
    });
  });

  describe("Task 4.6: Preserves all transaction fields when adding signature", () => {
    it("preserves all transaction fields when adding signature", () => {
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
      const parsed = JSON.parse(result);

      expect(parsed.nonce).toBe(42);
      expect(parsed.value).toBe("1000000000000000000");
      expect(parsed.receiver).toBe(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      );
      expect(parsed.sender).toBe(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      );
      expect(parsed.gasPrice).toBe(1000000000);
      expect(parsed.gasLimit).toBe(50000);
      expect(parsed.chainID).toBe("1");
      expect(parsed.version).toBe(2);
      expect(parsed.options).toBe(1);
    });

    it("handles transaction with optional data field", () => {
      const txWithData = JSON.stringify({
        ...JSON.parse(VALID_UNSIGNED_TX),
        data: "ZGVsZWdhdGU=", // base64 encoded "delegate"
      });

      const result = combine(txWithData, VALID_SIGNATURE);
      const parsed = JSON.parse(result);
      expect(parsed.data).toBe("ZGVsZWdhdGU=");
      expect(parsed.signature).toBe(VALID_SIGNATURE);
    });
  });

  describe("Task 4.7: Output format matches expected broadcast format", () => {
    it("output format matches expected broadcast format", () => {
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
      const parsed = JSON.parse(result);

      // Verify structure matches MultiversXProtocolTransaction with signature
      expect(parsed).toHaveProperty("nonce");
      expect(parsed).toHaveProperty("value");
      expect(parsed).toHaveProperty("receiver");
      expect(parsed).toHaveProperty("sender");
      expect(parsed).toHaveProperty("gasPrice");
      expect(parsed).toHaveProperty("gasLimit");
      expect(parsed).toHaveProperty("chainID");
      expect(parsed).toHaveProperty("version");
      expect(parsed).toHaveProperty("options");
      expect(parsed).toHaveProperty("signature");

      // Verify types match expected format
      expect(typeof parsed.nonce).toBe("number");
      expect(typeof parsed.value).toBe("string");
      expect(typeof parsed.receiver).toBe("string");
      expect(typeof parsed.sender).toBe("string");
      expect(typeof parsed.gasPrice).toBe("number");
      expect(typeof parsed.gasLimit).toBe("number");
      expect(typeof parsed.chainID).toBe("string");
      expect(typeof parsed.version).toBe("number");
      expect(typeof parsed.options).toBe("number");
      expect(typeof parsed.signature).toBe("string");
    });
  });

  describe("Edge cases", () => {
    it("ignores pubkey parameter (not used by MultiversX)", () => {
      const resultWithPubkey = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE, "pubkey123");
      const resultWithoutPubkey = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);

      // Both should produce identical results
      expect(resultWithPubkey).toBe(resultWithoutPubkey);
    });

    it("handles large nonce values", () => {
      const txWithLargeNonce = JSON.stringify({
        ...JSON.parse(VALID_UNSIGNED_TX),
        nonce: 999999999,
      });

      const result = combine(txWithLargeNonce, VALID_SIGNATURE);
      const parsed = JSON.parse(result);
      expect(parsed.nonce).toBe(999999999);
    });

    it("handles long signature strings", () => {
      const longSignature = "a".repeat(256);
      const result = combine(VALID_UNSIGNED_TX, longSignature);
      const parsed = JSON.parse(result);
      expect(parsed.signature).toBe(longSignature);
    });

    it("overwrites existing signature field if present (edge case)", () => {
      // Transaction that already has a signature field (shouldn't happen, but handle gracefully)
      const txWithExistingSignature = JSON.stringify({
        ...JSON.parse(VALID_UNSIGNED_TX),
        signature: "old_signature_should_be_overwritten",
      });

      const result = combine(txWithExistingSignature, VALID_SIGNATURE);
      const parsed = JSON.parse(result);

      // New signature should overwrite old one
      expect(parsed.signature).toBe(VALID_SIGNATURE);
      expect(parsed.signature).not.toBe("old_signature_should_be_overwritten");
    });
  });

  describe("Input validation", () => {
    it("throws error for missing required fields", () => {
      const incompleteTx = JSON.stringify({
        nonce: 42,
        // Missing other required fields
      });

      expect(() => combine(incompleteTx, VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: missing or invalid required fields",
      );
    });

    it("throws error for wrong field types", () => {
      const wrongTypeTx = JSON.stringify({
        nonce: "42", // Should be number
        value: "1000000000000000000",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

      expect(() => combine(wrongTypeTx, VALID_SIGNATURE)).toThrow(
        "Invalid unsigned transaction: missing or invalid required fields",
      );
    });

    it("validates all required fields are present and correct type", () => {
      // This should pass - all fields present and correct types
      const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
