import * as bech32 from "bech32";
import bs58check from "bs58check";
import Base from "./base";

class Digibyte extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    // missing bip32 info in coininfo network for digibyte, we fill it mannually
    // https://electrum.readthedocs.io/en/latest/xpub_version_bytes.html
    super({ network });
    this.network.bip32 = { public: 0x0488b21e, private: 0x0488ade4 };
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  validateAddress(address: string): boolean {
    // bech32 address
    if (address.substring(0, 3) === "dgb") {
      if (bech32.decodeUnsafe(address)) {
        return true;
      }
    }
    // bs58 address
    const res = bs58check.decodeUnsafe(address);
    if (!res) return false;
    return (
      res.length > 3 && (res[0] === this.network.pubKeyHash || res[0] === this.network.scriptHash)
    );
  }
}

export default Digibyte;
