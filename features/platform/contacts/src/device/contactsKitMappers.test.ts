import { ContactDeviceIntentInputError } from "./errors";
import {
  mapBytesToGroupHandle,
  mapBytesToProof,
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
} from "./contactsKitMappers";

describe("mapIdentifierToBytes", () => {
  it("GIVEN a valid hex identifier WHEN mapping THEN it returns the decoded bytes", () => {
    // WHEN
    const result = mapIdentifierToBytes("0xabc0");

    // THEN
    expect(result).toEqual(new Uint8Array([0xab, 0xc0]));
  });

  it("GIVEN a non-hex identifier WHEN mapping THEN it throws ContactDeviceIntentInputError", () => {
    // WHEN / THEN
    expect(() => mapIdentifierToBytes("not-hex")).toThrow(ContactDeviceIntentInputError);
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
});
