import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  convertLiveCredentialsToKeyPair,
  credentialForPubKey,
  liveAuthentication,
} from "../../utils";

describe("utils", () => {
  const memberCredentials = {
    pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
    privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
  };

  it("should convert live credentials to a key pair", () => {
    const keyPair = convertLiveCredentialsToKeyPair(memberCredentials);

    expect(crypto.to_hex(keyPair.publicKey)).toBe(memberCredentials.pubkey);
    expect(crypto.to_hex(keyPair.privateKey)).toBe(memberCredentials.privatekey);
  });

  it("should encode live authentication attestation", () => {
    expect(crypto.to_hex(liveAuthentication("ROOTID"))).toBe("0206524f4f544944");
  });

  it("should create a credential from a public key", () => {
    expect(credentialForPubKey(memberCredentials.pubkey)).toEqual({
      version: 0,
      curveId: 33,
      signAlgorithm: 1,
      publicKey: memberCredentials.pubkey,
    });
  });
});
