import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha2";
import bs58 from "bs58";
import type { TronSigner } from "@ledgerhq/coin-tron/types/signer";

function deriveAddress(publicKeyUncompressed: Uint8Array): string {
  const addr20 = keccak_256(publicKeyUncompressed.slice(1)).slice(-20);
  const addr21 = Buffer.concat([Buffer.from([0x41]), addr20]);
  const checksum = sha256(sha256(addr21)).slice(0, 4);
  return bs58.encode(Buffer.concat([addr21, checksum]));
}

export function buildTronTestSignerFromPrivateKeyHex(privateKeyHex: string): {
  signer: TronSigner;
  address: string;
} {
  const priv = Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex"));
  const pub = secp256k1.getPublicKey(priv, false);
  const address = deriveAddress(pub);
  const publicKey = Buffer.from(pub).toString("hex");

  const signer: TronSigner = {
    async getAddress() {
      return { publicKey, address };
    },
    async sign(_path, rawTxHex, _tokenSignatures) {
      const sig = secp256k1.sign(sha256(Buffer.from(rawTxHex, "hex")), priv, { lowS: true });
      const out = new Uint8Array(65);
      out.set(sig.toCompactRawBytes(), 0);
      out[64] = sig.recovery ?? 0;
      return Buffer.from(out).toString("hex");
    },
  };

  return { signer, address };
}
