import Base from "./base";

class Dash extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    this.network.messagePrefix = "\x19DarkCoin Signed Message:\n";
    this.network.bip32 = {
      public: 0x02fe52f8,
      private: 0x02fe52cc,
    };
    this.network.wif = 0xcc;
    this.network.pubKeyHash = 0x4c;
    this.network.scriptHash = 0x10;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Dash;
