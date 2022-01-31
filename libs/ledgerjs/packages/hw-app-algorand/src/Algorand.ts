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
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { encodeAddress } from "./utils";
const CHUNK_SIZE = 250;
// const P1_FIRST = 0x00;
const P1_MORE = 0x80;
const P1_WITH_ACCOUNT_ID = 0x01;
const P2_LAST = 0x00;
const P2_MORE = 0x80;
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;
const P1_WITH_REQUEST_USER_APPROVAL = 0x80;
// algo spec
const CLA = 0x80;
const INS_GET_PUBLIC_KEY = 0x03;
const INS_SIGN_MSGPACK = 0x08;
/**
 * Algorand API
 *
 * @example
 * import Algorand from "@ledgerhq/hw-app-algorand";
 * const algo = new Algorand(transport)
 */

export default class Algorand {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "sign"], "ALGO");
  }

  /**
   * get Algorant address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * cosmos.getAddress("44'/283'/0'/0/0").then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(bipPath[2], 0);
    return this.transport
      .send(
        CLA,
        INS_GET_PUBLIC_KEY,
        boolDisplay ? P1_WITH_REQUEST_USER_APPROVAL : 0,
        0,
        buf,
        [SW_OK]
      )
      .then((response) => {
        const buffer = Buffer.from(response.slice(0, 32));
        const publicKey = buffer.toString("hex");
        const address = encodeAddress(buffer);
        return {
          publicKey,
          address,
        };
      });
  }

  foreach<T, A>(
    arr: T[],
    callback: (arg0: T, arg1: number) => Promise<A>
  ): Promise<A[]> {
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

  async sign(
    path: string,
    message: string
  ): Promise<{
    signature: null | Buffer;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(bipPath[2], 0);
    const chunks: Buffer[] = [];
    const buffer = Buffer.concat([buf, Buffer.from(message, "hex")]);

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
          INS_SIGN_MSGPACK,
          j === 0 ? P1_WITH_ACCOUNT_ID : P1_MORE,
          j + 1 === chunks.length ? P2_LAST : P2_MORE,
          data,
          [SW_OK, SW_CANCEL]
        )
        .then((apduResponse) => (response = apduResponse))
    ).then(() => {
      const errorCodeData = response;

      if (errorCodeData === 0x6986) {
        throw new UserRefusedOnDevice();
      }

      let signature = null;

      if (response.length > 0) {
        signature = response.slice(0, response.length);
      }

      return {
        signature: signature,
      };
    });
  }
}
