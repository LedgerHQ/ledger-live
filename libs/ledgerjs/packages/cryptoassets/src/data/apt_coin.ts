export type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];

import tokens from "./apt_coin.json";

export { default as hash } from "./apt_coin-hash.json";

export default tokens as AptosToken[];
