import Base from "./base";

class Doge extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md
    // set 0.01 DOGE as dustThreshold
    this.network.dustThreshold = 1000000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Doge;
