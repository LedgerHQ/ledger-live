// from https://github.com/LedgerHQ/xpub-scan/blob/master/src/actions/deriveAddresses.ts

import * as bjs from "bitcoinjs-lib";
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
  network: any;
  protected static bip32Cache = {}; // xpub + account + index to publicKey
  public static addressCache = {}; // derivationMode + xpub + account + index to address

  constructor({ network }: { network: any }) {
    this.network = network;
    this.network.dustThreshold = 3000;
    this.network.dustPolicy = "PER_KBYTE";
    this.network.usesTimestampedTransaction = false;
  }

  protected async getPubkeyAt(
    xpub: string,
    account: number,
    index: number
  ): Promise<Buffer> {
    // a cache is stored in Base.bip32Cache to optimize the calculation
    // at each step, we make sure the level has been calculated and calc if necessary

    // 0: root level
    const keyRoot = `${this.network.name}-${xpub}`;
    let rootLevel = Base.bip32Cache[keyRoot]; // it's stored "in sync"
    if (!rootLevel) {
      const buffer: Buffer = bs58.decode(xpub);
      const depth: number = buffer[4];
      const i: number = buffer.readUInt32BE(9);
      const chainCode: Buffer = buffer.slice(13, 45);
      const publicKey: Buffer = buffer.slice(45, 78);
      Base.bip32Cache[keyRoot] = rootLevel = new BIP32(
        publicKey,
        chainCode,
        this.network,
        depth,
        i
      );
    }

    // 1: account level
    const keyAccount = `${keyRoot}-${account}`;
    let accountLevelP = Base.bip32Cache[keyAccount]; // it's stored as promise
    if (!accountLevelP) {
      Base.bip32Cache[keyAccount] = accountLevelP = rootLevel.derive(account);
    }

    // 2: index level
    const keyIndex = `${keyAccount}-${index}`;
    let indexLevelP = Base.bip32Cache[keyIndex]; // it's stored as promise
    if (!indexLevelP) {
      Base.bip32Cache[keyIndex] = indexLevelP = accountLevelP.then((a) =>
        a.derive(index)
      );
    }

    // We can finally return the publicKey. in most case, indexLevelP will be "resolved"
    return (await indexLevelP).publicKey;
  }

  // derive legacy address at account and index positions
  protected async getLegacyAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    const publicKeyBuffer: Buffer = await this.getPubkeyAt(
      xpub,
      account,
      index
    );
    const publicKeyHash160: Buffer = bjs.crypto.hash160(publicKeyBuffer);
    return bjs.address.toBase58Check(publicKeyHash160, this.network.pubKeyHash);
  }

  // derive native SegWit at account and index positions
  private async getNativeSegWitAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    const publicKeyBuffer: Buffer = await this.getPubkeyAt(
      xpub,
      account,
      index
    );
    const publicKeyHash160: Buffer = bjs.crypto.hash160(publicKeyBuffer);
    const words: number[] = bech32.toWords(publicKeyHash160);
    words.unshift(0x00);
    return bech32.encode(this.network.bech32, words);
  }

  // derive SegWit at account and index positions
  private async getSegWitAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    const publicKeyBuffer: Buffer = await this.getPubkeyAt(
      xpub,
      account,
      index
    );
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

  // default getDustLimit value - implement this method for specific coins to override value
  public getDustLimit(): number {
    return 0;
  }

  // get address given an address type
  async getAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
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

  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    switch (derivationMode) {
      case DerivationModes.LEGACY:
        return await this.getLegacyAddress(xpub, account, index);
      case DerivationModes.SEGWIT:
        return await this.getSegWitAddress(xpub, account, index);
      case DerivationModes.NATIVE_SEGWIT:
        return await this.getNativeSegWitAddress(xpub, account, index);
      default:
        throw new Error(`Invalid derivation Mode: ${derivationMode}`);
    }
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

  isTaprootAddress(_address: string): boolean {
    return false;
  }
}

export default Base;
