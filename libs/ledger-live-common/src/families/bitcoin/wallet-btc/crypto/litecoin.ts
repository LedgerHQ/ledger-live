import { toOutputScript } from "bitcoinjs-lib/src/address";
import * as bech32 from "bech32";
import Base from "./base";

// Todo copy paste from bitcoin.ts. we can merge them later
class Litecoin extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  toOutputScript(address: string): Buffer {
    return toOutputScript(address, this.network);
  }

  validateAddress(address: string): boolean {
    // bech32 address
    if (address.substring(0, 3) === "ltc") {
      if (bech32.decodeUnsafe(address)) {
        return true;
      }
    }
    // bs58 address
    return super.validateAddress(address);
  }
}

export default Litecoin;
