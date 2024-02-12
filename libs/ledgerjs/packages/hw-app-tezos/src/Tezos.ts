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
import invariant from "invariant";
import bs58check from "bs58check";
import blake2b from "blake2b";
import type Transport from "@ledgerhq/hw-transport";
export const TezosCurves = {
  ED25519: 0x00,
  SECP256K1: 0x01,
  SECP256R1: 0x02,
};
export type Curve = (typeof TezosCurves)[keyof typeof TezosCurves];
export type GetAddressResult = {
  address: string;
  publicKey: string;
};
export type SignOperationResult = {
  signature: string;
};
export type GetVersionResult = {
  major: number;
  minor: number;
  patch: number;
  bakingApp: boolean;
};
/**
 * Tezos API
 *
 * @example
 * import Tezos from "@ledgerhq/hw-app-tezos";
 * const tez = new Tezos(transport)
 */

export default class Tezos {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "signOperation", "getVersion"], "XTZ");
  }

  /**
   * get Tezos address for a given BIP 32 path.
   * @param path a path in BIP 32 format, must begin with 44'/1729'
   * @option options.verify optionally enable or not the display
   * @option options.curve
   * @option options.ins to use a custom apdu. This should currently only be unset (which will choose
             an appropriate APDU based on the boolDisplay parameter), or else set to 0x0A
             for the special "display" APDU which uses the alternate copy "Your Key"
   * @return an object with address, publicKey
   * @example
   * tez.getAddress("44'/1729'/0'/0'").then(o => o.address)
   * tez.getAddress("44'/1729'/0'/0'", { verify: true })
   */
  async getAddress(
    path: string,
    options: {
      verify?: boolean;
      curve?: Curve;
      ins?: number; // TODO specify
    } = {},
  ): Promise<GetAddressResult> {
    const cla = 0x80;
    let ins = options.ins;

    if (!ins) {
      if (options.verify) {
        ins = 0x03;
      } else {
        ins = 0x02;
      }
    }

    const p1 = 0;
    const p2 = options.curve || 0;
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    const payload = await this.transport.send(cla, ins, p1, p2, buffer);
    const publicKeyLength = payload[0];
    if (!publicKeyLength) {
      // it seems to be a bug that apps returns empty answer
      throw new Error("invalid public key");
    }
    const publicKey = payload.slice(1, 1 + publicKeyLength);
    const res: GetAddressResult = {
      publicKey: publicKey.toString("hex"),
      address: encodeAddress(publicKey, p2),
    };
    return res;
  }

  async signOperation(
    path: string,
    rawTxHex: string,
    options: {
      curve?: Curve;
    } = {},
  ): Promise<SignOperationResult> {
    const curve = options.curve || 0;
    const paths = splitPath(path);
    let offset = 0;
    const rawTx = Buffer.from(rawTxHex, "hex");
    const toSend: Buffer[] = [];
    // Initial key setting
    {
      const buffer = Buffer.alloc(paths.length * 4 + 1);
      buffer[0] = paths.length;
      paths.forEach((element, index) => {
        buffer.writeUInt32BE(element, 1 + 4 * index);
      });
      toSend.push(buffer);
    }

    while (offset !== rawTx.length) {
      const maxChunkSize = 230;
      let chunkSize;

      if (offset + maxChunkSize >= rawTx.length) {
        chunkSize = rawTx.length - offset;
      } else {
        chunkSize = maxChunkSize;
      }

      const buffer = Buffer.alloc(chunkSize);
      rawTx.copy(buffer, 0, offset, offset + chunkSize);
      toSend.push(buffer);
      offset += chunkSize;
    }

    let response;

    for (let i = 0; i < toSend.length; i++) {
      const data = toSend[i];
      let code = 0x01;

      if (i === 0) {
        code = 0x00;
      } else if (i === toSend.length - 1) {
        code = 0x81;
      }

      response = await this.transport.send(0x80, 0x04, code, curve, data);
    }

    invariant(response, "hw-app-xtz: response is set");
    const signature = response.slice(0, response.length - 2).toString("hex");
    return {
      signature,
    };
  }

  async getVersion(): Promise<GetVersionResult> {
    const [appFlag, major, minor, patch] = await this.transport.send(
      0x80,
      0x00,
      0x00,
      0x00,
      Buffer.alloc(0),
    );
    const bakingApp = appFlag === 1;
    return {
      major,
      minor,
      patch,
      bakingApp,
    };
  }
}

// TODO use bip32-path library
function splitPath(path: string): number[] {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);

    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }

    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }

    result.push(number);
  });
  return result;
}

type CurveData = {
  pkB58Prefix: Buffer;
  pkhB58Prefix: Buffer;
  compressPublicKey: (publicKey: Buffer, curve: Curve) => Buffer;
};

const compressPublicKeySECP256 = (publicKey: Buffer, curve: Curve) =>
  Buffer.concat([Buffer.from([curve, 0x02 + (publicKey[64] & 0x01)]), publicKey.slice(1, 33)]);

const curves: Array<CurveData> = [
  {
    pkB58Prefix: Buffer.from([13, 15, 37, 217]),
    pkhB58Prefix: Buffer.from([6, 161, 159]),
    compressPublicKey: (publicKey: Buffer, curve: Curve) => {
      publicKey = publicKey.slice(0);
      publicKey[0] = curve;
      return publicKey;
    },
  },
  {
    pkB58Prefix: Buffer.from([3, 254, 226, 86]),
    pkhB58Prefix: Buffer.from([6, 161, 161]),
    compressPublicKey: compressPublicKeySECP256,
  },
  {
    pkB58Prefix: Buffer.from([3, 178, 139, 127]),
    pkhB58Prefix: Buffer.from([6, 161, 164]),
    compressPublicKey: compressPublicKeySECP256,
  },
];

const encodeAddress = (publicKey: Buffer, curve: Curve) => {
  const curveData = curves[curve];
  invariant(curveData, "%s curve not supported", curve);
  const publicKeyBuf = curveData.compressPublicKey(publicKey, curve);
  const key = publicKeyBuf.slice(1);
  const keyHashSize = 20;
  let hash = blake2b(keyHashSize);
  hash.update(key);
  hash.digest((hash = Buffer.alloc(keyHashSize)));
  const address = bs58check.encode(Buffer.concat([curveData.pkhB58Prefix, hash]));
  return address;
};
