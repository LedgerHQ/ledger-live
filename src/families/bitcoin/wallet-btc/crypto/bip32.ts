import { publicKeyTweakAdd } from "secp256k1";
import createHmac from "create-hmac";

// the BIP32 class is inspired from https://github.com/bitcoinjs/bip32/blob/master/src/bip32.js
class BIP32 {
  publicKey: any;
  chainCode: any;
  network: any;
  depth: number;
  index: number;
  constructor(
    publicKey: any,
    chainCode: any,
    network: any,
    depth = 0,
    index = 0
  ) {
    this.publicKey = publicKey;
    this.chainCode = chainCode;
    this.network = network;
    this.depth = depth;
    this.index = index;
  }
  derive(index: number) {
    const data = Buffer.allocUnsafe(37);
    this.publicKey.copy(data, 0);
    data.writeUInt32BE(index, 33);
    const I = createHmac("sha512", this.chainCode).update(data).digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    const Ki = Buffer.from(publicKeyTweakAdd(this.publicKey, IL));
    return new BIP32(Ki, IR, this.network, this.depth + 1, index);
  }
}

export default BIP32;
