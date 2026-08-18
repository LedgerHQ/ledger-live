import type { BitcoinJS } from "coininfo";
import Base from "./base";

class BitcoinGold extends Base {
  constructor({ network }: { network: BitcoinJS }) {
    super({ network });
    this.network.dustThreshold = 5430;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default BitcoinGold;
