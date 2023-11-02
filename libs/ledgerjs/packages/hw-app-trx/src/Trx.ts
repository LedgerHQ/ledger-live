/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
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
// FIXME drop:
import { splitPath, foreach, decodeVarint } from "./utils";
import type Transport from "@ledgerhq/hw-transport";

const remapTransactionRelatedErrors = e => {
  if (e && e.statusCode === 0x6a80) {
    // TODO:
  }

  return e;
};

const PATH_SIZE = 4;
const PATHS_LENGTH_SIZE = 1;
const CLA = 0xe0;
const ADDRESS = 0x02;
const SIGN = 0x04;
const SIGN_HASH = 0x05;
const SIGN_MESSAGE = 0x08;
const ECDH_SECRET = 0x0a;
const VERSION = 0x06;
const CHUNK_SIZE = 250;
/**
 * Tron API
 *
 * @example
 * import Trx from "@ledgerhq/hw-app-trx";
 * const trx = new Trx(transport)
 */

export default class Trx {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "TRX") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "getECDHPairKey",
        "signTransaction",
        "signTransactionHash",
        "signPersonalMessage",
        "getAppConfiguration",
      ],
      scrambleKey,
    );
  }

  /**
   * get Tron address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey and address
   * @example
   * const address = await tron.getAddress("44'/195'/0'/0/0").then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay?: boolean,
  ): Promise<{
    publicKey: string;
    address: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(PATHS_LENGTH_SIZE + paths.length * PATH_SIZE);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(CLA, ADDRESS, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then(response => {
        const publicKeyLength = response[0];
        const addressLength = response[1 + publicKeyLength];

        return {
          publicKey: response.slice(1, 1 + publicKeyLength).toString("hex"),
          address: response
            .slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength)
            .toString("ascii"),
        };
      });
  }

  getNextLength(tx: Buffer): number {
    const field = decodeVarint(tx, 0);
    const data = decodeVarint(tx, field.pos);
    if ((field.value & 0x07) === 0) return data.pos;
    return data.value + data.pos;
  }

  /**
   * sign a Tron transaction with a given BIP 32 path and Token Names
   *
   * @param path a path in BIP 32 format
   * @param rawTxHex a raw transaction hex string
   * @param tokenSignatures Tokens Signatures array
   * @option version pack message based on ledger firmware version
   * @option smartContract boolean hack to set limit buffer on ledger device
   * @return a signature as hex string
   * @example
   * const signature = await tron.signTransaction("44'/195'/0'/0/0", "0a02f5942208704dda506d59dceb40f0f4978f802e5a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a1541978dbd103cfe59c35e753d09dd44ae1ae64621c7121541e2ae49db6a70b9b4757d2137a43b69b24a445780188ef8b5ba0470cbb5948f802e", [], 105);
   */
  signTransaction(path: string, rawTxHex: string, tokenSignatures: string[]): Promise<string> {
    const paths = splitPath(path);
    let rawTx = Buffer.from(rawTxHex, "hex");
    const toSend: Buffer[] = [];
    let data = Buffer.alloc(PATHS_LENGTH_SIZE + paths.length * PATH_SIZE);
    // write path for first chuck only
    data[0] = paths.length;
    paths.forEach((element, index) => {
      data.writeUInt32BE(element, 1 + 4 * index);
    });

    while (rawTx.length > 0) {
      // get next message field
      const newpos = this.getNextLength(rawTx);
      if (newpos > CHUNK_SIZE) throw new Error("Too many bytes to encode.");

      if (data.length + newpos > CHUNK_SIZE) {
        toSend.push(data);
        data = Buffer.alloc(0);
        continue;
      }

      // append data
      data = Buffer.concat([data, rawTx.slice(0, newpos)]);
      rawTx = rawTx.slice(newpos, rawTx.length);
    }

    toSend.push(data);
    const startBytes: number[] = [];
    let response;
    const tokenPos = toSend.length;

    if (tokenSignatures !== undefined) {
      for (let i = 0; i < tokenSignatures.length; i += 1) {
        const buffer = Buffer.from(tokenSignatures[i], "hex");
        toSend.push(buffer);
      }
    }

    // get startBytes
    if (toSend.length === 1) {
      startBytes.push(0x10);
    } else {
      startBytes.push(0x00);

      for (let i = 1; i < toSend.length - 1; i += 1) {
        if (i >= tokenPos) {
          startBytes.push(0xa0 | 0x00 | (i - tokenPos)); // eslint-disable-line no-bitwise
        } else {
          startBytes.push(0x80);
        }
      }

      if (tokenSignatures !== undefined && tokenSignatures.length) {
        startBytes.push(0xa0 | 0x08 | (tokenSignatures.length - 1)); // eslint-disable-line no-bitwise
      } else {
        startBytes.push(0x90);
      }
    }

    return foreach(toSend, (data, i) => {
      return this.transport.send(CLA, SIGN, startBytes[i], 0x00, data).then(apduResponse => {
        response = apduResponse;
      });
    }).then(
      () => {
        return response.slice(0, 65).toString("hex");
      },
      e => {
        throw remapTransactionRelatedErrors(e);
      },
    );
  }

  /**
   * sign a Tron transaction hash with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param rawTxHex a raw transaction hex string
   * @return a signature as hex string
   * @example
   * const signature = await tron.signTransactionHash("44'/195'/0'/0/0", "25b18a55f86afb10e7aca38d0073d04c80397c6636069193953fdefaea0b8369");
   */
  signTransactionHash(path: string, rawTxHashHex: string): Promise<string> {
    const paths = splitPath(path);
    let data = Buffer.alloc(PATHS_LENGTH_SIZE + paths.length * PATH_SIZE);
    data[0] = paths.length;
    paths.forEach((element, index) => {
      data.writeUInt32BE(element, 1 + 4 * index);
    });
    data = Buffer.concat([data, Buffer.from(rawTxHashHex, "hex")]);
    return this.transport.send(CLA, SIGN_HASH, 0x00, 0x00, data).then(response => {
      return response.slice(0, 65).toString("hex");
    });
  }

  /**
   * get the version of the Tron app installed on the hardware device
   *
   * @return an object with a version
   * @example
   * const result = await tron.getAppConfiguration();
   * {
   *   "version": "0.1.5",
   *   "versionN": "105".
   *   "allowData": false,
   *   "allowContract": false,
   *   "truncateAddress": false,
   *   "signByHash": false
   * }
   */
  getAppConfiguration(): Promise<{
    allowContract: boolean;
    truncateAddress: boolean;
    allowData: boolean;
    signByHash: boolean;
    version: string;
    versionN: number;
  }> {
    return this.transport.send(CLA, VERSION, 0x00, 0x00).then(response => {
      // eslint-disable-next-line no-bitwise
      const signByHash = (response[0] & (1 << 3)) > 0;
      // eslint-disable-next-line no-bitwise
      let truncateAddress = (response[0] & (1 << 2)) > 0;
      // eslint-disable-next-line no-bitwise
      let allowContract = (response[0] & (1 << 1)) > 0;
      // eslint-disable-next-line no-bitwise
      let allowData = (response[0] & (1 << 0)) > 0;

      if (response[1] === 0 && response[2] === 1 && response[3] < 2) {
        allowData = true;
        allowContract = false;
      }

      if (response[1] === 0 && response[2] === 1 && response[3] < 5) {
        truncateAddress = false;
      }

      const result = {
        version: `${response[1]}.${response[2]}.${response[3]}`,
        versionN: response[1] * 10000 + response[2] * 100 + response[3],
        allowData,
        allowContract,
        truncateAddress,
        signByHash,
      };
      return result;
    });
  }

  /**
   * sign a Tron Message with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param message hex string to sign
   * @return a signature as hex string
   * @example
   * const signature = await tron.signPersonalMessage("44'/195'/0'/0/0", "43727970746f436861696e2d54726f6e5352204c6564676572205472616e73616374696f6e73205465737473");
   */
  signPersonalMessage(path: string, messageHex: string): Promise<string> {
    const paths = splitPath(path);
    const message = Buffer.from(messageHex, "hex");
    let offset = 0;
    const toSend: Buffer[] = [];
    const size = message.length.toString(16);
    const sizePack = "00000000".substr(size.length) + size;
    const packed = Buffer.concat([Buffer.from(sizePack, "hex"), message]);

    while (offset < packed.length) {
      // Use small buffer to be compatible with old and new protocol
      const maxChunkSize = offset === 0 ? CHUNK_SIZE - 1 - paths.length * 4 : CHUNK_SIZE;
      const chunkSize =
        offset + maxChunkSize > packed.length ? packed.length - offset : maxChunkSize;
      const buffer = Buffer.alloc(offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize);

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        packed.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        packed.copy(buffer, 0, offset, offset + chunkSize);
      }

      toSend.push(buffer);
      offset += chunkSize;
    }

    let response;
    return foreach(toSend, (data, i) => {
      return this.transport
        .send(CLA, SIGN_MESSAGE, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then(apduResponse => {
          response = apduResponse;
        });
    }).then(() => {
      return response.slice(0, 65).toString("hex");
    });
  }

  /**
   * get Tron address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @param publicKey address public key to generate pair key
   * @return shared key hex string,
   * @example
   * const signature = await tron.getECDHPairKey("44'/195'/0'/0/0", "04ff21f8e64d3a3c0198edfbb7afdc79be959432e92e2f8a1984bb436a414b8edcec0345aad0c1bf7da04fd036dd7f9f617e30669224283d950fab9dd84831dc83");
   */
  getECDHPairKey(path: string, publicKey: string): Promise<string> {
    const paths = splitPath(path);
    const data = Buffer.from(publicKey, "hex");
    const buffer = Buffer.alloc(1 + paths.length * 4 + data.length);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    data.copy(buffer, 1 + 4 * paths.length, 0, data.length);
    return this.transport
      .send(CLA, ECDH_SECRET, 0x00, 0x01, buffer)
      .then(response => response.slice(0, 65).toString("hex"));
  }
}
