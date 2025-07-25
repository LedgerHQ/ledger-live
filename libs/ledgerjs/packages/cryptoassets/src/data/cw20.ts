export type CW20Token  = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];

import tokens from "./cw20.json";

export { default as hash } from "./cw20-hash.json";

export default tokens as CW20Token[];
