import { encodeMemoToCbor } from "@ledgerhq/concordium-core";
import { decodeMemo, decodePltMemo } from "./memo";

const TX_HASH = "453339293270cc4d1929cec86841867c45c65d35c9fe9b779ee4bba53669001a";

const cbor = (text: string) => encodeMemoToCbor(text).toString("hex");
const raw = (text: string) => Buffer.from(text, "utf8").toString("hex");

describe("decodePltMemo", () => {
  it("decodes the CBOR text string the wallet writes", () => {
    expect(decodePltMemo(cbor("send with memo"), TX_HASH)).toBe("send with memo");
  });

  it("decodes multi-byte characters", () => {
    expect(decodePltMemo(cbor("réservé 🇫🇷"), TX_HASH)).toBe("réservé 🇫🇷");
  });

  // Captured from the proxy for the transaction above, sent before the wallet
  // encoded its content.
  it("falls back to raw text for a memo written before the change", () => {
    expect(decodePltMemo("73656e642077697468206d656d6f", TX_HASH)).toBe("send with memo");
  });

  // Strictness is what makes the fallback reachable: without the whole-buffer
  // check, "abc" would decode as a one-character text string holding "b".
  it("falls back rather than truncating raw text", () => {
    expect(decodePltMemo(raw("abc"), TX_HASH)).toBe("abc");
  });

  // Each of these is also a valid CBOR negative integer, and a single-digit
  // payment reference is the most ordinary memo there is.
  it.each([
    ["0", "0"],
    ["1", "1"],
    ["2", "2"],
    ["7", "7"],
    ["8", "8"],
    ["9", "9"],
  ])("reads the raw digit %p as itself, not as an integer", (text, expected) => {
    expect(decodePltMemo(raw(text), TX_HASH)).toBe(expected);
  });

  it.each([
    ["an invoice number", "INV-0042"],
    ["a bare reference", "42"],
    ["an order id", "10293847"],
  ])("preserves %s written as raw text", (_label, text) => {
    expect(decodePltMemo(raw(text), TX_HASH)).toBe(text);
  });

  // The price of the digits above, pinned so nobody reads "integers are
  // excluded" as "integer memos are suppressed".
  it.each([
    ["31", "1", "CBOR -18"],
    ["3863", "8c", "CBOR -100"],
    ["20", " ", "CBOR -1"],
  ])("renders %p as %p, not as %s", (hex, expected, _asInteger) => {
    expect(decodePltMemo(hex, TX_HASH)).toBe(expected);
  });

  // Unsigned integers do vanish, but incidentally: their head bytes are control
  // characters, which the printable check rejects.
  it.each([
    ["1864", "100"],
    ["0c", "12"],
  ])("drops %p, which would have been %s, on the printable check", (hex, _asInteger) => {
    expect(decodePltMemo(hex, TX_HASH)).toBeUndefined();
  });

  // The one class strictness cannot separate. Asserted so the limit stays
  // visible rather than being rediscovered as a bug.
  it.each([
    ["ab", "b"],
    ["bye", "ye"],
    ["cash", "ash"],
  ])("reads raw %p as CBOR, which it also validly is", (text, asCbor) => {
    expect(decodePltMemo(raw(text), TX_HASH)).toBe(asCbor);
  });

  // CIS-7 places no encoding on the bytes, so a binary memo is legal. Nothing
  // from the `Other` category belongs on screen: a bidi override reorders the
  // text around it, and a zero-width character is invisible.
  it.each([
    ["bytes that are not valid UTF-8", "fffefd"],
    ["a C0 control character", raw("a\u0000b")],
    ["a right-to-left override", raw("a\u202eb")],
    ["a zero-width space", raw("a\u200bb")],
  ])("returns undefined for %s", (_label, hex) => {
    expect(decodePltMemo(hex, TX_HASH)).toBeUndefined();
  });

  // U+FFFD is `\p{So}`, so the printable guard passes it and the decoder has to
  // reject the bytes instead. This is the bare `fffefd` case above with a
  // text-string header on it, which routes it to the CBOR branch.
  it("returns undefined for invalid UTF-8 inside a CBOR text string", () => {
    expect(decodePltMemo("63fffefd", TX_HASH)).toBeUndefined();
  });

  // These reach the CBOR branch, not the fallback, which is where the guard was
  // missing. "salary\u202e drowssap" renders as "salary password".
  it.each([
    ["a right-to-left override", "salary\u202e drowssap"],
    ["a zero-width space", "a\u200bb"],
    ["a C0 control character", "a\u0000b"],
  ])("returns undefined for %s inside a CBOR text string", (_label, text) => {
    expect(decodePltMemo(cbor(text), TX_HASH)).toBeUndefined();
  });

  it("returns undefined for an empty hex string", () => {
    expect(decodePltMemo("", TX_HASH)).toBeUndefined();
  });

  // Node truncates rather than throwing, so malformed hex would otherwise
  // decode to a shortened memo that is itself valid UTF-8.
  it.each([
    ["a character outside the alphabet", "6162zz63"],
    ["an odd number of nibbles", "616"],
    ["embedded whitespace", "61 62"],
  ])("returns undefined for %s", (_label, hex) => {
    expect(decodePltMemo(hex, TX_HASH)).toBeUndefined();
  });
});

describe("decodeMemo", () => {
  it("decodes a native CBOR memo", () => {
    expect(decodeMemo(cbor("send with memo"), TX_HASH)).toBe("send with memo");
  });

  // The device's CCD screen displays integers as well as text, so the wallet
  // reads what a user could have approved.
  it("decodes an integer memo", () => {
    expect(decodeMemo("1864", TX_HASH)).toBe("100");
  });

  it("returns undefined when the CBOR is malformed", () => {
    expect(decodeMemo("78", TX_HASH)).toBeUndefined();
  });

  // Unlike the PLT path there is no fallback, so raw bytes with trailing data
  // are dropped rather than read as a prefix.
  it("returns undefined for trailing bytes", () => {
    expect(decodeMemo(raw("abc"), TX_HASH)).toBeUndefined();
  });

  it("returns undefined for malformed hex", () => {
    expect(decodeMemo("6e73656e64zz", TX_HASH)).toBeUndefined();
  });

  it("returns undefined for invalid UTF-8 inside a CBOR text string", () => {
    expect(decodeMemo("63fffefd", TX_HASH)).toBeUndefined();
  });

  // The CCD path has no raw fallback, so what the decoder returns is its only
  // sender-controlled text.
  it.each([
    ["a right-to-left override", "salary\u202e drowssap"],
    ["a zero-width space", "a\u200bb"],
  ])("returns undefined for %s", (_label, text) => {
    expect(decodeMemo(cbor(text), TX_HASH)).toBeUndefined();
  });

  it("keeps an emoji, which is not a control character", () => {
    expect(decodeMemo(cbor("réservé 🇫🇷"), TX_HASH)).toBe("réservé 🇫🇷");
  });
});
