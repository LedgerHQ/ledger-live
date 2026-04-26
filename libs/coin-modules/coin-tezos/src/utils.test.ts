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

  it("returns stake for stake intent regardless of asset", () => {
    expect(
      resolveTezosOperationMode("stake", {
        type: "token",
        assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:0",
      }),
    ).toBe("stake");
  });

  it("returns unstake for unstake intent", () => {
    expect(resolveTezosOperationMode("unstake", { type: "native" })).toBe("unstake");
  });

  it("returns finalize_unstake for finalize_unstake intent", () => {
    expect(resolveTezosOperationMode("finalize_unstake", { type: "native" })).toBe(
      "finalize_unstake",
    );
  });

  it("returns delegate for delegate intent", () => {
    expect(resolveTezosOperationMode("delegate", { type: "native" })).toBe("delegate");
  });

  it("returns undelegate for undelegate intent", () => {
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
});
