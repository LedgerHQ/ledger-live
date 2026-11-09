import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toHex } from "@mysten/sui/utils";
import { suiPublicKeyMatchesAddress } from "./publicKey";

const keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(32).fill(7));
const PUBLIC_KEY = toHex(keypair.getPublicKey().toRawBytes());
const ADDRESS = keypair.toSuiAddress();

describe("suiPublicKeyMatchesAddress", () => {
  it("accepts the key that derives the address", () => {
    expect(suiPublicKeyMatchesAddress(PUBLIC_KEY, ADDRESS)).toBe(true);
  });

  it("compares addresses regardless of case", () => {
    expect(suiPublicKeyMatchesAddress(PUBLIC_KEY, ADDRESS.toUpperCase().replace("0X", "0x"))).toBe(
      true,
    );
  });

  it("rejects a key that derives another address", () => {
    const other = toHex(Ed25519Keypair.generate().getPublicKey().toRawBytes());
    expect(suiPublicKeyMatchesAddress(other, ADDRESS)).toBe(false);
  });

  it.each(["", "abcd", "zz".repeat(32), `${PUBLIC_KEY}00`])("rejects malformed key %p", key => {
    expect(suiPublicKeyMatchesAddress(key, ADDRESS)).toBe(false);
  });
});
