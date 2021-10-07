import Base from "./base";

class Stakenet extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/master/core/src/wallet/bitcoin/networks.cpp#L418
    this.network.bip32.public = 0x0488b21e;
    this.network.pubKeyHash = 0x4c;
    this.network.scriptHash = 0x10;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Stakenet;
