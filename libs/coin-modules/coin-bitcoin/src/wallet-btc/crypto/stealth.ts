import Base from "./base";

class Stealth extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/master/core/src/wallet/bitcoin/networks.cpp#L240
    this.network.bip32.public = 0x8f624b66;
    this.network.pubKeyHash = 0x3e;
    this.network.scriptHash = 0x55;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = true;
  }
}

export default Stealth;
