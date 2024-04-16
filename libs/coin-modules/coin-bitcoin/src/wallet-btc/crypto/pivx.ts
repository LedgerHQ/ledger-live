import Base from "./base";

class Pivx extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/master/core/src/wallet/bitcoin/networks.cpp#L369
    this.network.bip32.public = 0x022d2533;
    this.network.pubKeyHash = 0x1e;
    this.network.scriptHash = 0x0d;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }
}

export default Pivx;
