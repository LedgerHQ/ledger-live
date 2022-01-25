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
import {
  splitPath,
  foreach,
  encodeEd25519PublicKey,
  verifyEd25519Signature,
  checkStellarBip32Path,
  hash,
} from "./utils";
const CLA = 0xe0;
const INS_GET_PK = 0x02;
const INS_SIGN_TX = 0x04;
const INS_GET_CONF = 0x06;
const INS_SIGN_TX_HASH = 0x08;
const INS_KEEP_ALIVE = 0x10;
const APDU_MAX_SIZE = 150;
const P1_FIRST_APDU = 0x00;
const P1_MORE_APDU = 0x80;
const P2_LAST_APDU = 0x00;
const P2_MORE_APDU = 0x80;
const SW_OK = 0x9000;
const SW_CANCEL = 0x6985;
const SW_UNKNOWN_OP = 0x6c24;
const SW_MULTI_OP = 0x6c25;
const SW_NOT_ALLOWED = 0x6c66;
const SW_UNSUPPORTED = 0x6d00;
const SW_KEEP_ALIVE = 0x6e02;
const TX_MAX_SIZE = 1540;
/**
 * Stellar API
 *
 * @example
 * import Str from "@ledgerhq/hw-app-str";
 * const str = new Str(transport)
 */

export default class Str {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "l0v") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["getAppConfiguration", "getPublicKey", "signTransaction", "signHash"],
      scrambleKey
    );
  }

  getAppConfiguration(): Promise<{
    version: string;
  }> {
    return this.transport
      .send(CLA, INS_GET_CONF, 0x00, 0x00)
      .then((response) => {
        const multiOpsEnabled = response[0] === 0x01 || response[1] < 0x02;
        const version =
          "" + response[1] + "." + response[2] + "." + response[3];
        return {
          version: version,
          multiOpsEnabled: multiOpsEnabled,
        };
      });
  }

  /**
   * get Stellar public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolValidate optionally enable key pair validation
   * @option boolDisplay optionally enable or not the display
   * @return an object with the publicKey (using XLM public key format) and
   * the raw ed25519 public key.
   * @example
   * str.getPublicKey("44'/148'/0'").then(o => o.publicKey)
   */
  getPublicKey(
    path: string,
    boolValidate?: boolean,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
    raw: Buffer;
  }> {
    checkStellarBip32Path(path);
    const apdus: Buffer[] = [];
    let response;
    const pathElts = splitPath(path);
    const buffer = Buffer.alloc(1 + pathElts.length * 4);
    buffer[0] = pathElts.length;
    pathElts.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    const verifyMsg = Buffer.from("via lumina", "ascii");
    apdus.push(Buffer.concat([buffer, verifyMsg]));
    let keepAlive = false;
    return foreach(apdus, (data) =>
      this.transport
        .send(
          CLA,
          keepAlive ? INS_KEEP_ALIVE : INS_GET_PK,
          boolValidate ? 0x01 : 0x00,
          boolDisplay ? 0x01 : 0x00,
          data,
          [SW_OK, SW_KEEP_ALIVE]
        )
        .then((apduResponse) => {
          const status = Buffer.from(
            apduResponse.slice(apduResponse.length - 2)
          ).readUInt16BE(0);

          if (status === SW_KEEP_ALIVE) {
            keepAlive = true;
            apdus.push(Buffer.alloc(0));
          }

          response = apduResponse;
        })
    ).then(() => {
      // response = Buffer.from(response, 'hex');
      let offset = 0;
      const rawPublicKey = response.slice(offset, offset + 32);
      offset += 32;
      const publicKey = encodeEd25519PublicKey(rawPublicKey);

      if (boolValidate) {
        const signature = response.slice(offset, offset + 64);

        if (!verifyEd25519Signature(verifyMsg, signature, rawPublicKey)) {
          throw new Error(
            "Bad signature. Keypair is invalid. Please report this."
          );
        }
      }

      return {
        publicKey: publicKey,
        raw: rawPublicKey,
      };
    });
  }

  /**
   * sign a Stellar transaction.
   * @param path a path in BIP 32 format
   * @param transaction signature base of the transaction to sign
   * @return an object with the signature and the status
   * @example
   * str.signTransaction("44'/148'/0'", signatureBase).then(o => o.signature)
   */
  signTransaction(
    path: string,
    transaction: Buffer
  ): Promise<{
    signature: Buffer;
  }> {
    checkStellarBip32Path(path);

    if (transaction.length > TX_MAX_SIZE) {
      throw new Error(
        "Transaction too large: max = " +
          TX_MAX_SIZE +
          "; actual = " +
          transaction.length
      );
    }

    const apdus: Buffer[] = [];
    let response;
    const pathElts = splitPath(path);
    const bufferSize = 1 + pathElts.length * 4;
    const buffer = Buffer.alloc(bufferSize);
    buffer[0] = pathElts.length;
    pathElts.forEach(function (element, index) {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    let chunkSize = APDU_MAX_SIZE - bufferSize;

    if (transaction.length <= chunkSize) {
      // it fits in a single apdu
      apdus.push(Buffer.concat([buffer, transaction]));
    } else {
      // we need to send multiple apdus to transmit the entire transaction
      let chunk = Buffer.alloc(chunkSize);
      let offset = 0;
      transaction.copy(chunk, 0, offset, chunkSize);
      apdus.push(Buffer.concat([buffer, chunk]));
      offset += chunkSize;

      while (offset < transaction.length) {
        const remaining = transaction.length - offset;
        chunkSize = remaining < APDU_MAX_SIZE ? remaining : APDU_MAX_SIZE;
        chunk = Buffer.alloc(chunkSize);
        transaction.copy(chunk, 0, offset, offset + chunkSize);
        offset += chunkSize;
        apdus.push(chunk);
      }
    }

    let keepAlive = false;
    return foreach(apdus, (data, i) =>
      this.transport
        .send(
          CLA,
          keepAlive ? INS_KEEP_ALIVE : INS_SIGN_TX,
          i === 0 ? P1_FIRST_APDU : P1_MORE_APDU,
          i === apdus.length - 1 ? P2_LAST_APDU : P2_MORE_APDU,
          data,
          [SW_OK, SW_CANCEL, SW_UNKNOWN_OP, SW_MULTI_OP, SW_KEEP_ALIVE]
        )
        .then((apduResponse) => {
          const status = Buffer.from(
            apduResponse.slice(apduResponse.length - 2)
          ).readUInt16BE(0);

          if (status === SW_KEEP_ALIVE) {
            keepAlive = true;
            apdus.push(Buffer.alloc(0));
          }

          response = apduResponse;
        })
    ).then(() => {
      const status = Buffer.from(
        response.slice(response.length - 2)
      ).readUInt16BE(0);

      if (status === SW_OK) {
        const signature = Buffer.from(response.slice(0, response.length - 2));
        return {
          signature: signature,
        };
      } else if (status === SW_UNKNOWN_OP) {
        // pre-v2 app version: fall back on hash signing
        return this.signHash_private(path, hash(transaction));
      } else if (status === SW_MULTI_OP) {
        // multi-operation transaction: attempt hash signing
        return this.signHash_private(path, hash(transaction));
      } else {
        throw new Error("Transaction approval request was rejected");
      }
    });
  }

  /**
   * sign a Stellar transaction hash.
   * @param path a path in BIP 32 format
   * @param hash hash of the transaction to sign
   * @return an object with the signature
   * @example
   * str.signHash("44'/148'/0'", hash).then(o => o.signature)
   */
  signHash(
    path: string,
    hash: Buffer
  ): Promise<{
    signature: Buffer;
  }> {
    checkStellarBip32Path(path);
    return this.signHash_private(path, hash);
  }

  signHash_private(
    path: string,
    hash: Buffer
  ): Promise<{
    signature: Buffer;
  }> {
    const apdus: Buffer[] = [];
    let response;
    const pathElts = splitPath(path);
    const buffer = Buffer.alloc(1 + pathElts.length * 4);
    buffer[0] = pathElts.length;
    pathElts.forEach(function (element, index) {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    apdus.push(Buffer.concat([buffer, hash]));
    let keepAlive = false;
    return foreach(apdus, (data) =>
      this.transport
        .send(
          CLA,
          keepAlive ? INS_KEEP_ALIVE : INS_SIGN_TX_HASH,
          0x00,
          0x00,
          data,
          [SW_OK, SW_CANCEL, SW_NOT_ALLOWED, SW_UNSUPPORTED, SW_KEEP_ALIVE]
        )
        .then((apduResponse) => {
          const status = Buffer.from(
            apduResponse.slice(apduResponse.length - 2)
          ).readUInt16BE(0);

          if (status === SW_KEEP_ALIVE) {
            keepAlive = true;
            apdus.push(Buffer.alloc(0));
          }

          response = apduResponse;
        })
    ).then(() => {
      const status = Buffer.from(
        response.slice(response.length - 2)
      ).readUInt16BE(0);

      if (status === SW_OK) {
        const signature = Buffer.from(response.slice(0, response.length - 2));
        return {
          signature: signature,
        };
      } else if (status === SW_CANCEL) {
        throw new Error("Transaction approval request was rejected");
      } else if (status === SW_UNSUPPORTED) {
        throw new Error("Hash signing is not supported");
      } else {
        throw new Error(
          "Hash signing not allowed. Have you enabled it in the app settings?"
        );
      }
    });
  }
}
