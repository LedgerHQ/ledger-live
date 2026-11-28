import { base58CheckPayload } from "./base58check";

/** The BIP84 account of the BIP39 test mnemonic. */
const XPUB =
  "xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V";

describe("base58CheckPayload", () => {
  it("reads the 78 bytes of an extended public key, its version first", () => {
    const payload = base58CheckPayload(XPUB);
    expect(payload?.length).toBe(78);
    expect([...(payload ?? []).slice(0, 4)]).toEqual([0x04, 0x88, 0xb2, 0x1e]);
  });

  it("rejects a key whose checksum does not match", () => {
    expect(base58CheckPayload(`${XPUB.slice(0, -1)}W`)).toBeUndefined();
  });

  it("rejects a character outside the alphabet", () => {
    expect(base58CheckPayload(`${XPUB.slice(0, -1)}0`)).toBeUndefined();
  });
});
