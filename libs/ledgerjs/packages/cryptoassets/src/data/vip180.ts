export type Vip180Token = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];

import tokens from "./vip180.json";

export { default as hash } from "./vip180-hash.json";

export default tokens as Vip180Token[];
