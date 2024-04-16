import invariant from "invariant";
import createHmac from "create-hmac";
import { getSecp256k1Instance } from "./secp256k1";

// the BIP32 class is inspired from https://github.com/bitcoinjs/bip32/blob/master/src/bip32.js
class BIP32 {
  publicKey: Buffer;
  chainCode: Buffer;
  network: any;
  depth: number;
  index: number;
  constructor(
    publicKey: Buffer,
    chainCode: Buffer,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    network: any,
    depth = 0,
    index = 0,
  ) {
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
    const I = createHmac("sha512", this.chainCode).update(data).digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    const Ki = Buffer.from(await getSecp256k1Instance().publicKeyTweakAdd(this.publicKey, IL));
    return new BIP32(Ki, IR, this.network, this.depth + 1, index);
  }
}

export default BIP32;
