import { normalizePublicKeyForAddress } from "./utils";

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

