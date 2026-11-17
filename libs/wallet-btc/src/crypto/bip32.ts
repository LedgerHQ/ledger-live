import invariant from "invariant";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import type { BitcoinJS } from "coininfo";
import { getSecp256k1Instance } from "./secp256k1";

// the BIP32 class is inspired from https://github.com/bitcoinjs/bip32/blob/master/src/bip32.js
class BIP32 {
  publicKey: Buffer;
  chainCode: Buffer;
  network: BitcoinJS;
  depth: number;
  index: number;
  constructor(publicKey: Buffer, chainCode: Buffer, network: BitcoinJS, depth = 0, index = 0) {
    invariant(publicKey && publicKey.length > 0, "publicKey must not be empty");
    invariant(chainCode && chainCode.length > 0, "chainCode must not be empty");
    this.publicKey = publicKey;
    this.chainCode = chainCode;
    this.network = network;
    this.depth = depth;
    this.index = index;
  }
  async derive(index: number): Promise<BIP32> {
    const data = Buffer.allocUnsafe(37);
    this.publicKey.copy(data, 0);
    data.writeUInt32BE(index, 33);
    const I = Buffer.from(hmac(sha512, this.chainCode, data));
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    const Ki = Buffer.from(await getSecp256k1Instance().publicKeyTweakAdd(this.publicKey, IL));
    return new BIP32(Ki, IR, this.network, this.depth + 1, index);
  }
}

export default BIP32;
