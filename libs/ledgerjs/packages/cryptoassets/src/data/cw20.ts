export type CW20Token  = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
  string?, // live signature
];

import tokens from "./CW20.json";

export { default as hash } from "./CW20-hash.json";

export default tokens as CW20Token[];
