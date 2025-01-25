export type TRC20Token = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
  string?, // live signature
];

import tokens from "./trc20.json";

export { default as hash } from "./trc20-hash.json";

export default tokens as TRC20Token[];
