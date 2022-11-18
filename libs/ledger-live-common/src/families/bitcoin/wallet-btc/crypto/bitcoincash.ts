import bchaddr from "bchaddrjs";
import { toOutputScript } from "bitcoinjs-lib/src/address";
import { InvalidAddress } from "@ledgerhq/errors";
import Base from "./base";

// a mock explorer class that just use js objects
class BitcoinCash extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network = network;
    this.network.dustThreshold = 5430;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  async getLegacyBitcoinCashAddress(
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    return bchaddr.toCashAddress(
      await super.getLegacyAddress(xpub, account, index)
    );
  }

  // get address given an address type
  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): Promise<string> {
    return await this.getLegacyBitcoinCashAddress(xpub, account, index);
  }

  toOutputScript(address: string): Buffer {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    // TODO find a better way to calculate the script from bch address instead of converting to bitcoin address
    return toOutputScript(bchaddr.toLegacyAddress(address), this.network);
  }

  validateAddress(address: string): boolean {
    return bchaddr.isValidAddress(address);
  }
}

export default BitcoinCash;
