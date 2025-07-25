"use strict";
/***
 * https://github.com/bitcoincashjs/cashaddr
 * Copyright (c) 2018 Matias Alejo Garcia
 * Copyright (c) 2017 Emilio Almansi
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */

/***
 * Charset containing the 32 symbols used in the base32 encoding.
 */
export const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/***
 * Inverted index mapping each symbol into its index within the charset.
 */
const CHARSET_INVERSE_INDEX = {
  q: 0,
  p: 1,
  z: 2,
  r: 3,
  y: 4,
  9: 5,
  x: 6,
  8: 7,
  g: 8,
  f: 9,
  2: 10,
  t: 11,
  v: 12,
  d: 13,
  w: 14,
  0: 15,
  s: 16,
  3: 17,
  j: 18,
  n: 19,
  5: 20,
  4: 21,
  k: 22,
  h: 23,
  c: 24,
  e: 25,
  6: 26,
  m: 27,
  u: 28,
  a: 29,
  7: 30,
  l: 31,
};

/***
 * Encodes the given array of 5-bit integers as a base32-encoded string.
 *
 * @param {Array} data Array of integers between 0 and 31 inclusive.
 */
export function encode(data: number[]) {
  if (!(data instanceof Array)) {
    throw new Error("Must be Array");
  }
  let base32 = "";
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (!(0 <= value && value < 32)) {
      throw new Error("value " + value);
    }
    base32 += CHARSET[value];
  }
  return base32;
}

/***
 * Decodes the given base32-encoded string into an array of 5-bit integers.
 *
 * @param {string} base32
 */
export function decode(base32: string) {
  if (typeof base32 !== "string") {
    throw new Error("Must be base32-encoded string");
  }
  const data = [];
  for (let i = 0; i < base32.length; i++) {
    const value = base32[i];
    if (!(value in CHARSET_INVERSE_INDEX)) {
      throw new Error("value " + value);
    }
    // @ts-ignore
    data.push(CHARSET_INVERSE_INDEX[value]);
  }
  return data;
}

const base32 = {
  encode,
  decode,
  CHARSET,
};

export default base32;
