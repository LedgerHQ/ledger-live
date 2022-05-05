import Base from "./base";
import { InvalidAddress } from "@ledgerhq/errors";
import * as bjs from "bitcoinjs-lib";
import bs58checkBase from "bs58check/base";
import bs58check from "bs58check";
import createBlakeHash from "blake-hash";
import RIPEMD160 from "ripemd160";
import bs58 from "bs58";
import BIP32 from "./bip32";

class Decred extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
  static blake256(buffer: Buffer): Buffer {
    let b = buffer;
    if (buffer instanceof Uint8Array) {
      b = Buffer.from(buffer);
    }
    return createBlakeHash("blake256").update(b).digest();
  }

  // refer to decred spec https://devdocs.decred.org/developer-guides/addresses/
  static getAddressFromPk(publicKey: Buffer): string {
    const prefix = Buffer.from("073f", "hex");
    const pkhash = Buffer.concat([
      prefix,
      new RIPEMD160().update(Decred.blake256(publicKey)).digest(),
    ]);
    const checksum = Decred._blake256x2(pkhash).slice(0, 4);
    return bs58.encode(Buffer.concat([pkhash, checksum]));
  }

  static readonly _blake256x2 = (buffer: Buffer): Buffer =>
    Decred.blake256(Decred.blake256(buffer));
  static readonly bs58check = bs58checkBase(Decred._blake256x2);
  toOutputScript(address: string): Buffer {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    const decodeBase58 = Decred.bs58check.decode(address, Decred._blake256x2);
    const prefix = address.toLocaleUpperCase().substring(0, 2);
    if (prefix === "DC") {
      return bjs.payments.p2sh({ hash: decodeBase58.slice(2) })
        .output as Buffer;
    } else if (prefix === "DE" || prefix === "DS") {
      return bjs.payments.p2pkh({ hash: decodeBase58.slice(2) })
        .output as Buffer;
    }
    throw new InvalidAddress();
  }

  // eslint-disable-next-line class-methods-use-this
  validateAddress(address: string): boolean {
    if (address.length < 25 || address.length > 36) {
      return false;
    }
    try {
      Decred.bs58check.decode(address, Decred._blake256x2);
    } catch (error) {
      return false;
    }
    return true;
  }

  // get address given an address type
  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    let buffer: Buffer;
    try {
      buffer = Decred.bs58check.decode(xpub);
    } catch {
      buffer = bs58check.decode(xpub);
    }
    const depth = buffer[4];
    const i = buffer.readUInt32BE(9);
    const chainCode = buffer.slice(13, 45);
    const X = buffer.slice(45, 78);
    const hd = new BIP32(X, chainCode, this.network, depth, i);
    const publicKey = (await (await hd.derive(account)).derive(index))
      .publicKey;
    return Decred.getAddressFromPk(publicKey);
  }
}

export default Decred;
