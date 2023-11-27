import type Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "./constants";
import { VETLedgerAccount } from "./model";
import { splitPath, splitRaw } from "./utils";
import { Buffer } from "buffer";

import { VechainAppPleaseEnableContractDataAndMultiClause } from "./errors";

const remapTransactionRelatedErrors = e => {
  if (e && e.statusCode === 0x6a80) {
    return new VechainAppPleaseEnableContractDataAndMultiClause(
      "Please enable contract data in Vechain app settings",
    );
  }

  return e;
};

/**
 * VeChain API
 *
 * @example
 * import Vet from "@ledgerhq/hw-app-vet";
 * const vet = new Vet(transport)
 */

export default class Vet {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "V3T") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["getAppConfiguration", "getAddress", "signTransaction"],
      scrambleKey,
    );
  }

  async getAppConfiguration(): Promise<any> {
    const response = await this.transport.send(0xe0, 0x06, 0x00, 0x00, Buffer.alloc(0), [
      StatusCodes.OK,
    ]);

    return response.slice(0, 4);
  }

  /**
   * get VeChain address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option display
   * @option chainCode
   * @return an object with a publicKey and address
   * @example
   * vet.getAddress("m/44'/818'/0'/0").then(o => o.address)
   */
  async getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    statusCodes: StatusCodes[] = [StatusCodes.OK],
  ): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    const response = await this.transport.send(
      0xe0,
      0x02,
      display ? 0x01 : 0x00,
      chainCode ? 0x01 : 0x00,
      buffer,
      statusCodes,
    );

    const publicKeyLength = response[0];
    const addressLength = response[1 + publicKeyLength];
    const acc: VETLedgerAccount = {
      publicKey: response.slice(1, 1 + publicKeyLength).toString("hex"),
      address:
        "0x" +
        response
          .slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength)
          .toString("ascii")
          .toLowerCase(),
    };
    if (chainCode) {
      acc.chainCode = response
        .slice(
          1 + publicKeyLength + 1 + addressLength,
          1 + publicKeyLength + 1 + addressLength + 32,
        )
        .toString("hex");
    }
    return acc;
  }

  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign.
   *
   * @param path: the BIP32 path to sign the transaction on
   * @param rawTxHex: the raw vechain transaction in hexadecimal to sign
   */
  async signTransaction(path: string, rawTxHex: string): Promise<Buffer> {
    const buffers = splitRaw(path, rawTxHex, true);
    const responses = [] as Buffer[];

    for (let i = 0; i < buffers.length; i++) {
      const data = buffers[i];
      responses.push(
        await this.transport
          .send(0xe0, 0x04, i === 0 ? 0x00 : 0x80, 0x00, data, [StatusCodes.OK])
          .catch(e => {
            throw remapTransactionRelatedErrors(e);
          }),
      );
    }

    const lastResponse = responses[responses.length - 1];
    if (lastResponse.length < 65) {
      throw new Error("invalid signature");
    }

    return lastResponse.slice(0, 65);
  }
}
