/********************************************************************************
 *   Ledger JS API for ICON
 *   (c) 2018 ICON Foundation
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
//@flow

// FIXME drop:
import { splitPath, foreach, hexToBase64 } from "./utils";
import type Transport from "@ledgerhq/hw-transport";
import { UserRefusedOnDevice, UserRefusedAddress } from "@ledgerhq/errors";

const CLA = 0xe0;
const INS = {
  GET_VERSION: 0x06,
  GET_ADDR: 0x02,
  SIGN: 0x04,
};

const SW_OK = 0x9000;
const SW_CANCEL = 0x6986;

/**
 * ICON API
 *
 * @example
 * import Icx from "@ledgerhq/hw-app-icx";
 * const icx = new Icx(transport)
 */
export default class Icx {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "signTransaction",
        "getAppConfiguration",
        "setTestPrivateKey",
      ],
      "ICON"
    );
  }

  /**
   * Returns public key and ICON address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publickey(hexa string), address(string) and
   *  (optionally) chaincode(hexa string)
   * @example
   * icx.getAddress("44'/4801368'/0'", true, true).then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay = false,
    boolChaincode = true
  ): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    const statusList = [SW_OK, SW_CANCEL];
    return this.transport
      .send(
        CLA,
        INS.GET_ADDR,
        boolDisplay ? 0x01 : 0x00,
        boolChaincode ? 0x01 : 0x00,
        buffer,
        statusList
      )
      .then((response) => {
        const result: any = {};
        const publicKeyLength = response[0];
        result.publicKey = response
          .slice(1, 1 + publicKeyLength)
          .toString("hex");
        const addressLength = response[1 + publicKeyLength];
        result.address = response
          .slice(
            1 + publicKeyLength + 1,
            1 + publicKeyLength + 1 + addressLength
          )
          .toString();
        if (boolChaincode) {
          result.chainCode = response.slice(-32).toString("hex");
        }
        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 0x100 + errorCodeData[1];

        if (returnCode === SW_CANCEL) {
          throw new UserRefusedAddress();
        }
        return result;
      });
  }

  /**
   * Signs a transaction and returns signed message given the raw transaction
   * and the BIP 32 path of the account to sign
   * @param path a path in BIP 32 format
   * @param rawTxAscii raw transaction data to sign in ASCII string format
   * @return an object with a base64 encoded signature and hash in hexa string
   * @example
   * icx.signTransaction("44'/4801368'/0'",
   *     "icx_sendTransaction.fee.0x2386f26fc10000." +
   *     "from.hxc9ecad30b05a0650a337452fce031e0c60eacc3a.nonce.0x3." +
   *     "to.hx4c5101add2caa6a920420cf951f7dd7c7df6ca24.value.0xde0b6b3a7640000")
   *   .then(result => ...)
   */
  signTransaction(
    path: string,
    rawTxAscii: string
  ): Promise<{
    signedRawTxBase64: string;
    hashHex: string;
  }> {
    const paths = splitPath(path);
    let offset = 0;
    const rawTx = Buffer.from(rawTxAscii);
    const toSend: any = [];
    let response;
    while (offset !== rawTx.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      const chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;
      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize
      );
      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(rawTx.length, 1 + 4 * paths.length);
        rawTx.copy(
          buffer,
          1 + 4 * paths.length + 4,
          offset,
          offset + chunkSize
        );
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    return foreach(toSend, (data, i) =>
      this.transport
        .send(CLA, INS.SIGN, i === 0 ? 0x00 : 0x80, 0x00, data, [
          SW_OK,
          SW_CANCEL,
        ])
        .then((apduResponse) => {
          response = apduResponse;
        })
    ).then(() => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 0x100 + errorCodeData[1];
      const result: any = {};

      if (returnCode === SW_CANCEL) {
        throw new UserRefusedOnDevice();
      }
      // r, s, v are aligned sequencially
      result.signedRawTxBase64 = hexToBase64(
        response.slice(0, 32 + 32 + 1).toString("hex")
      );
      result.hashHex = response
        .slice(32 + 32 + 1, 32 + 32 + 1 + 32)
        .toString("hex");
      return result;
    });
  }

  /**
   * Returns the application configurations such as versions.
   * @return  major/minor/patch versions of Icon application
   */
  getAppConfiguration(): Promise<{
    majorVersion: number;
    minorVersion: number;
    patchVersion: number;
  }> {
    return this.transport
      .send(CLA, INS.GET_VERSION, 0x00, 0x00)
      .then((response) => {
        const result: any = {};
        result.majorVersion = response[0];
        result.minorVersion = response[1];
        result.patchVersion = response[2];
        return result;
      });
  }

  /**
   * Sets the given key as the test purpose private key corresponding to
   * "\0'" of BIP 32 path just for test purpose. After calling this function,
   * all functions with "\0'" path works based on this private key.
   * REMARK: Test purpose only such as verifying signTransaction function.
   * @param privateKeyHex private key in hexadecimal string format
   * @example
   * icx.setTestPrivateKey("23498dc21b9ee52e63e8d6566e0911ac255a38d3fcbc68a51e6b298520b72d6e")
   *   .then(result => ...)
   * icx.getAddress("0'", false, false).then(o => o.address)
   */
  setTestPrivateKey(privateKeyHex: string) {
    const data = Buffer.alloc(32);
    for (let i = 0; i < privateKeyHex.length; i += 2) {
      data[i / 2] = parseInt(privateKeyHex.substr(i, 2), 16);
    }
    return this.transport.send(0xe0, 0xff, 0x00, 0x00, data).then();
  }
}
