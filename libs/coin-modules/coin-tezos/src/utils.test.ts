import { validatePublicKey, ValidationResult } from "@taquito/utils";
import {
  normalizePublicKeyForAddress,
  parseTezosTokenAsset,
  resolveTezosOperationMode,
} from "./utils";

describe("parseTezosTokenAsset", () => {
  it("returns null for native asset", () => {
    expect(parseTezosTokenAsset({ type: "native" })).toBeNull();
  });

  it("returns null when asset is undefined", () => {
    expect(parseTezosTokenAsset(undefined)).toBeNull();
  });

  it("parses KT1-only reference as token id 0", () => {
    expect(
      parseTezosTokenAsset({
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU",
      }),
    ).toEqual({
      contractAddress: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU",
      tokenId: 0,
    });
  });

  it("parses contract:tokenId reference", () => {
    expect(
      parseTezosTokenAsset({
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:42",
      }),
    ).toEqual({
      contractAddress: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU",
      tokenId: 42,
    });
  });

  it("returns null for invalid token id suffix", () => {
    expect(
      parseTezosTokenAsset({
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:abc",
      }),
    ).toBeNull();
  });

  it("returns null when reference does not start with KT1", () => {
    expect(parseTezosTokenAsset({ type: "token", assetReference: "not-a-contract" })).toBeNull();
  });
});

describe("resolveTezosOperationMode", () => {
  it("returns send_token for send intent with token asset", () => {
    expect(
      resolveTezosOperationMode("send", {
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:0",
      }),
    ).toBe("send_token");
  });

  it("returns send for send intent with native asset", () => {
    expect(resolveTezosOperationMode("send", { type: "native" })).toBe("send");
  });

  it("maps staking intents to real staking modes regardless of asset", () => {
    expect(
      resolveTezosOperationMode("stake", {
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:0",
      }),
    ).toBe("stake");

    expect(resolveTezosOperationMode("unstake", { type: "native" })).toBe("unstake");
    expect(resolveTezosOperationMode("finalize_unstake", { type: "native" })).toBe(
      "finalize_unstake",
    );
  });

  it("maps delegation intents to delegation modes", () => {
    expect(resolveTezosOperationMode("delegate", { type: "native" })).toBe("delegate");
    expect(resolveTezosOperationMode("undelegate", { type: "native" })).toBe("undelegate");
  });
});

describe("normalizePublicKeyForAddress", () => {
  it("should normalize hex public key for tz2 address (secp256k1) to base58 format", () => {
    const tz2Address = "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3";
    const hexPublicKey = "03576c19462a7d0cc3d121b1b00e92258b5f71d643c99a599fc1683f03abb7a1c2";
    const expectedPublicKey = "sppk7but7h93Ws1XhAPvdBcttVmoBDGHxdpaU8dPy5549f3eLJFAjag";

    // When: normalize the hex public key to base58 format
    const result = normalizePublicKeyForAddress(hexPublicKey, tz2Address);

    // Then: should return the correct base58 encoded public key
    expect(result).toBe(expectedPublicKey);
  });

  it("should normalize a 33-byte Ledger ED25519 payload (prefix byte + raw key) to a valid edpk", () => {
    const tz1Address = "tz1SVgE7L6xzEY2UpQ4UvtPkRDDMwSmcqVqr";
    const ledgerEd25519Hex = "02b053b74eab7e21c5a8fc1d945ee9fa6dbe2fedb6d47a43299ff33b7f28ea179b";

    const result = normalizePublicKeyForAddress(ledgerEd25519Hex, tz1Address);

    expect(result!.startsWith("edpk")).toBe(true);
    expect(validatePublicKey(result!)).toBe(ValidationResult.VALID);
  });

  it("should normalize a 32-byte raw ED25519 key to a valid edpk", () => {
    const tz1Address = "tz1SVgE7L6xzEY2UpQ4UvtPkRDDMwSmcqVqr";
    const rawEd25519Hex = "b053b74eab7e21c5a8fc1d945ee9fa6dbe2fedb6d47a43299ff33b7f28ea179b";

    const result = normalizePublicKeyForAddress(rawEd25519Hex, tz1Address);

    expect(result!.startsWith("edpk")).toBe(true);
    expect(validatePublicKey(result!)).toBe(ValidationResult.VALID);
  });

  it("should refuse to encode a malformed tz1 input (e.g. a non-hex b58 string parsed to 0 bytes)", () => {
    const tz1Address = "tz1SVgE7L6xzEY2UpQ4UvtPkRDDMwSmcqVqr";
    const garbage = "3s7xnj2xf2q7au3rrpg7j9k5zf3djfqgbtrswxf8d69vh94hfdtsbpni";

    const result = normalizePublicKeyForAddress(garbage, tz1Address);

    expect(result).toBeUndefined();
  });

  it("should refuse to encode a 65-byte SEC1 input for a tz1 (ED25519) address", () => {
    const tz1Address = "tz1SVgE7L6xzEY2UpQ4UvtPkRDDMwSmcqVqr";
    const sec1Hex = "04" + "ab".repeat(64); // 65 bytes

    const result = normalizePublicKeyForAddress(sec1Hex, tz1Address);

    expect(result).toBeUndefined();
  });
});
