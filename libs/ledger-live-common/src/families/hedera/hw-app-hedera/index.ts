import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";

const CLA = 0xe0;

const INS = {
  GET_PUBLIC_KEY: 0x02,
  SIGN_TRANSACTION: 0x04,
};

const STATUS = {
  OK: 0x9000,
  USER_CANCEL: 0x6985,
};

/** Hedera BOLOS API */
export default class Hedera {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "BOIL") {
    this.transport = transport;

    transport.decorateAppAPIMethods(this, ["getPublicKey"], scrambleKey);
  }

  /**
   * Get a Hedera public key for a given BIP-32 path.
   *
   * Note that this does not return an address, nor is an account
   * address derivable from a public key on the Hedera network.
   *
   * @param path a path in BIP-32 format
   * @return the public key
   */
  async getPublicKey(path: string): Promise<string> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this._serializePath(bipPath);

    const p1 = 0x01;
    const p2 = 0x00;

    const response = await this.transport.send(
      CLA,
      INS.GET_PUBLIC_KEY,
      p1,
      p2,
      serializedPath
    );

    const returnCodeBytes = response.slice(-2);
    const returnCode = (returnCodeBytes[0] << 8) | returnCodeBytes[1];

    if (returnCode === STATUS.USER_CANCEL) {
      throw new UserRefusedAddress();
    }

    return response.slice(0, 32).toString("hex");
  }

  // TODO: the BOLOS app does not support anything but index #0 for signing transactions
  async signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    const payload = Buffer.alloc(4 + transaction.length);
    payload.writeUInt32LE(0);
    payload.fill(transaction, 4);

    const p1 = 0x00;
    const p2 = 0x00;

    const response = await this.transport.send(
      CLA,
      INS.SIGN_TRANSACTION,
      p1,
      p2,
      payload
    );

    const returnCodeBytes = response.slice(-2);
    const returnCode = (returnCodeBytes[0] << 8) | returnCodeBytes[1];

    if (returnCode === STATUS.USER_CANCEL) {
      throw new UserRefusedOnDevice();
    }

    return response.slice(0, -2);
  }

  /**
   * Serialize a BIP path to a data buffer, intended for
   * consumption by the Hedera BOLOS.
   *
   * @private
   */
  _serializePath(path: number[]): Buffer {
    const data = Buffer.alloc(1 + path.length * 4);

    path.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4);
    });

    return data;
  }
}
