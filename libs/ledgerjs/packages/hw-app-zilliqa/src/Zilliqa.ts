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
import { UserRefusedOnDevice } from "@ledgerhq/errors";
const CHUNK_SIZE = 16;

const CLA = 0xe0;
const APP_KEY = "ZIL";

const INS_GET_VERSION = 0x01;
const INS_GET_PUBLIC_KEY = 0x02;
const INS_SIGN_TXN = 0x04;
const INS_SIGN_HASH = 0x08;

const ADDRESS_ZIL_NATIVE = 0x00;
const P2_DISPLAY_NONE = 0x02;

const HARDEN_CONSTANT = 0x80000000;

const SW_CANCEL = 0x6985;
const SW_OK = 0x9000;

const FEATURE_NO_DISPLAY = 0x1;
const FEATURE_BIP44 = 0x2;

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
    const result = await this.transport.send(
      cla,
      ins,
      p1,
      p2,
      data,
      statusList
    );
    return result;
  }
  async getAppConfigurationInternal(): Promise<{
    version: string;
    major: number;
    minor: number;
    patch: number;
    protocolFeatures: number;
  }> {
    const response = await this.send(CLA, INS_GET_VERSION, 0, 0);
    const ret = {
      version: "" + response[0] + "." + response[1] + "." + response[2],
      major: response[0],
      minor: response[1],
      patch: response[2],
      protocolFeatures:
        response[0] > 0
          ? FEATURE_BIP44 | FEATURE_NO_DISPLAY
          : response[1] > 4
          ? FEATURE_NO_DISPLAY
          : 0,
    };

    return ret;
  }

  async getAppConfiguration(): Promise<{
    version: string;
    major: number;
    minor: number;
    patch: number;
    protocolFeatures: number;
  }> {
    return this.getAppConfigurationInternal();
  }

  async getPathParametersFromPath(path: string): Promise<{
    account: number;
    change: number;
    index: number;
    protocolFeatures: number;
  }> {
    // Test with: pnpm build:cli getAddress --currency zilliqa --path "44'/313'/0'/1'/0'" --derivationMode "zilliqaL"
    // pnpm build:cli signMessage --currency zilliqa --path "44'/313'/0'/1'/0'" --message "hello world"
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
    const data = await this.getAppConfigurationInternal();
    //const data = await this.getAppConfiguration();
    const { protocolFeatures } = data;

    const bip44_support = (protocolFeatures & FEATURE_BIP44) != 0;

    // If no BIP44 support avaible ...
    if (!bip44_support) {
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

    return {
      account,
      change,
      index,
      protocolFeatures,
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
    path: string,
    verify?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    // Getting path parameters
    const { account, change, index, protocolFeatures } =
      await this.getPathParametersFromPath(path);
    // Preparing payload to send to the wallet app.

    const bip44_support = (protocolFeatures & FEATURE_BIP44) != 0;
    const payload = Buffer.alloc(bip44_support ? 12 : 4);
    payload.writeUInt32LE(account, 0);
    if (bip44_support) {
      payload.writeUInt32LE(change, 4);
      payload.writeUInt32LE(index, 8);
    }

    let p2 = 0x0;
    if (!verify && (protocolFeatures & FEATURE_NO_DISPLAY) != 0) {
      p2 = P2_DISPLAY_NONE;
    }

    // Sending request for key
    const response = await this.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      ADDRESS_ZIL_NATIVE,
      p2,
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
  ): Promise<{ signature: null | string; returnCode: number }> {
    // Getting path parameters
    const { account, change, index, protocolFeatures } =
      await this.getPathParametersFromPath(path);

    // If we are using the full protocol, we add change and index
    // as well to the parameters. Note that this is unfortunately not backward compatible.
    const bip44_support = (protocolFeatures & FEATURE_BIP44) != 0;
    const params: number[] = bip44_support
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

    let signature: string | null = null;
    if (response.length > 2) {
      signature = response.slice(0, response.length - 2).toString("hex");
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
  ): Promise<{ signature: null | string; returnCode: number }> {
    // Getting path parameters
    const { account, change, index, protocolFeatures } =
      await this.getPathParametersFromPath(path);

    const bip44_support = (protocolFeatures & FEATURE_BIP44) != 0;
    const params = Buffer.alloc(bip44_support ? 12 : 4);
    params.writeUInt32LE(account, 0);

    // If we are using the BIP 44 support, we add change and index
    // as well to the parameters. Note that this is unfortunately not backward compatible.
    if (bip44_support) {
      params.writeUInt32LE(change, 4);
      params.writeUInt32LE(index, 8);
    }

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

    let signature: string | null = null;
    if (response.length > 2) {
      signature = response.slice(0, response.length - 2).toString("hex");
    }

    return {
      signature,
      returnCode,
    };
  }
}
