import { CLPublicKeyTag } from "casper-js-sdk";
import { casperAddressFromPubKey, isAddressValid } from "./bridge/bridgeHelpers/addresses";

describe("Casper addresses", () => {
  const pubKeys = {
    // valid
    validSecp256k1: "0203a17118ec0e64c4e4fdbdbee0ea14d118c9aaf08c6c81bbb776cae607ceb84ecb",
    validEd25519: "016470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b4c9806f844c94d401",
    validSecp256k1Checksum: "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB", // Checksummed
    validEd25519Checksum: "016470AE57b0a3aD5A679d2e0422909Bfb9dEd445e20cbE6B4c9806f844c94d401", // Checksummed
    // invalid
    invalidSecp256k1: "0203A17118ec0e64c4e4fdbdbee0ea14d118c9aaf08c6c81bbc776cae607ceb84ecb",
    invalidEd25519: "016470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b8c9806f844c94D401",
    invalidAddresstype: "036470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b8c9806f844c94d401", // Invalid address type
    invalidLength: "12345", // Invalid length
    invalidCharacter: "xyz123", // Contains non-hex characters
    invalidChecksum: "016470ae57b0a3ad5a679d2e0422909bfb9ded445e20cbe6b4c9806f844c94D400", // Invalid checksum
  };

  test("Check if valid addresses are valid", () => {
    expect(isAddressValid(pubKeys.validEd25519)).toBe(true);
    expect(isAddressValid(pubKeys.validSecp256k1)).toBe(true);
  });

  test("Check if invalid addresses are invalid", () => {
    expect(isAddressValid(pubKeys.invalidEd25519)).toBe(false);
    expect(isAddressValid(pubKeys.invalidSecp256k1)).toBe(false);
    expect(isAddressValid(pubKeys.invalidLength)).toBe(false);
    expect(isAddressValid(pubKeys.invalidCharacter)).toBe(false);
    expect(isAddressValid(pubKeys.invalidChecksum)).toBe(false);
  });

  test("Get the address from the publick key", () => {
    /**
     * Extracts the public key and key signature from a given Casper address.
     *
     * @param {string} address - The Casper address from which to extract the public key and key signature.
     * @returns {{ pubkey: Buffer, keySig: CLPublicKeyTag }} An object containing the public key as a Buffer and the key signature as a CLPublicKeyTag.
     */
    function casperPubKeyFromAddress(address: string): {
      pubkey: Buffer;
      keySig: CLPublicKeyTag;
    } {
      const keySig = parseInt(address.slice(0, 2), 10) as CLPublicKeyTag;
      const pubkeyHex = address.slice(2);
      const pubkey = Buffer.from(pubkeyHex, "hex");
      return { pubkey, keySig };
    }

    expect(
      casperAddressFromPubKey(
        casperPubKeyFromAddress(pubKeys.validSecp256k1).pubkey,
        CLPublicKeyTag.SECP256K1,
      ),
    ).toBe(pubKeys.validSecp256k1);
    expect(
      casperAddressFromPubKey(
        casperPubKeyFromAddress(pubKeys.validSecp256k1Checksum).pubkey,
        CLPublicKeyTag.SECP256K1,
      ),
    ).toBe(pubKeys.validSecp256k1Checksum.toLowerCase());
    expect(
      casperAddressFromPubKey(
        casperPubKeyFromAddress(pubKeys.validEd25519).pubkey,
        CLPublicKeyTag.ED25519,
      ),
    ).toBe(pubKeys.validEd25519);
    expect(
      casperAddressFromPubKey(
        casperPubKeyFromAddress(pubKeys.validEd25519Checksum).pubkey,
        CLPublicKeyTag.ED25519,
      ),
    ).toBe(pubKeys.validEd25519Checksum.toLowerCase());
  });
});
