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
import {
  StellarHashSigningNotEnabledError,
  StellarDataParsingFailedError,
  StellarUserRefusedError,
  StellarDataTooLargeError,
} from "./errors";

const CLA = 0xe0;
const P1_FIRST = 0x00;
const P1_MORE = 0x80;
const P2_LAST = 0x00;
const P2_MORE = 0x80;
const P2_NON_CONFIRM = 0x00; // for getPublicKey
const P2_CONFIRM = 0x01; // for getPublicKey

const INS_GET_PK = 0x02;
const INS_SIGN_TX = 0x04;
const INS_GET_CONF = 0x06;
const INS_SIGN_HASH = 0x08;
const INS_SIGN_SOROBAN_AUTHORIZATION = 0x0a;

const APDU_MAX_PAYLOAD = 255;

const SW_DENY = 0x6985;
const SW_HASH_SIGNING_MODE_NOT_ENABLED = 0x6c66;
const SW_DATA_TOO_LARGE = 0xb004;
const SW_DATA_PARSING_FAIL = 0xb005;

/**
 * Stellar API
 *
 * @param transport a transport for sending commands to a device
 * @param scrambleKey a scramble key
 *
 * @example
 * import Str from "@ledgerhq/hw-app-str";
 * const str = new Str(transport)
 */
export default class Str {
  private transport: Transport;

  constructor(transport: Transport, scrambleKey = "l0v") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAppConfiguration",
        "getPublicKey",
        "signTransaction",
        "signSorobanAuthorization",
        "signHash",
      ],
      scrambleKey,
    );
  }

  /**
   * Get Stellar application configuration.
   *
   * @returns an object with the application configuration, including the version,
   *    whether hash signing is enabled, and the maximum data size in bytes that the device can sign.
   * @example
   * str.getAppConfiguration().then(o => o.version)
   */
  async getAppConfiguration(): Promise<{
    version: string;
    hashSigningEnabled: boolean;
    maxDataSize?: number;
  }> {
    const resp = await this.sendToDevice(INS_GET_CONF, Buffer.alloc(0));
    const [hashSigningEnabled, major, minor, patch, maxDataSizeHi, maxDataSizeLo] = resp;
    return {
      hashSigningEnabled: hashSigningEnabled === 0x01,
      version: `${major}.${minor}.${patch}`,
      maxDataSize: resp.length > 4 ? (maxDataSizeHi << 8) | maxDataSizeLo : undefined, // For compatibility with older app, let's remove this in the future
    };
  }

  /**
   * Get Stellar raw public key for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param display if true, the device will ask the user to confirm the address on the device, if false, it will return the raw public key directly
   * @return an object with the raw ed25519 public key.
   *    If you want to convert it to string, you can use {@link https://stellar.github.io/js-stellar-base/StrKey.html#.encodeEd25519PublicKey StrKey.encodeEd25519PublicKey}
   * @example
   * str.getPublicKey("44'/148'/0'").then(o => o.rawPublicKey)
   */
  async getPublicKey(path: string, display = false): Promise<{ rawPublicKey: Buffer }> {
    const pathBuffer = pathToBuffer(path);
    const p2 = display ? P2_CONFIRM : P2_NON_CONFIRM;
    try {
      const data = await this.transport.send(CLA, INS_GET_PK, P1_FIRST, p2, pathBuffer);
      return { rawPublicKey: data.slice(0, -2) };
    } catch (e) {
      throw remapErrors(e);
    }
  }

  /**
   * Sign a Stellar transaction.
   *
   * @param path a path in BIP 32 format
   * @param transaction {@link https://stellar.github.io/js-stellar-base/Transaction.html#signatureBase signature base} of the transaction to sign
   * @return an object with the signature
   * @example
   * str.signTransaction("44'/148'/0'", signatureBase).then(o => o.signature)
   */
  async signTransaction(
    path: string,
    transaction: Buffer,
  ): Promise<{
    signature: Buffer;
  }> {
    const pathBuffer = pathToBuffer(path);
    const payload = Buffer.concat([pathBuffer, transaction]);
    const resp = await this.sendToDevice(INS_SIGN_TX, payload);
    return { signature: resp };
  }

  /**
   * Sign a Stellar Soroban authorization.
   *
   * @param path a path in BIP 32 format
   * @param hashIdPreimage the {@link https://github.com/stellar/stellar-xdr/blob/1a04392432dacc0092caaeae22a600ea1af3c6a5/Stellar-transaction.x#L702-L709 Soroban authorization hashIdPreimage} to sign
   * @return an object with the signature
   * @example
   * str.signSorobanAuthorization("44'/148'/0'", hashIdPreimage).then(o => o.signature)
   */
  async signSorobanAuthorization(
    path: string,
    hashIdPreimage: Buffer,
  ): Promise<{
    signature: Buffer;
  }> {
    const pathBuffer = pathToBuffer(path);
    const payload = Buffer.concat([pathBuffer, hashIdPreimage]);
    const resp = await this.sendToDevice(INS_SIGN_SOROBAN_AUTHORIZATION, payload);
    return { signature: resp };
  }

  /**
   * Sign a hash.
   *
   * @param path a path in BIP 32 format
   * @param hash the hash to sign
   * @return an object with the signature
   * @example
   * str.signHash("44'/148'/0'", hash).then(o => o.signature)
   */
  async signHash(
    path: string,
    hash: Buffer,
  ): Promise<{
    signature: Buffer;
  }> {
    const pathBuffer = pathToBuffer(path);
    const payload = Buffer.concat([pathBuffer, hash]);
    const resp = await this.sendToDevice(INS_SIGN_HASH, payload);
    return { signature: resp };
  }

  private async sendToDevice(instruction: number, payload: Buffer) {
    let response: Buffer = Buffer.alloc(0);
    let remaining = payload.length;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunkSize = remaining > APDU_MAX_PAYLOAD ? APDU_MAX_PAYLOAD : remaining;
      const p1 = remaining === payload.length ? P1_FIRST : P1_MORE;
      const p2 = remaining - chunkSize === 0 ? P2_LAST : P2_MORE;
      const chunk = payload.slice(
        payload.length - remaining,
        payload.length - remaining + chunkSize,
      );
      response = await this.transport.send(CLA, instruction, p1, p2, chunk).catch(e => {
        throw remapErrors(e);
      });
      remaining -= chunkSize;
      if (remaining === 0) {
        break;
      }
    }
    return response.slice(0, -2);
  }
}

const remapErrors = e => {
  if (e) {
    switch (e.statusCode) {
      case SW_DENY:
        return new StellarUserRefusedError("User refused the request", undefined, { cause: e });
      case SW_DATA_PARSING_FAIL:
        return new StellarDataParsingFailedError("Unable to parse the provided data", undefined, {
          cause: e,
        });
      case SW_HASH_SIGNING_MODE_NOT_ENABLED:
        return new StellarHashSigningNotEnabledError(
          "Hash signing not allowed. Have you enabled it in the app settings?",
          undefined,
          { cause: e },
        );
      case SW_DATA_TOO_LARGE:
        return new StellarDataTooLargeError(
          "The provided data is too large for the device to process",
          undefined,
          { cause: e },
        );
    }
  }
  return e;
};

const pathToBuffer = (originalPath: string) => {
  const path = originalPath
    .split("/")
    .map(value => (value.endsWith("'") || value.endsWith("h") ? value : `${value}'`))
    .join("/");
  const pathNums: number[] = BIPPath.fromString(path).toPathArray();
  return serializePath(pathNums);
};

const serializePath = (path: number[]) => {
  const buf = Buffer.alloc(1 + path.length * 4);
  buf.writeUInt8(path.length, 0);
  for (const [i, num] of path.entries()) {
    buf.writeUInt32BE(num, 1 + i * 4);
  }
  return buf;
};

export * from "./errors";
