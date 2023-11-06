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
import base32 from "base32.js";
import nacl from "tweetnacl";
import { sha256 } from "sha.js";
// TODO use bip32-path library
export function splitPath(path: string): number[] {
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
export function foreach<T, A>(
  arr: T[],
  callback: (arg0: T, arg1: number) => Promise<A>,
): Promise<A[]> {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else {
      return callback(array[index], index).then(function (res) {
        result.push(res);
        return iterate(index + 1, array, result);
      });
    }
  }

  return Promise.resolve().then(() => iterate(0, arr, []));
}
export function crc16xmodem(buf: Buffer, previous?: number): number {
  let crc = typeof previous !== "undefined" ? ~~previous : 0x0;

  for (let index = 0; index < buf.length; index++) {
    const byte = buf[index];
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }

  return crc;
}
export function encodeEd25519PublicKey(rawPublicKey: Buffer): string {
  const versionByte = 6 << 3; // 'G'

  const data = Buffer.from(rawPublicKey);
  const versionBuffer = Buffer.from([versionByte]);
  const payload = Buffer.concat([versionBuffer, data]);
  const checksum = Buffer.alloc(2);
  checksum.writeUInt16LE(crc16xmodem(payload), 0);
  const unencoded = Buffer.concat([payload, checksum]);
  return base32.encode(unencoded);
}
export function verifyEd25519Signature(
  data: Buffer,
  signature: Buffer,
  publicKey: Buffer,
): boolean {
  return nacl.sign.detached.verify(
    new Uint8Array(data.toJSON().data),
    new Uint8Array(signature.toJSON().data),
    new Uint8Array(publicKey.toJSON().data),
  );
}
export function hash(data: Buffer) {
  const hasher = new sha256();
  hasher.update(data as any, "utf8");
  return hasher.digest();
}
export function checkStellarBip32Path(path: string): void {
  path.split("/").forEach(function (element) {
    if (!element.toString().endsWith("'")) {
      throw new Error(
        "Detected a non-hardened path element in requested BIP32 path." +
          " Non-hardended paths are not supported at this time. Please use an all-hardened path." +
          " Example: 44'/148'/0'",
      );
    }
  });
}
