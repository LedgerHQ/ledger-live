import { AccountAddress } from "./address";

describe("AccountAddress", () => {
  describe("fromBase58", () => {
    it("should parse valid Base58 address", () => {
      // GIVEN - valid Concordium address
      const address = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

      // WHEN
      const result = AccountAddress.fromBase58(address);

      // THEN
      expect(result.address).toBe(address);
      expect(result.toBase58()).toBe(address);
      expect(result.toBuffer().length).toBe(32);
    });

    it("should throw error for address shorter than 50 characters", () => {
      // GIVEN
      const shortAddress = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VS";

      // WHEN/THEN
      expect(() => AccountAddress.fromBase58(shortAddress)).toThrow(
        "Address must be 50 characters",
      );
    });

    it("should throw error for address longer than 50 characters", () => {
      // GIVEN
      const longAddress = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1GX";

      // WHEN/THEN
      expect(() => AccountAddress.fromBase58(longAddress)).toThrow("Address must be 50 characters");
    });

    // Note: Testing invalid version byte is difficult because addresses with different
    // version bytes encode to different lengths in base58, so they would fail the
    // length check (line 40-42) before reaching the version check (line 46-48).

    it("should throw error for invalid base58 characters", () => {
      // GIVEN - contains invalid base58 characters (0, O, I, l)
      const invalidBase58 = "0kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

      // WHEN/THEN
      expect(() => AccountAddress.fromBase58(invalidBase58)).toThrow();
    });
  });

  describe("fromBuffer", () => {
    it("should create address from 32-byte buffer", () => {
      // GIVEN
      const buffer = Buffer.alloc(32, 0xaa);

      // WHEN
      const result = AccountAddress.fromBuffer(buffer);

      // THEN
      expect(result.toBuffer()).toEqual(buffer);
      // Verify roundtrip: fromBuffer → toBase58 → fromBase58 → toBuffer
      const roundtrip = AccountAddress.fromBase58(result.toBase58());
      expect(roundtrip.toBuffer()).toEqual(buffer);
    });

    it("should throw error for buffer shorter than 32 bytes", () => {
      // GIVEN
      const shortBuffer = Buffer.alloc(31, 0xaa);

      // WHEN/THEN
      expect(() => AccountAddress.fromBuffer(shortBuffer)).toThrow(
        "Address buffer must be 32 bytes",
      );
    });

    it("should throw error for buffer longer than 32 bytes", () => {
      // GIVEN
      const longBuffer = Buffer.alloc(33, 0xaa);

      // WHEN/THEN
      expect(() => AccountAddress.fromBuffer(longBuffer)).toThrow(
        "Address buffer must be 32 bytes",
      );
    });

    it("should throw error for empty buffer", () => {
      // GIVEN
      const emptyBuffer = Buffer.alloc(0);

      // WHEN/THEN
      expect(() => AccountAddress.fromBuffer(emptyBuffer)).toThrow(
        "Address buffer must be 32 bytes",
      );
    });
  });

  describe("toBase58", () => {
    it("should convert to Base58 string", () => {
      // GIVEN
      const buffer = Buffer.alloc(32, 0x01);
      const address = AccountAddress.fromBuffer(buffer);

      // WHEN
      const result = address.toBase58();

      // THEN
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Verify roundtrip correctness
      expect(AccountAddress.fromBase58(result).toBuffer()).toEqual(buffer);
    });

    it("should be deterministic (same buffer produces same Base58)", () => {
      // GIVEN
      const buffer = Buffer.alloc(32, 0x42);
      const address1 = AccountAddress.fromBuffer(buffer);
      const address2 = AccountAddress.fromBuffer(buffer);

      // WHEN
      const base58_1 = address1.toBase58();
      const base58_2 = address2.toBase58();

      // THEN
      expect(base58_1).toBe(base58_2);
    });
  });

  describe("toBuffer", () => {
    it("should return copy of original buffer", () => {
      // GIVEN
      const originalBuffer = Buffer.alloc(32, 0x55);
      const address = AccountAddress.fromBuffer(originalBuffer);

      // WHEN
      const result = address.toBuffer();

      // THEN
      expect(result).toEqual(originalBuffer);
      expect(result).not.toBe(originalBuffer); // Should be a copy, not the same reference
    });

    it("should return 32-byte buffer", () => {
      // GIVEN
      const buffer = Buffer.alloc(32, 0xff);
      const address = AccountAddress.fromBuffer(buffer);

      // WHEN
      const result = address.toBuffer();

      // THEN
      expect(result.length).toBe(32);
    });
  });

  describe("roundtrip conversion", () => {
    it("should maintain data integrity through Base58 → Buffer → Base58", () => {
      // GIVEN
      const original = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

      // WHEN
      const address = AccountAddress.fromBase58(original);
      const buffer = address.toBuffer();
      const reconstructed = AccountAddress.fromBuffer(buffer);

      // THEN
      expect(reconstructed.toBase58()).toBe(original);
    });

    it("should maintain data integrity through Buffer → Base58 → Buffer", () => {
      // GIVEN
      const original = Buffer.alloc(32);
      for (let i = 0; i < 32; i++) {
        original[i] = i;
      }

      // WHEN
      const address = AccountAddress.fromBuffer(original);
      const base58 = address.toBase58();
      const reconstructed = AccountAddress.fromBase58(base58);

      // THEN
      expect(reconstructed.toBuffer()).toEqual(original);
    });
  });

  describe("address property", () => {
    it("should cache Base58 representation", () => {
      // GIVEN
      const buffer = Buffer.alloc(32, 0x99);
      const address = AccountAddress.fromBuffer(buffer);

      // WHEN/THEN
      expect(address.address).toBe(address.toBase58());
      expect(address.address.length).toBeGreaterThan(0);
      // Verify roundtrip correctness
      expect(AccountAddress.fromBase58(address.address).toBuffer()).toEqual(buffer);
    });
  });
});
