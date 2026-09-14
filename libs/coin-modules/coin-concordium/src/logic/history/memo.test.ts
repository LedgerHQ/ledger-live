import { decodeMemo, decodePltMemo } from "./memo";

const TX_HASH = "453339293270cc4d1929cec86841867c45c65d35c9fe9b779ee4bba53669001a";

// Captured from the proxy for the transaction above, a PLT transfer carrying
// "send with memo". No CBOR header survives the proxy's unwrapping.
const PLT_MEMO_HEX = "73656e642077697468206d656d6f";

// The same text on a native transfer keeps its CBOR header (0x6e = text, 14).
const NATIVE_MEMO_HEX = "6e73656e642077697468206d656d6f";

describe("decodePltMemo", () => {
  it("decodes the unwrapped bytes the proxy reports", () => {
    expect(decodePltMemo(PLT_MEMO_HEX, TX_HASH)).toBe("send with memo");
  });

  // The regression this guards: the memo reached the chain, and the CBOR
  // decoder dropped it on the way back.
  it("reads a memo the CBOR decoder refuses", () => {
    expect(decodeMemo(PLT_MEMO_HEX, TX_HASH)).toBeUndefined();
    expect(decodePltMemo(PLT_MEMO_HEX, TX_HASH)).toBe("send with memo");
  });

  // A first byte that agrees with its own length is the dangerous case: CBOR
  // would decode it to a truncated string rather than failing.
  it("does not truncate a memo whose first byte reads as a CBOR header", () => {
    const hex = Buffer.from("ab", "utf8").toString("hex"); // 0x61 0x62

    expect(decodeMemo(hex, TX_HASH)).toBe("b");
    expect(decodePltMemo(hex, TX_HASH)).toBe("ab");
  });

  it("decodes multi-byte characters", () => {
    const hex = Buffer.from("réservé 🇫🇷", "utf8").toString("hex");

    expect(decodePltMemo(hex, TX_HASH)).toBe("réservé 🇫🇷");
  });

  // CIS-7 places no encoding on the bytes, so a binary memo is legal. Replacement
  // characters would be worse than no memo at all.
  it("returns undefined for bytes that are not valid UTF-8", () => {
    expect(decodePltMemo("fffefd", TX_HASH)).toBeUndefined();
  });

  it("returns undefined for an empty memo", () => {
    expect(decodePltMemo("", TX_HASH)).toBeUndefined();
  });

  // The round-trip check above cannot catch these: the bytes Node truncates to
  // are themselves valid UTF-8, so the memo would render shortened.
  it.each([
    ["a character outside the alphabet", "6162zz63"],
    ["an odd number of nibbles", "616"],
    ["embedded whitespace", "61 62"],
  ])("returns undefined for %s", (_label, hex) => {
    expect(decodePltMemo(hex, TX_HASH)).toBeUndefined();
  });
});

describe("decodeMemo", () => {
  it("still decodes a native CBOR memo", () => {
    expect(decodeMemo(NATIVE_MEMO_HEX, TX_HASH)).toBe("send with memo");
  });

  it("returns undefined when the CBOR is malformed", () => {
    expect(decodeMemo("78", TX_HASH)).toBeUndefined();
  });

  // The native path decodes the same way, so it truncated on malformed hex too.
  it("returns undefined for malformed hex", () => {
    expect(decodeMemo("6e73656e64zz", TX_HASH)).toBeUndefined();
  });
});
