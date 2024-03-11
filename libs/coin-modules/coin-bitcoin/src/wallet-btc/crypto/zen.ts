import bs58check from "bs58check";
import { InvalidAddress } from "@ledgerhq/errors";
import Base from "./base";
import * as bjs from "bitcoinjs-lib";

class Zen extends Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ network }: { network: any }) {
    super({ network });
    // refer to https://github.com/HorizenOfficial/zen/blob/master/src/chainparams.cpp for the blockchain params
    this.network = network;
    this.network.versions = {
      bip32: {
        public: 0x043587cf,
        private: 0x04358394,
      },
      bip44: 121,
      private: 0x80,
      public: 0x2089,
      scripthash: 0x2096,
    };
    this.network.name = "Zencash";
    this.network.unit = "ZEN";
    this.network.messagePrefix = "Zencash Signed Message:\n";
    this.network.wif = 0x80;
    this.network.pubKeyHash = 0x2089;
    this.network.scriptHash = 0x2096;
    this.network.dustThreshold = 10000;
    this.network.dustPolicy = "FIXED";
    this.network.usesTimestampedTransaction = false;
  }

  async getLegacyAddress(xpub: string, account: number, index: number): Promise<string> {
    const pk = bjs.crypto.hash160(await this.getPubkeyAt(xpub, account, index));
    const payload = Buffer.allocUnsafe(22);
    payload.writeUInt16BE(this.network.pubKeyHash, 0);
    pk.copy(payload, 2);
    return bs58check.encode(payload);
  }

  async customGetAddress(
    derivationMode: string,
    xpub: string,
    account: number,
    index: number,
  ): Promise<string> {
    return await this.getLegacyAddress(xpub, account, index);
  }

  toOutputScript(address: string): Buffer {
    if (!this.validateAddress(address)) {
      throw new InvalidAddress();
    }
    let outputScript: Buffer;
    const version = Number("0x" + bs58check.decode(address).slice(0, 2).toString("hex"));
    if (version === this.network.pubKeyHash) {
      //Pay-to-PubkeyHash
      outputScript = bjs.payments.p2pkh({
        hash: bs58check.decode(address).slice(2),
      }).output as Buffer;
    } else if (version === this.network.scriptHash) {
      //Pay-to-Script-Hash
      outputScript = bjs.payments.p2sh({
        hash: bs58check.decode(address).slice(2),
      }).output as Buffer;
    } else {
      throw new InvalidAddress();
    }
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/scripts/BitcoinLikeScript.cpp#L139 and https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/networks.cpp#L39 for bip115 Script and its network parameters
    const bip115Script = Buffer.from(
      "209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4",
      "hex",
    );
    return Buffer.concat([outputScript, bip115Script]);
  }

  validateAddress(address: string): boolean {
    const res = bs58check.decodeUnsafe(address);
    if (!res) return false;
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/networks.cpp#L142
    return res && res.length > 3 && res[0] === 0x20 && (res[1] === 0x89 || res[1] === 0x96);
  }
}

export default Zen;
