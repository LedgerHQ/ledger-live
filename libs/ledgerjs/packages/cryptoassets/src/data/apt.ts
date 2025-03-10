export type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];

import tokens from "./apt.json";

export { default as hash } from "./apt-hash.json";

export default tokens as AptosToken[];
