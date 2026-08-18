import { deriveAddressFromPubkey, derivePrincipalFromPubkey, pubkeyToDer } from "./crypto";

// Deterministic secp256k1 public key (raw, uncompressed) derived from the fixed
// secret key bytes [1..32], and the values it maps to.
const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const EXPECTED_PRINCIPAL = "qmja6-ma7bq-kxeep-f3lpi-bmu4n-aefcl-xpc5o-iqbsi-5wi5u-b37vi-wae";
const EXPECTED_ADDRESS = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";
const EXPECTED_DER =
  "3056301006072a8648ce3d020106052b8104000a0342000484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";

describe("crypto derivations", () => {
  it("derives the self-authenticating principal from a public key", () => {
    expect(derivePrincipalFromPubkey(XPUB).toText()).toBe(EXPECTED_PRINCIPAL);
  });

  it("derives the account identifier from a public key", () => {
    expect(deriveAddressFromPubkey(XPUB)).toBe(EXPECTED_ADDRESS);
  });

  it("DER-encodes the public key", () => {
    expect(Buffer.from(new Uint8Array(pubkeyToDer(XPUB))).toString("hex")).toBe(EXPECTED_DER);
  });
});
