// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import zec from "zcash-bitcore-lib";
import bs58check from "bs58check";
import * as bjs from "bitcoinjs-lib";
import { InvalidAddress } from "@ledgerhq/errors";
import { DerivationModes } from "../types";
import Base from "./base";

class ZCash extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network = network;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  // eslint-disable-next-line
  baddrToTaddr(baddrStr: string) {
    const baddr = bs58check.decode(baddrStr).slice(1);
    const taddr = new Uint8Array(22);
    taddr.set(baddr, 2);
    taddr.set([0x1c, 0xb8], 0);
    return bs58check.encode(Buffer.from(taddr));
  }

  // eslint-disable-next-line
  getLegacyAddress(xpub: string, account: number, index: number): string {
    const pk = bjs.crypto.hash160(this.getPubkeyAt(xpub, account, index));
    const payload = Buffer.allocUnsafe(22);
    payload.writeUInt16BE(this.network.pubKeyHash, 0);
    pk.copy(payload, 2);
    return bs58check.encode(payload);
  }

  customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string {
    return this.getLegacyAddress(xpub, account, index);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDerivationMode(address: string) {
    return DerivationModes.LEGACY;
  }

  toOutputScript(address: string) {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    const version = Number(
      "0x" + bs58check.decode(address).slice(0, 2).toString("hex")
    );
    if (version === this.network.pubKeyHash) {
      //Pay-to-PubkeyHash
      return bjs.payments.p2pkh({ hash: bs58check.decode(address).slice(2) })
        .output as Buffer;
    }
    if (version === this.network.scriptHash) {
      //Pay-to-Script-Hash
      return bjs.payments.p2sh({ hash: bs58check.decode(address).slice(2) })
        .output as Buffer;
    }
    throw new InvalidAddress();
  }

  // eslint-disable-next-line class-methods-use-this
  validateAddress(address: string): boolean {
    return zec.Address.isValid(address, "livenet");
  }
}

export default ZCash;
