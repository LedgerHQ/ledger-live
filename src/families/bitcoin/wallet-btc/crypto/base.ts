// from https://github.com/LedgerHQ/xpub-scan/blob/master/src/actions/deriveAddresses.ts

import * as bjs from "bitcoinjs-lib";
import * as bip32 from "bip32";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { toOutputScript } from "bitcoinjs-lib/src/address";
import bs58check from "bs58check";
import { DerivationModes } from "../types";
import { ICrypto } from "./types";

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
    if (!Base.bech32Cache[xpub]) {
      Base.bech32Cache[xpub] = bip32.fromBase58(xpub, this.network);
    }
    if (Base.publickeyCache[`${xpub}-${account}-${index}`]) {
      return Base.publickeyCache[`${xpub}-${account}-${index}`];
    }
    if (Base.publickeyCache[`${xpub}-${account}`]) {
      const publicKey =
        Base.publickeyCache[`${xpub}-${account}`].derive(index).publicKey;
      Base.publickeyCache[`${xpub}-${account}-${index}`] = publicKey;
      return publicKey;
    }
    Base.publickeyCache[`${xpub}-${account}`] =
      Base.bech32Cache[xpub].derive(account);
    const publicKey =
      Base.publickeyCache[`${xpub}-${account}`].derive(index).publicKey;
    Base.publickeyCache[`${xpub}-${account}-${index}`] = publicKey;
    return publicKey;
  }

  // derive legacy address at account and index positions
  getLegacyAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2pkh({
      pubkey: this.getPubkeyAt(xpub, account, index),
      network: this.network,
    });

    return String(address);
  }

  // derive native SegWit at account and index positions
  getNativeSegWitAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2wpkh({
      pubkey: this.getPubkeyAt(xpub, account, index),
      network: this.network,
    });

    return String(address);
  }

  // derive SegWit at account and index positions
  getSegWitAddress(xpub: string, account: number, index: number): string {
    const { address } = bjs.payments.p2sh({
      redeem: bjs.payments.p2wpkh({
        pubkey: this.getPubkeyAt(xpub, account, index),
        network: this.network,
      }),
    });
    return String(address);
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
    switch (derivationMode) {
      case DerivationModes.LEGACY:
        Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`] =
          this.getLegacyAddress(xpub, account, index);
        break;
      case DerivationModes.SEGWIT:
        Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`] =
          this.getSegWitAddress(xpub, account, index);
        break;
      case DerivationModes.NATIVE_SEGWIT:
        Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`] =
          this.getNativeSegWitAddress(xpub, account, index);
        break;
      default:
        throw new Error(`Invalid derivation Mode: ${derivationMode}`);
    }
    return Base.addressCache[`${derivationMode}-${xpub}-${account}-${index}`];
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
