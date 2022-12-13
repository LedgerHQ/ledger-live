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
const CHUNK_SIZE = 16;

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
      ["getAddress", "getAppConfiguration", "signTransaction", "signMessage"],
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
    const input = Buffer.concat([
      Buffer.from([cla, ins, p1, p2]),
      Buffer.from([data.length]),
      data,
    ]);

    // console.log(`=> ${input.toString("hex")}`);

    const result = await this.transport.send(
      cla,
      ins,
      p1,
      p2,
      data,
      statusList
    );

    // console.log(`<= ${result.toString("hex")}`);
    return result;
  }

  getAppConfiguration(): Promise<{
    version: string;
    major: number;
    minor: number;
    patch: number;
    fullProtocol: boolean;
  }> {
    return this.send(CLA, INS_GET_VERSION, 0, 0).then((response) => {
      return {
        version: "" + response[0] + "." + response[1] + "." + response[2],
        major: response[0],
        minor: response[1],
        patch: response[2],
        fullProtocol: response[0] > 0 || response[1] >= 5,
      };
    });
  }

  async getPathParametersFromPath(
    path: string
  ): Promise<{
    account: number;
    change: number;
    index: number;
    fullProtocol: boolean;
  }> {
    // Test with: pnpm build:cli getAddress --currency zilliqa --path "44'/313'/0'/1'/0'" --derivationMode "zilliqaL"
    // pnpm build:cli signMessage --currency zilliqa --path "44'/313'/0'/1'/0'" --message "hello world"
    // Validating that initial part of the path is hardened and starts
    // with `44'/313'/n'`.
    console.log("Accessing ", path);
    const pathParts = path.split("/");
    if (pathParts.length !== 5) {
      throw Error("Only valid BIP44 paths are supported. Path: " + path);
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
    const fullProtocol = version[0] > 0 || version[1] >= 5;

    // If less than version 0.5 ...
    if (!fullProtocol) {
      // ... impose stricter requirements on what we can accept
      // for paths. We only accept paths of the form `44'/313'/n'/0'/0'`.
      // By forcing the correct input, we ensure that wallets will be forward
      // comaptible.
      if (index !== HARDEN_CONSTANT) {
        throw new Error(
          "Path 'index' must be hardended and equal to zero for versions below v 0.5. Path: " +
            path
        );
      }

      if (change !== HARDEN_CONSTANT) {
        throw new Error(
          "Path 'change' must be hardended and equal to zero for versions below v 0.5. Path: " +
            path
        );
      }
    }

    return {
      account,
      change,
      index,
      fullProtocol,
    };
  }

  /**
   * get Zilliqa address for a given BIP 32 path.
   * @param path a path in BIP 32 format
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
    // Getting path parameters
    const { account, change, index } = await this.getPathParametersFromPath(
      path
    );

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

  /**
   * Sign a Zilliqa transaction with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param message a raw hex string representing a serialized transaction.
   * @return an object with signature and returnCode
   */
  async signTransaction(
    path: string,
    message: string
  ): Promise<{ signature: null | Buffer; returnCode: number }> {
    // Getting path parameters
    const {
      account,
      change,
      index,
      fullProtocol,
    } = await this.getPathParametersFromPath(path);

    // If we are using the full protocol, we add change and index
    // as well to the parameters. Note that this is unfortunately not backward compatible.
    const params: number[] = fullProtocol
      ? [account, change, index]
      : [account];

    const numbersToUInt32LE = (arr: number[]): Buffer => {
      const ret = Buffer.alloc(arr.length * 4);
      for (let i = 0; i < arr.length; ++i) {
        ret.writeUInt32LE(arr[i], 4 * i);
      }
      return ret;
    };

    // Chopping data
    const data = Buffer.from(message, "hex");
    const chunks: Buffer[] = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;

      if (i > data.length) {
        end = data.length;
      }

      chunks.push(data.slice(i, end));
    }

    // Sending transaction in chunks
    let response: Buffer | null = null;
    let bytesLeft = data.length;
    for (let i = 0; i < chunks.length; ++i) {
      const data = chunks[i];
      bytesLeft -= data.length;

      const preamble = i === 0 ? params : [];
      preamble.push(bytesLeft, data.length);
      const payload = Buffer.concat([numbersToUInt32LE(preamble), data]);

      response = await this.send(CLA, INS_SIGN_TXN, 0x0, 0x0, payload, [
        SW_OK,
        SW_CANCEL,
      ]);
    }

    if (response === null) {
      throw new Error("No data sent.");
    }

    const errorCodeData = response.slice(-2);
    const returnCode = errorCodeData[0] * 0x100 + errorCodeData[1];

    if (returnCode === SW_CANCEL) {
      throw new UserRefusedOnDevice();
    }

    let signature: Buffer | null = null;
    if (response.length > 2) {
      signature = response.slice(0, response.length - 2);
    }

    return {
      signature,
      returnCode,
    };
  }

  /**
   * Signs a message with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param message a raw hex string representing a serialized transaction.
   * @return an object with signature and returnCode
   */
  async signMessage(
    path: string,
    message: string
  ): Promise<{ signature: null | Buffer; returnCode: number }> {
    // Getting path parameters
    const {
      account,
      change,
      index,
      fullProtocol,
    } = await this.getPathParametersFromPath(path);

    const params = Buffer.alloc(fullProtocol ? 12 : 4);
    params.writeUInt32LE(account, 0);

    // If we are using the full protocol, we add change and index
    // as well to the parameters. Note that this is unfortunately not backward compatible.
    if (fullProtocol) {
      // TOOD: Untested
      params.writeUInt32LE(change, 4);
      params.writeUInt32LE(index, 8);
    }

    // TODO: Compute hash here instead of relying on message hash as input?
    const payload = Buffer.from(message, "hex");
    const data = Buffer.concat([params, payload]);

    const response = await this.send(CLA, INS_SIGN_HASH, 0x0, 0x0, data, [
      SW_OK,
      SW_CANCEL,
    ]);

    const errorCodeData = response.slice(-2);
    const returnCode = errorCodeData[0] * 0x100 + errorCodeData[1];

    if (returnCode === SW_CANCEL) {
      throw new UserRefusedOnDevice();
    }

    let signature: Buffer | null = null;
    if (response.length > 2) {
      signature = response.slice(0, response.length - 2);
    }

    return {
      signature,
      returnCode,
    };
  }
}
