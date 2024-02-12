/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2017-2018 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import { UserRefusedOnDevice, UserRefusedAddress, TransportError } from "@ledgerhq/errors";
const CHUNK_SIZE = 250;
const CLA = 0x90;
const INS = {
  GET_VERSION: 0x00,
  GET_ADDR_ED25519: 0x01,
  SIGN_ED25519: 0x02,
};
const PAYLOAD_TYPE_INIT = 0x00;
const PAYLOAD_TYPE_ADD = 0x01;
const PAYLOAD_TYPE_LAST = 0x02;
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;
const SW_ERROR_DATA_INVALID = 0x6984;
const SW_ERROR_BAD_KEY_HANDLE = 0x6a80;
/**
 * Polkadot API
 *
 * @example
 * import Polkadot from "@ledgerhq/hw-app-polkadot";
 * const polkadot = new Polkadot(transport)
 */

export default class Polkadot {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "sign"], "DOT");
  }

  serializePath(path: Array<number>): Buffer {
    const buf = Buffer.alloc(20);
    buf.writeUInt32LE(path[0], 0);
    buf.writeUInt32LE(path[1], 4);
    buf.writeUInt32LE(path[2], 8);
    buf.writeUInt32LE(path[3], 12);
    buf.writeUInt32LE(path[4], 16);
    return buf;
  }

  /**
   * @param {string} path
   * @param {boolean} requireConfirmation - if true, user must valid if the address is correct on the device
   */
  async getAddress(
    path: string,
    requireConfirmation = false,
  ): Promise<{
    pubKey: string;
    address: string;
    return_code: number;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const bip44Path = this.serializePath(bipPath);
    return this.transport
      .send(CLA, INS.GET_ADDR_ED25519, requireConfirmation ? 1 : 0, 0, bip44Path, [
        SW_OK,
        SW_CANCEL,
      ])
      .then(response => {
        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

        if (returnCode === SW_CANCEL) {
          throw new UserRefusedAddress();
        }

        return {
          pubKey: response.slice(0, 32).toString("hex"),
          address: response.slice(32, response.length - 2).toString("ascii"),
          return_code: returnCode,
        };
      });
  }

  foreach<T, A>(arr: T[], callback: (arg0: T, arg1: number) => Promise<A>): Promise<A[]> {
    function iterate(index, array, result) {
      if (index >= array.length) {
        return result;
      } else
        return callback(array[index], index).then(function (res) {
          result.push(res);
          return iterate(index + 1, array, result);
        });
    }

    return Promise.resolve().then(() => iterate(0, arr, []));
  }

  /**
   * Sign a payload
   * @param {*} path
   * @param {string} message - payload
   * @returns {string} - signed payload to be broadcasted
   */
  async sign(
    path: string,
    message: string,
  ): Promise<{
    signature: null | string;
    return_code: number;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);
    const chunks: Buffer[] = [];
    chunks.push(serializedPath);
    const buffer = Buffer.from(message);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;

      if (i > buffer.length) {
        end = buffer.length;
      }

      chunks.push(buffer.slice(i, end));
    }

    let response: any = {};
    return this.foreach(chunks, (data, j) =>
      this.transport
        .send(
          CLA,
          INS.SIGN_ED25519,
          j === 0
            ? PAYLOAD_TYPE_INIT
            : j + 1 === chunks.length
            ? PAYLOAD_TYPE_LAST
            : PAYLOAD_TYPE_ADD,
          0,
          data,
          [SW_OK, SW_CANCEL, SW_ERROR_DATA_INVALID, SW_ERROR_BAD_KEY_HANDLE],
        )
        .then(apduResponse => (response = apduResponse)),
    ).then(() => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      if (returnCode === SW_CANCEL) {
        throw new UserRefusedOnDevice();
      }

      if (returnCode === SW_ERROR_DATA_INVALID || returnCode === SW_ERROR_BAD_KEY_HANDLE) {
        const errorMessage = response.slice(0, response.length - 2).toString("ascii");
        throw new TransportError(errorMessage, "Sign");
      }

      let signature = null;

      if (response.length > 2) {
        signature = response.slice(0, response.length - 2);
      }

      return {
        signature,
        return_code: returnCode,
      };
    });
  }
}
