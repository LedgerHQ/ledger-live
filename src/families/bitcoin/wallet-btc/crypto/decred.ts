import Base from "./base";
import { InvalidAddress } from "@ledgerhq/errors";
import * as bjs from "bitcoinjs-lib";
import bs58checkBase from "bs58check/base";
import bs58check from "bs58check";
import createBlakeHash from "blake-hash";
import RIPEMD160 from "ripemd160";
import bs58 from "bs58";
import ecc from "tiny-secp256k1";
import createHash from "create-hash";
import createHmac from "create-hmac";

// the BIP32 class is inspired from https://github.com/bitcoinjs/bip32/blob/master/src/bip32.js
class BIP32 {
  privateKey: any;
  publicKey: any;
  chainCode: any;
  network: any;
  depth: number;
  index: number;
  ParentFingerprint: number;
  lowR: boolean;
  constructor(
    privateKey,
    publicKey,
    chainCode,
    network,
    depth = 0,
    index = 0,
    ParentFingerprint = 0x00000000
  ) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.chainCode = chainCode;
    this.network = network;
    this.depth = depth;
    this.index = index;
    this.ParentFingerprint = ParentFingerprint;
    this.lowR = false;
  }
  pk() {
    if (this.publicKey === undefined)
      this.publicKey = ecc.pointFromScalar(this.privateKey, true);
    return this.publicKey;
  }
  isNeutered() {
    return this.privateKey === undefined;
  }
  neutered() {
    return new BIP32(
      undefined,
      this.pk(),
      this.chainCode,
      this.network,
      this.depth,
      this.index,
      this.ParentFingerprint
    );
  }
  hmacSHA512(key, data) {
    return createHmac("sha512", key).update(data).digest();
  }
  hash160(buffer) {
    const sha256Hash = createHash("sha256").update(buffer).digest();
    return createHash("rmd160").update(sha256Hash).digest();
  }
  fingerprint() {
    return this.hash160(this.pk()).slice(0, 4);
  }

  toBase58() {
    const network = this.network;
    const version = !this.isNeutered()
      ? network.bip32.private
      : network.bip32.public;
    const buffer = Buffer.allocUnsafe(78);
    // 4 bytes: version bytes
    buffer.writeUInt32BE(version, 0);
    // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
    buffer.writeUInt8(this.depth, 4);
    // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
    buffer.writeUInt32BE(this.ParentFingerprint, 5);
    // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
    // This is encoded in big endian. (0x00000000 if master key)
    buffer.writeUInt32BE(this.index, 9);
    // 32 bytes: the chain code
    this.chainCode.copy(buffer, 13);
    // 33 bytes: the public key or private key data
    if (!this.isNeutered()) {
      // 0x00 + k for private keys
      buffer.writeUInt8(0, 45);
      this.privateKey.copy(buffer, 46);
      // 33 bytes: the public key
    } else {
      // X9.62 encoding for public keys
      this.pk().copy(buffer, 45);
    }
    return bs58check.encode(buffer);
  }
  // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
  derive(index) {
    const isHardened = index >= 0x80000000;
    const data = Buffer.allocUnsafe(37);
    // Hardened child
    if (isHardened) {
      data[0] = 0x00;
      this.privateKey.copy(data, 1);
      data.writeUInt32BE(index, 33);
    } else {
      this.pk().copy(data, 0);
      data.writeUInt32BE(index, 33);
    }
    const I = this.hmacSHA512(this.chainCode, data);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    // if parse256(IL) >= n, proceed with the next value for i
    if (!ecc.isPrivate(IL)) return this.derive(index + 1);
    // Private parent key -> private child key
    let hd;
    if (!this.isNeutered()) {
      // ki = parse256(IL) + kpar (mod n)
      const ki = ecc.privateAdd(this.privateKey, IL);
      // In case ki == 0, proceed with the next value for i
      if (ki == null) return this.derive(index + 1);
      hd = new BIP32(
        ki,
        undefined,
        IR,
        this.network,
        this.depth + 1,
        index,
        this.fingerprint().readUInt32BE(0)
      );
    } else {
      // Ki = point(parse256(IL)) + Kpar
      //    = G*IL + Kpar
      const Ki = ecc.pointAddScalar(this.pk(), IL, true);
      // In case Ki is the point at infinity, proceed with the next value for i
      if (Ki === null) return this.derive(index + 1);
      hd = new BIP32(
        undefined,
        Ki,
        IR,
        this.network,
        this.depth + 1,
        index,
        this.fingerprint().readUInt32BE(0)
      );
    }
    return hd;
  }
}

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
  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string {
    if (Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`]) {
      return Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`];
    }
    let buffer: Buffer;
    try {
      buffer = Decred.bs58check.decode(xpub);
    } catch {
      buffer = bs58check.decode(xpub);
    }
    const depth = buffer[4];
    const parentFingerprint = buffer.readUInt32BE(5);
    const i = buffer.readUInt32BE(9);
    const chainCode = buffer.slice(13, 45);
    const X = buffer.slice(45, 78);
    const hd = new BIP32(
      undefined,
      X,
      chainCode,
      this.network,
      depth,
      i,
      parentFingerprint
    );
    const publicKey = hd.derive(account).derive(index).pk();
    const address = Decred.getAddressFromPk(publicKey);
    Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`] =
      address;
    return address;
  }
}

export default Decred;
