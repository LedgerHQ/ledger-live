import Base from "./base";

class Peercoin extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // https://github.com/LedgerHQ/lib-ledger-core/blob/master/core/src/wallet/bitcoin/networks.cpp#L176
    this.network.bip32.public = 0xe6e8e9e5;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = true;
  }
}

export default Peercoin;
