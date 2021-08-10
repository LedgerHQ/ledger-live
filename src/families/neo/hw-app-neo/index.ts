import Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import { getAddressFromScriptHash, getScriptHashFromPublicKey } from "./crypto";
/**
 * Neo API
 *
 * @example
 */

export default class Neo {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress"], "NEO");
  }

  /**
   * Get Neo address for the given BIP 32 path.
   * @param path a path in BIP 32 format
   * @return an object with a publicKey and address
   * @example
   * neo.getAddress("44'/888'/0'/0/0").then(o => o.address)
   */
  async getAddress(path: string) {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const buf = Buffer.alloc(4 * bipPath.length);
    bipPath.forEach((segment, index) => {
      buf.writeUInt32BE(segment, 4 * index);
    });
    const res = await this.transport.send(0x80, 0x04, 0, 0, buf);
    const publicKey = res.toString("hex").substring(0, 130);
    const scriptHash = getScriptHashFromPublicKey(publicKey);
    const address = getAddressFromScriptHash(scriptHash);
    return {
      address,
      publicKey,
    };
  }
}
