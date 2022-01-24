// Fix the "More than one instance of bitcore-lib-cash" issue. Refer to https://github.com/bitpay/bitcore/issues/1457
delete global._bitcoreCash;
import * as bch from "bitcore-lib-cash";
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

  // Based on https://github.com/go-faast/bitcoin-cash-payments/blob/54397eb97c7a9bf08b32e10bef23d5f27aa5ab01/index.js#L63-L73
  // eslint-disable-next-line
  getLegacyBitcoinCashAddress(
    xpub: string,
    account: number,
    index: number
  ): string {
    const node = new bch.HDPublicKey(xpub);
    const child = node.derive(account).derive(index);
    const address = new bch.Address(child.publicKey, bch.Networks.livenet);
    return address.toString();
  }

  // get address given an address type
  customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number
  ): string {
    return this.getLegacyBitcoinCashAddress(xpub, account, index);
  }

  // infer address type from its syntax
  //
  // TODO: improve the prefix matching: make the expected prefix
  // correspond to the actual type (currently, a `ltc1` prefix
  // could match a native Bitcoin address type for instance)
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

  // eslint-disable-next-line
  isTaprootAddress(address: string): boolean {
    return false;
  }
}

export default BitcoinCash;
