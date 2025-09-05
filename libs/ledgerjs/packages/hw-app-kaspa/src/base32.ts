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
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/***
 * Encodes the given array of 5-bit integers as a base32-encoded string.
 *
 * @param {Array} data Array of integers between 0 and 31 inclusive.
 */
export function encode(data: Array<number>) {
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

const base32 = {
  encode,
};

export default base32;
