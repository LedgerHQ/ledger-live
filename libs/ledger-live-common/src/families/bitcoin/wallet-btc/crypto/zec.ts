import bs58check from "bs58check";
import * as bjs from "bitcoinjs-lib";
import { InvalidAddress } from "@ledgerhq/errors";
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
  async getLegacyAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    const pk = bjs.crypto.hash160(await this.getPubkeyAt(xpub, account, index));
    const payload = Buffer.allocUnsafe(22);
    payload.writeUInt16BE(this.network.pubKeyHash, 0);
    pk.copy(payload, 2);
    return bs58check.encode(payload);
  }

  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    return await this.getLegacyAddress(xpub, account, index);
  }

  toOutputScript(address: string): Buffer {
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
    try {
      const version = Number(
        "0x" + bs58check.decode(address).slice(0, 2).toString("hex")
      );
      // refer to https://github.com/zcash-hackworks/bitcore-lib-zcash/blob/master/lib%2Faddress.js for the address validation
      if (
        version === this.network.pubKeyHash ||
        version === this.network.scriptHash
      ) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}

export default ZCash;
