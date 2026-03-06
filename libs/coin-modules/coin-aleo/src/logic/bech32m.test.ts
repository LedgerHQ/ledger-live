import { bech32m } from "./bech32m";

describe("bech32m", () => {
  describe("encode / decode round-trip", () => {
    it("should round-trip simple byte arrays", () => {
      const bytes = [0x00, 0x01, 0x02, 0x03, 0xff];
      const words = bech32m.toWords(bytes);
      const encoded = bech32m.encode("test", words);
      const decoded = bech32m.decode(encoded);
      const recovered = bech32m.fromWords(decoded.words);

      expect(decoded.prefix).toBe("test");
      expect(recovered).toEqual(bytes);
    });

    it("should round-trip with prefix 'aleo'", () => {
      const bytes = Array.from({ length: 32 }, (_, i) => i);
      const words = bech32m.toWords(bytes);
      const encoded = bech32m.encode("aleo", words, 200);
      const decoded = bech32m.decode(encoded, 200);

      expect(decoded.prefix).toBe("aleo");
      expect(bech32m.fromWords(decoded.words)).toEqual(bytes);
    });

    it("should produce lowercase output", () => {
      const words = bech32m.toWords([0xab, 0xcd]);
      const encoded = bech32m.encode("ABC", words);

      expect(encoded).toBe(encoded.toLowerCase());
    });

    it("should accept uppercase input in decode (normalises to lower)", () => {
      const words = bech32m.toWords([0x01]);
      const encoded = bech32m.encode("test", words).toUpperCase();
      const decoded = bech32m.decode(encoded);

      expect(decoded.prefix).toBe("test");
    });
  });

  describe("encode errors", () => {
    it("should throw when exceeding length limit", () => {
      const words = new Array(90).fill(0);

      expect(() => bech32m.encode("test", words)).toThrow("Exceeds length limit");
    });

    it("should throw for non-5-bit word", () => {
      expect(() => bech32m.encode("test", [32])).toThrow("Non 5-bit word");
    });

    it("should throw for invalid prefix characters (out of printable ASCII)", () => {
      expect(() => bech32m.encode("\x00bad", [0])).toThrow();
    });
  });

  describe("decode errors", () => {
    it("should throw for string that is too short", () => {
      expect(() => bech32m.decode("a1b2c3")).toThrow("too short");
    });

    it("should throw for mixed-case string", () => {
      expect(() => bech32m.decode("Test1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxw")).toThrow(
        /Mixed-case/,
      );
    });

    it("should throw when no separator character", () => {
      expect(() => bech32m.decode("abcdefgh")).toThrow("No separator character");
    });

    it("should throw for missing prefix (separator at position 0)", () => {
      expect(() => bech32m.decode("1abcdefgh")).toThrow("Missing prefix");
    });

    it("should throw for data too short after separator", () => {
      expect(() => bech32m.decode("prefix1abc")).toThrow("Data too short");
    });

    it("should throw for unknown character in data", () => {
      // 'b' is not in the bech32 alphabet
      expect(() => bech32m.decode("test1bbbbbbb")).toThrow("Unknown character");
    });

    it("should throw for invalid checksum", () => {
      const words = bech32m.toWords([0x01, 0x02]);
      const encoded = bech32m.encode("test", words);
      // corrupt last character
      const corrupted = encoded.slice(0, -1) + (encoded.endsWith("q") ? "p" : "q");

      expect(() => bech32m.decode(corrupted)).toThrow("Invalid checksum");
    });

    it("should throw when exceeding length limit in decode", () => {
      const words = bech32m.toWords([0x01]);
      const encoded = bech32m.encode("test", words);

      expect(() => bech32m.decode(encoded, 5)).toThrow("Exceeds length limit");
    });
  });

  describe("decodeUnsafe", () => {
    it("should return result for valid input", () => {
      const words = bech32m.toWords([0x01, 0x02]);
      const encoded = bech32m.encode("test", words);
      const result = bech32m.decodeUnsafe(encoded);

      expect(result).toHaveProperty("prefix", "test");
    });

    it("should return undefined for invalid input instead of throwing", () => {
      expect(bech32m.decodeUnsafe("invalid")).toBeUndefined();
    });
  });

  describe("fromWords / fromWordsUnsafe", () => {
    it("fromWordsUnsafe should return undefined for invalid word padding", () => {
      const words = [0x1f, 0x1f, 0x1f];
      const result = bech32m.fromWordsUnsafe(words);

      expect(result).toBeUndefined();
    });

    it("fromWords should throw on non-zero padding", () => {
      // 3 five-bit words = 15 bits; 1 byte = 8 bits, remainder 7 bits
      // if padding bits are non-zero it should fail
      expect(() => bech32m.fromWords([0x1f, 0x1f, 0x1f])).toThrow();
    });

    it("fromWords should succeed for valid words", () => {
      const original = [0xde, 0xad, 0xbe, 0xef];
      const words = bech32m.toWords(original);

      expect(bech32m.fromWords(words)).toEqual(original);
    });
  });

  describe("BIP350 known test vectors", () => {
    // From https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#test-vectors
    const validVectors = [
      "a1lqfn3a",
      "an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6",
      "abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx",
      "11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8",
      "split1checkupstagehandshakeupstreamerranterredcaperredlc445v",
      "?1v759aa",
    ];

    it.each(validVectors)("should decode valid bech32m vector: %s", str => {
      const decoded = bech32m.decode(str, 200);

      expect(decoded).toHaveProperty("prefix");
      expect(decoded).toHaveProperty("words");
    });
  });
});
