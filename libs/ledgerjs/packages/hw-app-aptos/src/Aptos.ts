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

import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/errors";
import { bip32asBuffer } from "@ledgerhq/coin-framework/bridge/jsHelpers";

const MAX_APDU_LEN = 255;
const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;
const P1_START = 0x00;
const P2_MORE = 0x80;
const P2_LAST = 0x00;

const LEDGER_CLA = 0x5b;
const INS = {
  GET_VERSION: 0x03,
  GET_PUBLIC_KEY: 0x05,
  SIGN_TX: 0x06,
};

interface AppConfig {
  version: string;
}

export interface AddressData {
  publicKey: Buffer;
  chainCode: Buffer;
  address: string;
}

/**
 * Aptos API
 *
 * @example
 * import Transport from "@ledgerhq/hw-transport";
 * import Aptos from "@ledgerhq/hw-app-aptos";
 *
 * function establishConnection() {
 *     return Transport.create()
 *         .then(transport => new Aptos(transport));
 * }
 *
 * function fetchAddress(aptosClient) {
 *     return aptosClient.getAddress("44'/144'/0'/0/0");
 * }
 *
 * function signTransaction(aptosClient, deviceData, seqNo, buffer) { *
 *     const transactionBlob = encode(buffer);
 *
 *     console.log('Sending transaction to device for approval...');
 *     return aptosClient.signTransaction("44'/144'/0'/0/0", transactionBlob);
 * }
 *
 * function prepareAndSign(aptosClient, seqNo) {
 *     return fetchAddress(aptosClient)
 *         .then(deviceData => signTransaction(aptosClient, deviceData, seqNo));
 * }
 *
 * establishConnection()
 *     .then(aptos => prepareAndSign(aptos, 123, payload))
 *     .then(signature => console.log(`Signature: ${signature}`))
 *     .catch(e => console.log(`An error occurred (${e.message})`));
 */
export default class Aptos {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "aptos") {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getVersion", "getAddress"], scrambleKey);
  }

  async getVersion(): Promise<AppConfig> {
    const [major, minor, patch] = await this.sendToDevice(
      INS.GET_VERSION,
      P1_NON_CONFIRM,
      P2_LAST,
      Buffer.alloc(0),
    );
    return {
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * get Aptos address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param display optionally enable or not the display
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * const result = await aptos.getAddress("44'/144'/0'/0/0");
   * const { publicKey, address } = result;
   */
  async getAddress(path: string, display = false): Promise<AddressData> {
    const pathBuffer = bip32asBuffer(path);
    const responseBuffer = await this.sendToDevice(
      INS.GET_PUBLIC_KEY,
      display ? P1_CONFIRM : P1_NON_CONFIRM,
      P2_LAST,
      pathBuffer,
    );

    let offset = 1;
    const pubKeyLen = responseBuffer.subarray(0, offset)[0] - 1;
    const pubKeyBuffer = responseBuffer.subarray(++offset, (offset += pubKeyLen));
    const chainCodeLen = responseBuffer.subarray(offset, ++offset)[0];
    const chainCodeBuffer = responseBuffer.subarray(offset, offset + chainCodeLen);

    const address = "0x" + this.publicKeyToAddress(pubKeyBuffer).toString("hex");

    return {
      publicKey: pubKeyBuffer,
      chainCode: chainCodeBuffer,
      address,
    };
  }

  /**
   * sign a Aptos transaction with a given BIP 32 path
   *
   *
   * @param path a path in BIP 32 format
   * @param txBuffer the buffer to be signed for transaction
   * @return a signature as hex string
   * @example
   * const signature = await aptos.signTransaction("44'/144'/0'/0/0", "12000022800000002400000002614000000001315D3468400000000000000C73210324E5F600B52BB3D9246D49C4AB1722BA7F32B7A3E4F9F2B8A1A28B9118CC36C48114F31B152151B6F42C1D61FE4139D34B424C8647D183142ECFC1831F6E979C6DA907E88B1CAD602DB59E2F");
   */
  async signTransaction(path: string, txBuffer: Buffer): Promise<{ signature: Buffer }> {
    const pathBuffer = bip32asBuffer(path);
    await this.sendToDevice(INS.SIGN_TX, P1_START, P2_MORE, pathBuffer);
    const responseBuffer = await this.sendToDevice(INS.SIGN_TX, 1, P2_LAST, txBuffer);

    const signatureLen = responseBuffer[0];
    const signatureBuffer = responseBuffer.subarray(1, 1 + signatureLen);
    return { signature: signatureBuffer };
  }

  // send chunked if payload size exceeds maximum for a call
  private async sendToDevice(
    instruction: number,
    p1: number,
    p2: number,
    payload: Buffer,
  ): Promise<Buffer> {
    const acceptStatusList = [StatusCodes.OK];
    let payloadOffset = 0;

    if (payload.length > MAX_APDU_LEN) {
      while (payload.length - payloadOffset > MAX_APDU_LEN) {
        const buf = payload.subarray(payloadOffset, (payloadOffset += MAX_APDU_LEN));
        const reply = await this.transport.send(
          LEDGER_CLA,
          instruction,
          p1++,
          P2_MORE,
          buf,
          acceptStatusList,
        );
        this.throwOnFailure(reply);
      }
    }

    const buf = payload.subarray(payloadOffset);
    const reply = await this.transport.send(LEDGER_CLA, instruction, p1, p2, buf, acceptStatusList);
    this.throwOnFailure(reply);

    return reply.subarray(0, reply.length - 2);
  }

  private publicKeyToAddress(pubKey: Buffer): Buffer {
    const hash = sha3Hash.create();
    hash.update(pubKey);
    hash.update("\x00");
    return Buffer.from(hash.digest());
  }

  private throwOnFailure(reply: Buffer): void {
    // transport makes sure reply has a valid length
    const status = reply.readUInt16BE(reply.length - 2);
    if (status !== StatusCodes.OK) {
      throw new Error(`Failure with status code: 0x${status.toString(16)}`);
    }
  }
}
