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
const CHUNK_SIZE = 250;
const CLA = 0x55;
const APP_KEY = "CSM";
const INS_GET_VERSION = 0x00;
const INS_SIGN_SECP256K1 = 0x02;
const INS_GET_ADDR_SECP256K1 = 0x04;
const PAYLOAD_TYPE_INIT = 0x00;
const PAYLOAD_TYPE_ADD = 0x01;
const PAYLOAD_TYPE_LAST = 0x02;
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;
/**
 * Cosmos API
 *
 * @example
 * import Cosmos from "@ledgerhq/hw-app-cosmos";
 * const cosmos = new Cosmos(transport)
 */

export default class Cosmos {
  transport: Transport;

  constructor(transport: Transport, scrambleKey: string = APP_KEY) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["getAddress", "sign", "getAppConfiguration"],
      scrambleKey
    );
  }

  // FIXME: understand what is going on with the return type here
  getAppConfiguration(): Promise<{
    test_mode: boolean;
    version: string;
    device_locked: boolean;
    major: number;
  }> {
    return this.transport.send(CLA, INS_GET_VERSION, 0, 0).then((response) => {
      return {
        test_mode: response[0] !== 0,
        version: "" + response[1] + "." + response[2] + "." + response[3],
        device_locked: response[4] === 1,
        major: response[1],
      };
    });
  }

  serializePath(path: Buffer): Buffer {
    const buf = Buffer.alloc(20);
    // HACK : without the >>>,
    // the bitwise implicitly casts the result to be a signed int32,
    // which fails the internal type check of Buffer in case of overload.
    buf.writeUInt32LE((0x80000000 | path[0]) >>> 0, 0);
    buf.writeUInt32LE((0x80000000 | path[1]) >>> 0, 4);
    buf.writeUInt32LE((0x80000000 | path[2]) >>> 0, 8);
    buf.writeUInt32LE(path[3], 12);
    buf.writeUInt32LE(path[4], 16);
    return buf;
  }

  serializeHRP(hrp: string): Buffer {
    if (hrp == null || hrp.length < 3 || hrp.length > 83) {
      throw new Error("Invalid HRP");
    }

    const buf = Buffer.alloc(1 + hrp.length);
    buf.writeUInt8(hrp.length, 0);
    buf.write(hrp, 1);
    return buf;
  }

  /**
   * get Cosmos address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @param hrp usually cosmos
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * cosmos.getAddress("44'/60'/0'/0/0", "cosmos").then(o => o.address)
   */
  getAddress(
    path: string,
    hrp: string,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);
    const data = Buffer.concat([this.serializeHRP(hrp), serializedPath]);
    return this.transport
      .send(CLA, INS_GET_ADDR_SECP256K1, boolDisplay ? 1 : 0, 0, data, [SW_OK])
      .then((response) => {
        const address = Buffer.from(response.slice(33, -2)).toString();
        const publicKey = Buffer.from(response.slice(0, 33)).toString("hex");
        return {
          address,
          publicKey,
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
    return_code: number | string;
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
          INS_SIGN_SECP256K1,
          j === 0
            ? PAYLOAD_TYPE_INIT
            : j + 1 === chunks.length
            ? PAYLOAD_TYPE_LAST
            : PAYLOAD_TYPE_ADD,
          0,
          data,
          [SW_OK, SW_CANCEL]
        )
        .then((apduResponse) => (response = apduResponse))
    ).then(() => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
      let signature: Buffer | null = null;

      if (response.length > 2) {
        signature = response.slice(0, response.length - 2);
      }

      if (returnCode === 0x6986) {
        throw new UserRefusedOnDevice();
      }

      return {
        signature,
        return_code: returnCode,
      };
    });
  }
}
