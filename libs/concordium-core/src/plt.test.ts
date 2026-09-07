import { AccountAddress } from "./address";
import { PLT_CBOR_MAX_SIZE } from "./cbor";
import {
  encodePltAddress,
  encodePltAmount,
  encodePltMemo,
  encodePltTransferOperations,
} from "./plt";

// The expected byte strings below were derived independently of this
// implementation, from the device and chain CBOR encoders, so they catch an
// encoder that is merely self-consistent.
const ZERO_ADDRESS = AccountAddress.fromBuffer(Buffer.alloc(32));
const SEQ_ADDRESS = AccountAddress.fromBuffer(Buffer.from(Array.from({ length: 32 }, (_, i) => i)));

const SEQ_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

describe("plt/encodePltAmount", () => {
  it("encodes a 6-decimal amount as tag 4 with a negative exponent", () => {
    expect(encodePltAmount(1_000_000n, 6).toString("hex")).toBe("c482251a000f4240");
  });

  it("encodes a zero amount with zero decimals", () => {
    expect(encodePltAmount(0n, 0).toString("hex")).toBe("c4820000");
  });

  it("encodes the maximum unsigned 64-bit significand", () => {
    expect(encodePltAmount(0xffffffffffffffffn, 6).toString("hex")).toBe(
      "c482251bffffffffffffffff",
    );
  });

  it.each([
    ["negative amount", -1n, 6],
    ["amount above the 64-bit range", 2n ** 64n, 6],
  ])("rejects a %s", (_label, amount, decimals) => {
    expect(() => encodePltAmount(amount, decimals)).toThrow();
  });

  it.each([-1, 129, 256, 1.5])("rejects decimals of %s", decimals => {
    expect(() => encodePltAmount(1n, decimals)).toThrow();
  });

  // The device holds the exponent in an int8_t and rejects a raw negative
  // argument above 127, capping decimals at 128 — tighter than the chain's 255.
  it("accepts 128 decimals, the device's ceiling", () => {
    expect(encodePltAmount(1n, 128).toString("hex")).toBe("c482387f01");
  });

  it("rejects 129 decimals, which the chain allows but the device does not", () => {
    expect(() => encodePltAmount(1n, 129)).toThrow(/0\.\.128/);
  });
});

describe("plt/encodePltAddress", () => {
  it("wraps the address in a tag 40307 map keyed on 3", () => {
    expect(encodePltAddress(SEQ_ADDRESS).toString("hex")).toBe(`d99d73a1035820${SEQ_HEX}`);
  });

  it("includes the coin info when asked, keyed on 1 and ordered before the data", () => {
    expect(encodePltAddress(SEQ_ADDRESS, true).toString("hex")).toBe(
      `d99d73a201d99d71a101190397035820${SEQ_HEX}`,
    );
  });

  it("costs 9 bytes more with coin info than without", () => {
    expect(encodePltAddress(SEQ_ADDRESS, true).length - encodePltAddress(SEQ_ADDRESS).length).toBe(
      9,
    );
  });

  // The device parses a bare byte string as an error, and so does the chain.
  // Guard the shape explicitly: a regression here is silent and expensive.
  it("never emits a bare byte string inside the tag", () => {
    const encoded = encodePltAddress(SEQ_ADDRESS);
    // d9 9d 73 = tag(40307); the next byte must open a map (major type 5).
    expect(encoded[3] & 0xe0).toBe(0xa0);
  });
});

describe("plt/encodePltMemo", () => {
  it("encodes a memo as a bare byte string by default", () => {
    expect(encodePltMemo(Buffer.from("Hello")).toString("hex")).toBe("4548656c6c6f");
  });

  it("wraps the memo in tag 24 when asked", () => {
    expect(encodePltMemo(Buffer.from("Hello"), true).toString("hex")).toBe("d8184548656c6c6f");
  });

  it("encodes an empty memo as a zero-length byte string", () => {
    expect(encodePltMemo(Buffer.alloc(0)).toString("hex")).toBe("40");
  });

  // The chain caps the memo independently of the CBOR budget: a 400-byte memo
  // fits the budget and still fails on chain.
  it("accepts a memo at the chain's 256-byte limit", () => {
    expect(() => encodePltMemo(Buffer.alloc(256))).not.toThrow();
  });

  it("rejects a memo above the chain's 256-byte limit", () => {
    expect(() => encodePltMemo(Buffer.alloc(257))).toThrow(/exceeding the chain limit/);
  });

  it("rejects an oversized memo through the transfer encoder too", () => {
    expect(() =>
      encodePltTransferOperations({
        recipient: SEQ_ADDRESS,
        amount: 1n,
        decimals: 6,
        memo: Buffer.alloc(400),
      }),
    ).toThrow(/exceeding the chain limit/);
  });
});

describe("plt/encodePltTransferOperations", () => {
  it("matches the reference encoding for a plain transfer", () => {
    const encoded = encodePltTransferOperations({
      recipient: ZERO_ADDRESS,
      amount: 1_000_000n,
      decimals: 6,
    });

    expect(encoded.toString("hex")).toBe(
      "81a1687472616e73666572a266616d6f756e74c482251a000f424069726563697069656e74d99d73a10358200000000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("matches the reference encoding with a memo", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 500_000n,
      decimals: 6,
      memo: Buffer.from("Hello"),
    });

    expect(encoded.toString("hex")).toBe(
      `81a1687472616e73666572a3646d656d6f4548656c6c6f66616d6f756e74c482251a0007a12069726563697069656e74d99d73a1035820${SEQ_HEX}`,
    );
  });

  it("matches the reference encoding with an empty memo", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 1_000_000n,
      decimals: 6,
      memo: Buffer.alloc(0),
    });

    expect(encoded.toString("hex")).toBe(
      `81a1687472616e73666572a3646d656d6f4066616d6f756e74c482251a000f424069726563697069656e74d99d73a1035820${SEQ_HEX}`,
    );
  });

  it("matches the reference encoding with coin info", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 1_000_000n,
      decimals: 6,
      includeCoinInfo: true,
    });

    expect(encoded.toString("hex")).toBe(
      `81a1687472616e73666572a266616d6f756e74c482251a000f424069726563697069656e74d99d73a201d99d71a101190397035820${SEQ_HEX}`,
    );
  });

  // Key order is bytewise on the encoded key, so the length in the head byte
  // dominates: "memo" (0x64) then "amount" (0x66) then "recipient" (0x69).
  it("orders the operation fields deterministically, memo first", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 1n,
      decimals: 6,
      memo: Buffer.from("x"),
    }).toString("hex");

    expect(encoded.indexOf("646d656d6f")).toBeLessThan(encoded.indexOf("66616d6f756e74"));
    expect(encoded.indexOf("66616d6f756e74")).toBeLessThan(encoded.indexOf("69726563697069656e74"));
  });

  it("wraps exactly one operation in the outer array", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 1n,
      decimals: 6,
    });

    // 0x81 = array of length 1. The device rejects a second element with 0x6B10.
    expect(encoded[0]).toBe(0x81);
  });

  it("produces identical bytes across runs", () => {
    const build = () =>
      encodePltTransferOperations({
        recipient: SEQ_ADDRESS,
        amount: 42n,
        decimals: 2,
        memo: Buffer.from("determinism"),
      });

    expect(build().toString("hex")).toBe(build().toString("hex"));
  });

  // With the memo capped at 256 the blob cannot reach 512 through this encoder,
  // so the budget guard inside it is a backstop for future operation types
  // rather than a reachable path. The reachable check is in serializeTokenUpdate,
  // which takes the blob as opaque bytes.
  it("stays well inside the device CBOR budget at the worst case", () => {
    const encoded = encodePltTransferOperations({
      recipient: SEQ_ADDRESS,
      amount: 1_000_000n,
      decimals: 6,
      memo: Buffer.alloc(256),
      includeCoinInfo: true,
    });

    expect(encoded.length).toBeLessThanOrEqual(PLT_CBOR_MAX_SIZE);
  });
});
