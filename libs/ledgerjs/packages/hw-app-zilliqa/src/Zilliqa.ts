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

const CLA = 0xe0;
const APP_KEY = "ZIL";

const PAYLOAD_TYPE_INIT = 0x00;
const PAYLOAD_TYPE_ADD = 0x00;
const PAYLOAD_TYPE_LAST = 0x00;

const INS_GET_VERSION = 0x01;
const INS_GET_PUBLIC_KEY = 0x02;
const INS_SIGN_TXN = 0x04;
const INS_SIGN_HASH = 0x08;

const ADDRESS_ZIL_NATIVE = 0x00;

const HARDEN_CONSTANT = 0x80000000;

const SW_DEVELOPER_ERR = 0x6b00;
const SW_INVALID_PARAM = 0x6b01;
const SW_IMPROPER_INIT = 0x6b02;
const SW_CANCEL = 0x6985;
const SW_OK = 0x9000;

/**
 * Zilliqa API
 *
 * @example
 * import Zilliqa from "@ledgerhq/hw-app-zilliqa";
 * const zilliqa = new Zilliqa(transport)
 */

export default class Zilliqa {
  transport: Transport;

  constructor(transport: Transport, scrambleKey: string = APP_KEY) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["getAddress"], //, "sign", "getAppConfiguration"],
      scrambleKey
    );
  }

  async send(
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer = Buffer.alloc(0),
    statusList: Array<number> = [SW_OK]
  ): Promise<Buffer> {
    let input = Buffer.concat([
      Buffer.from([cla, ins, p1, p2]),
      Buffer.from([data.length]),
      data,
    ]);

    console.log(`=> ${input.toString("hex")}`);

    const result = await this.transport.send(
      cla,
      ins,
      p1,
      p2,
      data,
      statusList
    );

    console.log(`<= ${result.toString("hex")}`);
    return result;
  }

  // FIXME: understand what is going on with the return type here
  getAppConfiguration(): Promise<{
    version: string;
    major: number;
    minor: number;
    patch: number;
  }> {
    return this.send(CLA, INS_GET_VERSION, 0, 0).then((response) => {
      return {
        version: "" + response[0] + "." + response[1] + "." + response[2],
        major: response[0],
        minor: response[1],
        patch: response[2],
      };
    });
  }

  /**
   * get Zilliqa address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @param hrp usually zilliqa
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * zilliqa.getAddress("44'/313'/0'/0/0", "zilliqa").then(o => o.address)
   */
  async getAddress(
    path: string
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    // Validating that initial part of the path is hardened and starts
    // with `44'/313'/n'`.
    const pathParts = path.split("/");
    if (pathParts.length !== 5) {
      throw Error("Only valid BIP44 paths are supported.");
    }

    const [purposeStr, coinStr, accountStr, changeStr, indexStr] = pathParts;
    if (purposeStr !== "44'") {
      throw Error("Only wallets with hardened purpose 44 are supported.");
    }

    if (coinStr !== "313'") {
      throw Error("Only coin 313' is supported.");
    }

    if (!accountStr.endsWith("'")) {
      throw Error(
        "Wallet does not allow softened accounts. Please harden by adding '."
      );
    }

    // Extracting
    const account =
      (HARDEN_CONSTANT |
        parseInt(accountStr.substring(0, accountStr.length - 1))) >>>
      0;

    // Extracting change and index to pack into the payload
    let change = 0;
    let index = 0;
    if (changeStr.endsWith("'")) {
      change =
        (HARDEN_CONSTANT |
          parseInt(changeStr.substring(0, changeStr.length - 1))) >>>
        0;
    } else {
      change = parseInt(changeStr);
    }

    if (indexStr.endsWith("'")) {
      index =
        (HARDEN_CONSTANT |
          parseInt(indexStr.substring(0, indexStr.length - 1))) >>>
        0;
    } else {
      index = parseInt(indexStr);
    }

    // Version specific requirements
    const version = await this.send(CLA, INS_GET_VERSION, 0, 0);

    // If less than version 0.5 ...
    if (version[0] === 0 && version[1] < 5) {
      // ... impose stricter requirements on what we can accept
      // for paths. We only accept paths of the form `44'/313'/n'/0'/0'`.
      // By forcing the correct input, we ensure that wallets will be forward
      // comaptible.
      if (index !== HARDEN_CONSTANT) {
        throw new Error("Path 'index' must be hardended and equal to zero");
      }

      if (change !== HARDEN_CONSTANT) {
        throw new Error("Path 'change' must be hardended and equal to zero");
      }
    }

    // Preparing payload to send to the wallet app.
    const payload = Buffer.alloc(12);
    payload.writeUInt32LE(account, 0);
    payload.writeUInt32LE(change, 4);
    payload.writeUInt32LE(index, 8);

    // Sending request for key
    const response = await this.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      ADDRESS_ZIL_NATIVE,
      0x0,
      payload,
      [SW_OK]
    );
    const address = Buffer.from(response.slice(33, -2)).toString();
    const publicKey = Buffer.from(response.slice(0, 33)).toString("hex");
    return {
      address,
      publicKey,
    };
  }

  /*a
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
          INS_SIGN_TXN,
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
  */
}
