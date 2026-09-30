import { ContactDeviceIntentInputError } from "./errors";
import {
  mapBytesToGroupHandle,
  mapBytesToProof,
  mapChainIdForFamily,
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
  tryDecodeHex,
} from "./contactsKitMappers";

describe("tryDecodeHex", () => {
  it.each([
    ["a 0x-prefixed string, as mapBytesTo* emits it", "0xabc0"],
    ["an unprefixed string", "abc0"],
    ["an uppercase string", "0xABC0"],
    ["an uppercase prefix", "0XABC0"],
  ])("GIVEN %s WHEN decoding THEN it returns the bytes", (_label, value) => {
    expect(tryDecodeHex(value)).toEqual(new Uint8Array([0xab, 0xc0]));
  });

  it.each([
    ["a non-hex string", "not-hex"],
    ["an even-length non-hex string", "zzzz"],
    ["an odd-length string", "abc"],
    ["an odd-length string behind a prefix", "0xabc"],
    ["an empty string", ""],
    ["a bare prefix", "0x"],
  ])("GIVEN %s WHEN decoding THEN it returns null", (_label, value) => {
    expect(tryDecodeHex(value)).toBeNull();
  });

  it("GIVEN an odd-length string WHEN decoding THEN it rejects rather than left-padding", () => {
    // The kit's own hexaStringToBuffer would widen "0xabc" to 0x0abc, sending a
    // different handle to the device than the one that was stored.
    expect(tryDecodeHex("0xabc")).toBeNull();
  });

  it("GIVEN bytes WHEN round-tripping through mapBytesToProof THEN it returns the same bytes", () => {
    const bytes = new Uint8Array(32).fill(0xef);

    expect(tryDecodeHex(mapBytesToProof(bytes))).toEqual(bytes);
  });
});

describe("mapIdentifierToBytes", () => {
  it("GIVEN a valid hex EVM identifier WHEN mapping THEN it returns the decoded bytes", () => {
    // WHEN
    const result = mapIdentifierToBytes("0xabc0", "evm");

    // THEN
    expect(result).toEqual(new Uint8Array([0xab, 0xc0]));
  });

  it("GIVEN a non-hex EVM identifier WHEN mapping THEN it throws ContactDeviceIntentInputError", () => {
    // WHEN / THEN
    expect(() => mapIdentifierToBytes("not-hex", "evm")).toThrow(ContactDeviceIntentInputError);
  });

  it("GIVEN a base58 Tron address WHEN mapping THEN it returns the 21-byte 0x41-prefixed form", () => {
    // WHEN
    const result = mapIdentifierToBytes("TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U11", "tron");

    // THEN
    expect(result).toEqual(tryDecodeHex("0x41cdd04e1580f2ae3447aa7129a21aa57a92be6c14"));
  });

  it.each([
    ["a bad checksum", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U12"],
    ["a hex address", "0x41cdd04e1580f2ae3447aa7129a21aa57a92be6c14"],
    ["a non-base58 character", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U10"],
    ["an EVM address", "0xAbC0000000000000000000000000000000000001"],
    ["an empty string", ""],
  ])("GIVEN a Tron identifier with %s WHEN mapping THEN it throws", (_label, value) => {
    // WHEN / THEN
    expect(() => mapIdentifierToBytes(value, "tron")).toThrow(ContactDeviceIntentInputError);
  });
});

describe("mapChainIdForFamily", () => {
  it("GIVEN the EVM family WHEN mapping THEN it returns the chainId as a bigint", () => {
    expect(mapChainIdForFamily(137, "evm")).toBe(137n);
  });

  it("GIVEN the Tron family WHEN mapping THEN it omits the chainId", () => {
    // Tron's coin type must never reach the device: the signer provides without one.
    expect(mapChainIdForFamily(195, "tron")).toBeUndefined();
  });

  it("GIVEN the EVM family and a non-numeric chainId WHEN mapping THEN it throws", () => {
    expect(() => mapChainIdForFamily("nope", "evm")).toThrow(ContactDeviceIntentInputError);
  });
});

describe("mapChainIdToBigInt", () => {
  it("GIVEN a number chainId WHEN mapping THEN it returns a bigint", () => {
    // WHEN
    const result = mapChainIdToBigInt(1);

    // THEN
    expect(result).toBe(1n);
  });

  it("GIVEN a numeric string chainId WHEN mapping THEN it returns a bigint", () => {
    // WHEN
    const result = mapChainIdToBigInt("42");

    // THEN
    expect(result).toBe(42n);
  });

  it("GIVEN a non-numeric chainId WHEN mapping THEN it throws ContactDeviceIntentInputError", () => {
    // WHEN / THEN
    expect(() => mapChainIdToBigInt("not-a-number")).toThrow(ContactDeviceIntentInputError);
  });
});

describe("mapGroupHandleToBytes / mapBytesToGroupHandle", () => {
  it("GIVEN a valid hex group handle WHEN mapping to bytes and back THEN it round-trips", () => {
    // GIVEN
    const groupHandle = "0x0102";

    // WHEN
    const bytes = mapGroupHandleToBytes(groupHandle);
    const result = mapBytesToGroupHandle(bytes);

    // THEN
    expect(bytes).toEqual(new Uint8Array([0x01, 0x02]));
    expect(result).toBe(groupHandle);
  });

  it("GIVEN a non-hex group handle WHEN mapping THEN it throws ContactDeviceIntentInputError", () => {
    // WHEN / THEN
    expect(() => mapGroupHandleToBytes("not-hex")).toThrow(ContactDeviceIntentInputError);
  });

  it("GIVEN an odd-length group handle WHEN mapping THEN it throws instead of left-padding", () => {
    // WHEN / THEN
    expect(() => mapGroupHandleToBytes("0xabc")).toThrow(ContactDeviceIntentInputError);
  });
});

describe("mapProofToBytes / mapBytesToProof", () => {
  it("GIVEN a valid hex proof WHEN mapping to bytes and back THEN it round-trips", () => {
    // GIVEN
    const proof = "0x0304";

    // WHEN
    const bytes = mapProofToBytes(proof);
    const result = mapBytesToProof(bytes);

    // THEN
    expect(bytes).toEqual(new Uint8Array([0x03, 0x04]));
    expect(result).toBe(proof);
  });

  it("GIVEN a non-hex proof WHEN mapping THEN it throws ContactDeviceIntentInputError", () => {
    // WHEN / THEN
    expect(() => mapProofToBytes("not-hex")).toThrow(ContactDeviceIntentInputError);
  });

  it("GIVEN an odd-length proof WHEN mapping THEN it throws instead of left-padding", () => {
    // WHEN / THEN
    expect(() => mapProofToBytes("0xabc")).toThrow(ContactDeviceIntentInputError);
  });
});
