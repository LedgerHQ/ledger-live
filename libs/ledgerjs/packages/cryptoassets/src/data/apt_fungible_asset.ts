export type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];

import tokens from "./apt_fungible_asset.json";

export { default as hash } from "./apt_fungible_asset-hash.json";

export default tokens as AptosToken[];
