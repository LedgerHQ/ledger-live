import Base from "./base";

class Firo extends Base {
  constructor({ network }: { network: any }) {
    super({ network });
    this.network.dustThreshold = 1000000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Firo;

