// from https://github.com/LedgerHQ/xpub-scan/blob/master/src/actions/deriveAddresses.ts

import * as bjs from "bitcoinjs-lib";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { toOutputScript } from "bitcoinjs-lib/src/address";
import bs58check from "bs58check";
import { DerivationModes } from "../types";
import { ICrypto } from "./types";
import bs58 from "bs58";
import bech32 from "bech32";
import BIP32 from "./bip32";

export function fallbackValidateAddress(address: string): boolean {
  try {
    bjs.address.fromBase58Check(address);
  } catch {
    // Not a valid Base58 address
    try {
      bjs.address.fromBech32(address);
    } catch {
      // Not a valid Bech32 address either
      return false;
    }
  }
  return true;
}

class Base implements ICrypto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;
  protected static publickeyCache = {}; // xpub + account + index to publicKey
  public static addressCache = {}; // derivationMode + xpub + account + index to address
  protected static bech32Cache = {}; // xpub to bech32 interface

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    this.network = network;
    this.network.dustThreshold = 3000;
    this.network.dustPolicy = "PER_KBYTE";
    this.network.usesTimestampedTransaction = false;
  }

  protected getPubkeyAt(xpub: string, account: number, index: number): Buffer {
    if (!Base.bech32Cache[`${this.network.name}-${xpub}`]) {
      const buffer: Buffer = bs58.decode(xpub);
      const depth: number = buffer[4];
      const i: number = buffer.readUInt32BE(9);
      const chainCode: Buffer = buffer.slice(13, 45);
      const publicKey: Buffer = buffer.slice(45, 78);
      Base.bech32Cache[`${this.network.name}-${xpub}`] = new BIP32(
        publicKey,
        chainCode,
        this.network,
        depth,
        i
      );
    }
    if (
      Base.publickeyCache[`${this.network.name}-${xpub}-${account}-${index}`]
    ) {
      return Base.publickeyCache[
        `${this.network.name}-${xpub}-${account}-${index}`
      ];
    }
    if (Base.publickeyCache[`${this.network.name}-${xpub}-${account}`]) {
      const publicKey =
        Base.publickeyCache[`${this.network.name}-${xpub}-${account}`].derive(
          index
        ).publicKey;
      Base.publickeyCache[`${this.network.name}-${xpub}-${account}-${index}`] =
        publicKey;
      return publicKey;
    }
    Base.publickeyCache[`${this.network.name}-${xpub}-${account}`] =
      Base.bech32Cache[`${this.network.name}-${xpub}`].derive(account);
    const publicKey =
      Base.publickeyCache[`${this.network.name}-${xpub}-${account}`].derive(
        index
      ).publicKey;
    Base.publickeyCache[`${this.network.name}-${xpub}-${account}-${index}`] =
      publicKey;
    return publicKey;
  }

  // derive legacy address at account and index positions
  protected getLegacyAddress(
    xpub: string,
    account: number,
    index: number
  ): string {
    const publicKeyBuffer: Buffer = this.getPubkeyAt(xpub, account, index);
    const publicKeyHash160: Buffer = bjs.crypto.hash160(publicKeyBuffer);
    return bjs.address.toBase58Check(publicKeyHash160, this.network.pubKeyHash);
  }

  // derive native SegWit at account and index positions
  private getNativeSegWitAddress(
    xpub: string,
    account: number,
    index: number
  ): string {
    const publicKeyBuffer: Buffer = this.getPubkeyAt(xpub, account, index);
    const publicKeyHash160: Buffer = bjs.crypto.hash160(publicKeyBuffer);
    const words: number[] = bech32.toWords(publicKeyHash160);
    words.unshift(0x00);
    return bech32.encode(this.network.bech32, words);
  }

  // derive SegWit at account and index positions
  private getSegWitAddress(
    xpub: string,
    account: number,
    index: number
  ): string {
    const publicKeyBuffer: Buffer = this.getPubkeyAt(xpub, account, index);
    const redeemOutput: Buffer = bjs.script.compile([
      0,
      bjs.crypto.hash160(publicKeyBuffer),
    ]);
    const publicKeyHash160: Buffer = bjs.crypto.hash160(redeemOutput);
    const payload: Buffer = Buffer.allocUnsafe(21);
    payload.writeUInt8(this.network.scriptHash, 0);
    publicKeyHash160.copy(payload, 1);
    return bs58check.encode(payload);
  }

  // get address given an address type
  getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string {
    if (
      Base.addressCache[
        `${this.network.name}-${derivationMode}-${xpub}-${account}-${index}`
      ]
    ) {
      return Base.addressCache[
        `${this.network.name}-${derivationMode}-${xpub}-${account}-${index}`
      ];
    }
    const res = this.customGetAddress(derivationMode, xpub, account, index);
    Base.addressCache[
      `${this.network.name}-${derivationMode}-${xpub}-${account}-${index}`
    ] = res;
    return res;
  }

  customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string {
    switch (derivationMode) {
      case DerivationModes.LEGACY:
        return this.getLegacyAddress(xpub, account, index);
      case DerivationModes.SEGWIT:
        return this.getSegWitAddress(xpub, account, index);
      case DerivationModes.NATIVE_SEGWIT:
        return this.getNativeSegWitAddress(xpub, account, index);
      default:
        throw new Error(`Invalid derivation Mode: ${derivationMode}`);
    }
  }

  // infer address type from its syntax
  getDerivationMode(address: string): DerivationModes {
    if (address.match("^(bc1|tb1).*")) {
      return DerivationModes.NATIVE_SEGWIT;
    }
    if (address.match("^(3|2|M).*")) {
      return DerivationModes.SEGWIT;
    }
    if (address.match("^(1|n|m|L).*")) {
      return DerivationModes.LEGACY;
    }
    throw new Error(
      "INVALID ADDRESS: ".concat(address).concat(" is not a valid address")
    );
  }

  toOutputScript(address: string): Buffer {
    return toOutputScript(address, this.network);
  }

  validateAddress(address: string): boolean {
    // bs58 address
    const res = bs58check.decodeUnsafe(address);
    if (!res) return false;
    return (
      res.length > 3 &&
      (res[0] === this.network.pubKeyHash || res[0] === this.network.scriptHash)
    );
  }

  // eslint-disable-next-line
  isTaprootAddress(address: string): boolean {
    return false;
  }
}

export default Base;
