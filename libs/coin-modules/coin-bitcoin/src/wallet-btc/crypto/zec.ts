// @ts-nocheck ts-go hash160 Buffer vs Uint8Array
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

  async getLegacyAddress(xpub: string, account: number, index: number): Promise<string> {
    const hashResult = bjs.crypto.hash160(
      (await this.getPubkeyAt(xpub, account, index)) as unknown as Uint8Array,
    );
    // @ts-ignore
    const pk: Buffer = Buffer.from(hashResult);
    const payload = Buffer.allocUnsafe(22);
    payload.writeUInt16BE(this.network.pubKeyHash, 0);
    pk.copy(payload as unknown as Uint8Array, 2);
    return bs58check.encode(payload as unknown as Uint8Array);
  }

  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number,
  ): Promise<string> {
    return await this.getLegacyAddress(xpub, account, index);
  }

  toOutputScript(address: string): Buffer {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    const version = Number("0x" + bs58check.decode(address).slice(0, 2).toString("hex"));
    if (version === this.network.pubKeyHash) {
      //Pay-to-PubkeyHash
      return bjs.payments.p2pkh({ hash: bs58check.decode(address).slice(2) }).output as Buffer;
    }
    if (version === this.network.scriptHash) {
      //Pay-to-Script-Hash
      return bjs.payments.p2sh({ hash: bs58check.decode(address).slice(2) }).output as Buffer;
    }
    throw new InvalidAddress();
  }

  validateAddress(address: string): boolean {
    try {
      const version = Number("0x" + bs58check.decode(address).slice(0, 2).toString("hex"));
      // refer to https://github.com/zcash-hackworks/bitcore-lib-zcash/blob/master/lib%2Faddress.js for the address validation
      if (version === this.network.pubKeyHash || version === this.network.scriptHash) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}

export default ZCash;
