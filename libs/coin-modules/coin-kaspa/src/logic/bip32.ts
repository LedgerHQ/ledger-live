import ecc from "@bitcoinerlab/secp256k1";
import BIP32Factory, { BIP32API, BIP32Interface } from "bip32";
import { publicKeyToAddress } from "./kaspaAddresses";

const bip32: BIP32API = BIP32Factory(ecc);
const cache: Map<string, string> = new Map();

export default class KaspaBIP32 {
  rootNode: BIP32Interface;
  fingerprint: string;

  constructor(compressedPublicKey: Buffer, chainCode: Buffer) {
    this.rootNode = bip32.fromPublicKey(compressedPublicKey, chainCode);
    this.fingerprint = this.rootNode.fingerprint.toString("hex");
  }

  getAddress(type: number = 0, index: number = 0) {
    const cacheKey = `${this.fingerprint}'${type}/${index}`;
    const cachedValue = cache.get(cacheKey);
    if (cachedValue) return cachedValue;

    const child = this.rootNode.derivePath(`${type}/${index}`);

    // child.publicKey is a compressed public key
    const publicKeyBuffer: Buffer = Buffer.from(child.publicKey.subarray(1, 33));
    const kaspaAddress = publicKeyToAddress(publicKeyBuffer, false);
    cache.set(cacheKey, kaspaAddress);
    return kaspaAddress;
  }
}
