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
import { PublicKey } from "near-api-js/lib/utils";
import { KeyType } from "near-api-js/lib/utils/key_pair";
import { bip32PathToBytes } from "./utils";

// 128 - 5 service bytes
const CHUNK_SIZE = 123;
const CLA = 0x80;
const INS_GET_PUBLIC_KEY = 4;
const INS_GET_ADDRESS = 5;
const INS_SIGN = 2;
const P1_LAST_CHUNK = 0x80;
const NETWORK_ID = "W".charCodeAt(0);

/**
 * NEAR API
 *
 * @example
 * import Near from "@ledgerhq/hw-app-near";
 * const near = new Near(transport)
 */

export default class Near {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["getPublicKey", "getAddress", "sign"],
      "NEAR"
    );
  }

  /**
   * @param path
   * @option verify - if true, user must verify if the address is correct on the device
   * @return an object with a publicKey and address
   * @example
   * near.getAddress("44'/397'/0'/0'/0'", true).then(o => o.address)
   */
  async getAddress(
    path: string,
    verify?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const client = await createClient(this.transport);

    if (verify) {
      await client.getAddress(path);
    }

    const rawPublicKey = await client.getPublicKey(path, false);

    const publicKey = new PublicKey({
      keyType: KeyType.ED25519,
      data: rawPublicKey,
    });

    return {
      address: rawPublicKey.toString("hex"),
      publicKey: publicKey.toString(),
    };
  }

  /**
   * @param transaction
   * @param path
   * @return a signature to be broadcasted to the chain
   */
  async signTransaction(
    transaction: Uint8Array,
    path: string
  ): Promise<Buffer | undefined> {
    const client = await createClient(this.transport);
    const signature = await client.sign(transaction, path);

    return signature;
  }
}

async function createClient(transport) {
  return {
    transport,
    async getPublicKey(path, verify) {
      const response = await this.transport.send(
        CLA,
        INS_GET_PUBLIC_KEY,
        verify ? 0 : 1,
        NETWORK_ID,
        bip32PathToBytes(path)
      );
      return Buffer.from(response.subarray(0, -2));
    },
    async getAddress(path) {
      const response = await this.transport.send(
        CLA,
        INS_GET_ADDRESS,
        0,
        NETWORK_ID,
        bip32PathToBytes(path)
      );
      return Buffer.from(response.subarray(0, -2));
    },
    async sign(transactionData, path) {
      transactionData = Buffer.from(transactionData);
      const allData = Buffer.concat([bip32PathToBytes(path), transactionData]);
      for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
        const chunk = Buffer.from(
          allData.subarray(offset, offset + CHUNK_SIZE)
        );
        const isLastChunk = offset + CHUNK_SIZE >= allData.length;
        const response = await this.transport.send(
          CLA,
          INS_SIGN,
          isLastChunk ? P1_LAST_CHUNK : 0,
          NETWORK_ID,
          chunk
        );
        if (isLastChunk) {
          return Buffer.from(response.subarray(0, -2));
        }
      }
    },
  };
}
