import {
  deriveChildPublicKey,
  getXpubComponents,
  pathStringToArray,
  pathArrayToString,
  bip32asBuffer,
  pathElementsToBuffer,
  pubkeyFromXpub,
  hardenedPathOf,
} from "../src/bip32";

describe("bip32 utilities", () => {
  describe("deriveChildPublicKey", () => {
    // Test vectors from BIP32 test vectors
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
    const testXpub =
      "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";

    describe("input validation", () => {
      test("throws error for hardened derivation", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        expect(() => deriveChildPublicKey(pubkey, chaincode, 0x80000000)).toThrow(
          "Cannot derive hardened child from public key",
        );
      });

      test("throws error for hardened derivation at boundary", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        // Test exactly at the hardened boundary
        expect(() => deriveChildPublicKey(pubkey, chaincode, 0x80000000)).toThrow(
          "Cannot derive hardened child from public key",
        );
        // Test above the boundary
        expect(() => deriveChildPublicKey(pubkey, chaincode, 0x80000001)).toThrow(
          "Cannot derive hardened child from public key",
        );
        // Test at max uint32 (hardened)
        expect(() => deriveChildPublicKey(pubkey, chaincode, 0xffffffff)).toThrow(
          "Cannot derive hardened child from public key",
        );
      });

      test("throws error for invalid pubkey length (too short)", () => {
        const { chaincode } = getXpubComponents(testXpub);
        const invalidPubkey = Buffer.alloc(32); // Should be 33 bytes
        expect(() => deriveChildPublicKey(invalidPubkey, chaincode, 0)).toThrow(
          "Invalid parent pubkey length: expected 33 bytes, got 32",
        );
      });

      test("throws error for invalid pubkey length (too long)", () => {
        const { chaincode } = getXpubComponents(testXpub);
        const invalidPubkey = Buffer.alloc(65); // Uncompressed key size
        expect(() => deriveChildPublicKey(invalidPubkey, chaincode, 0)).toThrow(
          "Invalid parent pubkey length: expected 33 bytes, got 65",
        );
      });

      test("throws error for empty pubkey", () => {
        const { chaincode } = getXpubComponents(testXpub);
        const emptyPubkey = Buffer.alloc(0);
        expect(() => deriveChildPublicKey(emptyPubkey, chaincode, 0)).toThrow(
          "Invalid parent pubkey length: expected 33 bytes, got 0",
        );
      });

      test("throws error for invalid chaincode length (too short)", () => {
        const { pubkey } = getXpubComponents(testXpub);
        const invalidChaincode = Buffer.alloc(16); // Should be 32 bytes
        expect(() => deriveChildPublicKey(pubkey, invalidChaincode, 0)).toThrow(
          "Invalid parent chaincode length: expected 32 bytes, got 16",
        );
      });

      test("throws error for invalid chaincode length (too long)", () => {
        const { pubkey } = getXpubComponents(testXpub);
        const invalidChaincode = Buffer.alloc(64); // Should be 32 bytes
        expect(() => deriveChildPublicKey(pubkey, invalidChaincode, 0)).toThrow(
          "Invalid parent chaincode length: expected 32 bytes, got 64",
        );
      });

      test("throws error for empty chaincode", () => {
        const { pubkey } = getXpubComponents(testXpub);
        const emptyChaincode = Buffer.alloc(0);
        expect(() => deriveChildPublicKey(pubkey, emptyChaincode, 0)).toThrow(
          "Invalid parent chaincode length: expected 32 bytes, got 0",
        );
      });

      test("throws error for negative index", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        expect(() => deriveChildPublicKey(pubkey, chaincode, -1)).toThrow(
          "Invalid index: must be a non-negative integer, got -1",
        );
      });

      test("throws error for non-integer index", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        expect(() => deriveChildPublicKey(pubkey, chaincode, 1.5)).toThrow(
          "Invalid index: must be a non-negative integer, got 1.5",
        );
      });

      test("throws error for NaN index", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        expect(() => deriveChildPublicKey(pubkey, chaincode, NaN)).toThrow(
          "Invalid index: must be a non-negative integer, got NaN",
        );
      });

      test("throws error for Infinity index", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        expect(() => deriveChildPublicKey(pubkey, chaincode, Infinity)).toThrow(
          "Invalid index: must be a non-negative integer, got Infinity",
        );
      });
    });

    describe("derivation", () => {
      const vector1M0HXpub =
        "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw";
      const vector1M0H1Xpub =
        "xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ";

      test("derives non-hardened child correctly", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);

        // Derive child at index 0
        const child0 = deriveChildPublicKey(pubkey, chaincode, 0);

        // Should return a valid compressed public key (33 bytes starting with 02 or 03)
        expect(child0.pubkey.length).toBe(33);
        expect([0x02, 0x03]).toContain(child0.pubkey[0]);

        // Should return a valid chaincode (32 bytes)
        expect(child0.chaincode.length).toBe(32);

        // Different indices should produce different results
        const child1 = deriveChildPublicKey(pubkey, chaincode, 1);
        expect(child0.pubkey.equals(child1.pubkey)).toBe(false);
        expect(child0.chaincode.equals(child1.chaincode)).toBe(false);
      });

      test("derives at index 0 (boundary)", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        const child = deriveChildPublicKey(pubkey, chaincode, 0);
        expect(child.pubkey.length).toBe(33);
        expect(child.chaincode.length).toBe(32);
      });

      test("derives at max non-hardened index (boundary)", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);
        // Max non-hardened index is 0x7FFFFFFF (2147483647)
        const child = deriveChildPublicKey(pubkey, chaincode, 0x7fffffff);
        expect(child.pubkey.length).toBe(33);
        expect(child.chaincode.length).toBe(32);
      });

      test("produces deterministic results", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);

        // Multiple derivations with same inputs should produce identical outputs
        const child1 = deriveChildPublicKey(pubkey, chaincode, 5);
        const child2 = deriveChildPublicKey(pubkey, chaincode, 5);
        const child3 = deriveChildPublicKey(pubkey, chaincode, 5);

        expect(child1.pubkey.equals(child2.pubkey)).toBe(true);
        expect(child2.pubkey.equals(child3.pubkey)).toBe(true);
        expect(child1.chaincode.equals(child2.chaincode)).toBe(true);
        expect(child2.chaincode.equals(child3.chaincode)).toBe(true);
      });

      test("chain derivation works correctly (multiple levels)", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);

        // Derive m/0/0 (external chain, first address)
        const external = deriveChildPublicKey(pubkey, chaincode, 0);
        const address0 = deriveChildPublicKey(external.pubkey, external.chaincode, 0);

        expect(address0.pubkey.length).toBe(33);
        expect([0x02, 0x03]).toContain(address0.pubkey[0]);

        // Derive m/1/0 (internal/change chain, first address)
        const internal = deriveChildPublicKey(pubkey, chaincode, 1);
        const change0 = deriveChildPublicKey(internal.pubkey, internal.chaincode, 0);

        expect(change0.pubkey.length).toBe(33);
        expect([0x02, 0x03]).toContain(change0.pubkey[0]);

        // External and internal addresses should be different
        expect(address0.pubkey.equals(change0.pubkey)).toBe(false);
      });

      test("derives different keys for consecutive indices", () => {
        const { pubkey, chaincode } = getXpubComponents(testXpub);

        const children: Array<{ pubkey: Buffer; chaincode: Buffer }> = [];
        for (let i = 0; i < 10; i++) {
          children.push(deriveChildPublicKey(pubkey, chaincode, i));
        }

        // All derived keys should be unique
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            expect(children[i].pubkey.equals(children[j].pubkey)).toBe(false);
            expect(children[i].chaincode.equals(children[j].chaincode)).toBe(false);
          }
        }
      });

      test("matches BIP32 test vector 1 for m/0'/1", () => {
        const { pubkey: parentPubkey, chaincode: parentChaincode } =
          getXpubComponents(vector1M0HXpub);
        const expected = getXpubComponents(vector1M0H1Xpub);

        const actual = deriveChildPublicKey(parentPubkey, parentChaincode, 1);

        expect(actual.pubkey.equals(expected.pubkey)).toBe(true);
        expect(actual.chaincode.equals(expected.chaincode)).toBe(true);
      });
    });
  });

  describe("getXpubComponents", () => {
    test("extracts correct components from xpub", () => {
      const testXpub =
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
      const { pubkey, chaincode, version } = getXpubComponents(testXpub);

      expect(pubkey.length).toBe(33);
      expect(chaincode.length).toBe(32);
      expect(version).toBe(0x0488b21e); // mainnet xpub version
    });

    test("extracts correct components from tpub", () => {
      const testTpub =
        "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
      const { pubkey, chaincode, version } = getXpubComponents(testTpub);

      expect(pubkey.length).toBe(33);
      expect(chaincode.length).toBe(32);
      expect(version).toBe(0x043587cf); // testnet tpub version
    });
  });

  describe("pubkeyFromXpub", () => {
    test("extracts pubkey from xpub", () => {
      const testXpub =
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
      const pubkey = pubkeyFromXpub(testXpub);

      expect(pubkey.length).toBe(33);
      expect([0x02, 0x03]).toContain(pubkey[0]);
    });
  });

  describe("pathStringToArray", () => {
    test("converts path string to array", () => {
      expect(pathStringToArray("m/44'/0'/0'/0/0")).toEqual([
        0x8000002c, 0x80000000, 0x80000000, 0, 0,
      ]);
      expect(pathStringToArray("m/84'/0'/0'/0/5")).toEqual([
        0x80000054, 0x80000000, 0x80000000, 0, 5,
      ]);
    });
  });

  describe("pathArrayToString", () => {
    test("converts path array to string", () => {
      expect(pathArrayToString([0x8000002c, 0x80000000, 0x80000000, 0, 0])).toBe("m/44'/0'/0'/0/0");
    });
  });

  describe("pathElementsToBuffer", () => {
    test("creates correct buffer from path elements", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const buffer = pathElementsToBuffer(path);

      expect(buffer.length).toBe(1 + 5 * 4); // 1 byte length + 5 elements * 4 bytes
      expect(buffer[0]).toBe(5); // path length
    });
  });

  describe("bip32asBuffer", () => {
    test("converts path string to buffer", () => {
      const buffer = bip32asBuffer("m/84'/0'/0'/0/0");

      expect(buffer.length).toBe(1 + 5 * 4);
      expect(buffer[0]).toBe(5);
    });

    test("handles empty path", () => {
      const buffer = bip32asBuffer("");

      expect(buffer.length).toBe(1);
      expect(buffer[0]).toBe(0);
    });
  });

  describe("hardenedPathOf", () => {
    test("returns hardened prefix of path", () => {
      expect(hardenedPathOf([0x8000002c, 0x80000000, 0x80000000, 0, 0])).toEqual([
        0x8000002c, 0x80000000, 0x80000000,
      ]);
    });

    test("returns empty array for non-hardened path", () => {
      expect(hardenedPathOf([0, 1, 2])).toEqual([]);
    });

    test("returns full path if all elements are hardened", () => {
      expect(hardenedPathOf([0x8000002c, 0x80000000, 0x80000000])).toEqual([
        0x8000002c, 0x80000000, 0x80000000,
      ]);
    });
  });
});
