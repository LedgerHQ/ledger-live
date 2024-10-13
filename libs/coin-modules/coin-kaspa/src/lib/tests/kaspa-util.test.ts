import { addressToPublicKey, addressToScriptPublicKey, publicKeyToAddress } from "../kaspa-util";

describe("addressToPublicKey", () => {
  it("should be able to round-trip", () => {
    const testAddr = "kaspa:qqs7krzzwqfgk9kf830smtzg64s9rf3r0khfj76cjynf2pfgrr35saatu88xq";
    const pubkey = addressToPublicKey(testAddr);
    const roundtripPublicKey = publicKeyToAddress(Buffer.from(pubkey.publicKey), false);

    expect(roundtripPublicKey).toBe(testAddr);
  });

  it("should be able to convert a schnorr-based address to a public key", () => {
    const expectedPublicKey = Buffer.from(
      "21eb0c4270128b16c93c5f0dac48d56051a6237dae997b58912695052818e348",
      "hex",
    );
    const expectedVersion = 0;
    const address = "kaspa:qqs7krzzwqfgk9kf830smtzg64s9rf3r0khfj76cjynf2pfgrr35saatu88xq";

    const result = addressToPublicKey(address);
    expect(Buffer.from(result.publicKey)).toStrictEqual(expectedPublicKey);
    expect(result.version).toBe(expectedVersion);
  });

  it("should be able to convert a p2sh address to a public key", () => {
    const expectedPublicKey = Buffer.from(
      "f38031f61ca23d70844f63a477d07f0b2c2decab907c2e096e548b0e08721c79",
      "hex",
    );
    const expectedVersion = 8;
    const address = "kaspa:precqv0krj3r6uyyfa36ga7s0u9jct0v4wg8ctsfde2gkrsgwgw8jgxfzfc98";

    const result = addressToPublicKey(address);
    expect(Buffer.from(result.publicKey)).toStrictEqual(expectedPublicKey);
    expect(result.version).toBe(expectedVersion);
  });

  it("should be able to convert a ECDSA-based address to a public key", () => {
    const expectedPublicKey = Buffer.from(
      "02d5fdc7ad11a65d0bbe7882fc3dbc91b5861d182dcce79f7c1be5bfd30a677cd6",
      "hex",
    );
    const expectedVersion = 1;
    const address = "kaspa:qypdtlw845g6vhgtheug9lpahjgmtpsarqkueeul0sd7t07npfnhe4s7fd82n0v";

    const result = addressToPublicKey(address);
    expect(Buffer.from(result.publicKey)).toStrictEqual(expectedPublicKey);
    expect(result.version).toBe(expectedVersion);
  });
});

describe("publicKeyToAddress", () => {
  it("should be able to convert to a schnorr-based address", () => {
    const expectedAddress = "kaspa:qqs7krzzwqfgk9kf830smtzg64s9rf3r0khfj76cjynf2pfgrr35saatu88xq";
    const publicKey = Buffer.from(
      "21eb0c4270128b16c93c5f0dac48d56051a6237dae997b58912695052818e348",
      "hex",
    );

    expect(publicKeyToAddress(publicKey)).toBe(expectedAddress);
    expect(publicKeyToAddress(publicKey, false)).toBe(expectedAddress);
    expect(publicKeyToAddress(publicKey, false, "schnorr")).toBe(expectedAddress);
  });

  it("should be able to convert to a schnorr-based address without prefix", () => {
    const expectedAddress = "qqs7krzzwqfgk9kf830smtzg64s9rf3r0khfj76cjynf2pfgrr35saatu88xq";
    const publicKey = Buffer.from(
      "21eb0c4270128b16c93c5f0dac48d56051a6237dae997b58912695052818e348",
      "hex",
    );

    expect(publicKeyToAddress(publicKey, true)).toBe(expectedAddress);
  });

  it("should be able to convert to a p2sh address", () => {
    const expectedAddress = "kaspa:precqv0krj3r6uyyfa36ga7s0u9jct0v4wg8ctsfde2gkrsgwgw8jgxfzfc98";
    const publicKey = Buffer.from(
      "f38031f61ca23d70844f63a477d07f0b2c2decab907c2e096e548b0e08721c79",
      "hex",
    );

    expect(publicKeyToAddress(publicKey, false, "p2sh")).toBe(expectedAddress);
  });

  it("should be able to convert to a ECDSA-based address", () => {
    const expectedAddress = "kaspa:qypdtlw845g6vhgtheug9lpahjgmtpsarqkueeul0sd7t07npfnhe4s7fd82n0v";
    const publicKey = Buffer.from(
      "02d5fdc7ad11a65d0bbe7882fc3dbc91b5861d182dcce79f7c1be5bfd30a677cd6",
      "hex",
    );

    expect(publicKeyToAddress(publicKey, false, "ecdsa")).toBe(expectedAddress);
  });
});

describe("addressToScriptPublicKey", () => {
  it("should be able to convert a schnorr address into script public key", () => {
    const expectedScriptPublicKey =
      "2021eb0c4270128b16c93c5f0dac48d56051a6237dae997b58912695052818e348ac";
    const address = "kaspa:qqs7krzzwqfgk9kf830smtzg64s9rf3r0khfj76cjynf2pfgrr35saatu88xq";

    const result = addressToScriptPublicKey(address);
    expect(result).toBe(expectedScriptPublicKey);
  });

  it("should be able to convert an ecdsa address into script public key", () => {
    const expectedScriptPublicKey =
      "2102d5fdc7ad11a65d0bbe7882fc3dbc91b5861d182dcce79f7c1be5bfd30a677cd6ab";
    const address = "kaspa:qypdtlw845g6vhgtheug9lpahjgmtpsarqkueeul0sd7t07npfnhe4s7fd82n0v";

    const result = addressToScriptPublicKey(address);
    expect(result).toBe(expectedScriptPublicKey);
  });

  it("should be able to convert a p2sh address into script public key", () => {
    const expectedScriptPublicKey =
      "aa20f38031f61ca23d70844f63a477d07f0b2c2decab907c2e096e548b0e08721c7987";
    const address = "kaspa:precqv0krj3r6uyyfa36ga7s0u9jct0v4wg8ctsfde2gkrsgwgw8jgxfzfc98";

    const result = addressToScriptPublicKey(address);
    expect(result).toBe(expectedScriptPublicKey);
  });
});
