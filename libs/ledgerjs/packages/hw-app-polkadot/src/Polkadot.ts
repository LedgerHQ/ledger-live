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
import { UserRefusedAddress } from "@ledgerhq/errors";
import { PolkadotGenericApp } from "@zondax/ledger-substrate";

const INS = {
  GET_VERSION: 0x00,
  GET_ADDR_ED25519: 0x01,
  SIGN_ED25519: 0x02,
};
const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;

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

  serializePath(path: Array<number>, ss58?: number): Buffer {
    const ss58Provided = ss58 !== undefined;
    const buf = Buffer.alloc(ss58Provided ? 24 : 20);
    buf.writeUInt32LE(path[0], 0);
    buf.writeUInt32LE(path[1], 4);
    buf.writeUInt32LE(path[2], 8);
    buf.writeUInt32LE(path[3], 12);
    buf.writeUInt32LE(path[4], 16);
    if (ss58Provided) {
      buf.writeUInt32LE(ss58, 20);
    }
    return buf;
  }

  /**
   * @param {string} path
   * @param {number} ss58prefix
   * @param {boolean} showAddrInDevice - if true, user must valid if the address is correct on the device
   */
  async getAddress(
    path: string,
    ss58prefix: number = 0,
    showAddrInDevice = false,
  ): Promise<{
    pubKey: string;
    address: string;
    return_code: number;
  }> {
    const CLA = 0xf9;
    const bipPath = BIPPath.fromString(path).toPathArray();
    const bip44Path = this.serializePath(bipPath, ss58prefix);
    return this.transport
      .send(CLA, INS.GET_ADDR_ED25519, showAddrInDevice ? 1 : 0, 0, bip44Path, [SW_OK, SW_CANCEL])
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
    message: Uint8Array,
    metadata: string,
  ): Promise<{
    signature: string | null;
    return_code: number;
  }> {
    const app = new PolkadotGenericApp(this.transport);
    const signatureRequest = await app.signWithMetadata(
      "m/" + path,
      Buffer.from(message),
      Buffer.from(metadata.slice(2), "hex"),
    );
    // we need to cast the signature to Buffer explicitly. In react native, the signature from signWithMetadata is not necessarily a Buffer
    signatureRequest.signature = Buffer.from(signatureRequest.signature);
    return {
      signature: signatureRequest.signature.toString("hex"),
      return_code: SW_OK,
    };
  }
}
