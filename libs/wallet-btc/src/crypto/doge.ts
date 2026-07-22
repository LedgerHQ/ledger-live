import type { BitcoinJS } from "coininfo";
import Base from "./base";

class Doge extends Base {
  constructor({ network }: { network: BitcoinJS }) {
    super({ network });
    // https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md
    // set 0.01 DOGE as dustThreshold
    this.network.dustThreshold = 1000000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Doge;
