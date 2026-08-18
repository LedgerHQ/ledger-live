import type { BitcoinJS } from "coininfo";
import Base from "./base";
class Qtum extends Base {
  constructor({ network }: { network: BitcoinJS }) {
    super({ network });
    this.network.dustThreshold = 100000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Qtum;
