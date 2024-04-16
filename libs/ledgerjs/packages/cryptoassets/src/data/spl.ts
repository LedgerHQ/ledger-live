export type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

import tokens from "./spl.json";

export { default as hash } from "./spl-hash.json";

export default tokens as SPLToken[];
