import bchaddr from "bchaddrjs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { toOutputScript } from "bitcoinjs-lib/src/address";
import { InvalidAddress } from "@ledgerhq/errors";
import { DerivationModes } from "../types";
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

  // eslint-disable-next-line
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDerivationMode(address: string) {
    return DerivationModes.LEGACY;
  }

  toOutputScript(address: string) {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    // TODO find a better way to calculate the script from bch address instead of converting to bitcoin address
    return toOutputScript(bchaddr.toLegacyAddress(address), this.network);
  }

  // eslint-disable-next-line class-methods-use-this
  validateAddress(address: string): boolean {
    return bchaddr.isValidAddress(address);
  }
}

export default BitcoinCash;
