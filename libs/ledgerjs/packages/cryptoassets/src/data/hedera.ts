export type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];

import tokens from "./hedera.json";

export { default as hash } from "./hedera-hash.json";

export default tokens as HederaToken[];
