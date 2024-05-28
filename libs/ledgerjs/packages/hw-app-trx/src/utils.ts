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
type Defer<T> = {
  promise: Promise<T>;
  resolve: (arg0: T) => void;
  reject: (arg0: any) => void;
};
export function defer<T>(): Defer<T> {
  let resolve, reject;
  const promise = new Promise<T>(function (success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw "defer() error"; // this never happens and is just to make flow happy

  return {
    promise,
    resolve,
    reject,
  };
}
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
// TODO use async await
export function eachSeries<A>(arr: A[], fun: (arg0: A) => Promise<any>): Promise<any> {
  return arr.reduce((p, e) => p.then(() => fun(e)), Promise.resolve());
}
export function foreach<T, A>(
  arr: T[],
  callback: (arg0: T, arg1: number) => Promise<A>,
): Promise<A[]> {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else
      return callback(array[index], index).then(function (res) {
        result.push(res);
        return iterate(index + 1, array, result);
      });
  }

  return Promise.resolve().then(() => iterate(0, arr, []));
}
export function doIf(condition: boolean, callback: () => any | Promise<any>): Promise<void> {
  return Promise.resolve().then(() => {
    if (condition) {
      return callback();
    }
  });
}
export function asyncWhile<T>(
  predicate: () => boolean,
  callback: () => Promise<T>,
): Promise<Array<T>> {
  function iterate(result) {
    if (!predicate()) {
      return result;
    } else {
      return callback().then(res => {
        result.push(res);
        return iterate(result);
      });
    }
  }

  return Promise.resolve([]).then(iterate);
}
interface DecodeResult {
  value: number;
  pos: number;
}
export function decodeVarint(stream: Buffer, index: number): DecodeResult {
  let result = 0;
  let shift = 0;
  let pos = index;

  // eslint-disable-next-line no-constant-condition
  while (shift < 64) {
    const b = stream[pos];
    result |= (b & 0x7f) << shift;
    pos += 1;

    if (!(b & 0x80)) {
      result &= 0xffffffff;
      return {
        value: result,
        pos,
      };
    }

    shift += 7;
  }

  throw new Error("Too many bytes when decoding varint.");
}

export const padHexString = (str: string) => {
  return str.length % 2 ? "0" + str : str;
};

export function hexBuffer(str: string): Buffer {
  const strWithoutPrefix = str.startsWith("0x") ? str.slice(2) : str;
  return Buffer.from(padHexString(strWithoutPrefix), "hex");
}
