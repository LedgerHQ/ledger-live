export type StacksSip010Token = [
  string, // contractAddress
  string, // contractName
  string, // displayName
  string, // ticker
  number, // decimals
  boolean, // delisted
];

import tokens from "./stacks-sip010.json";

export { default as hash } from "./stacks-sip010-hash.json";

export default tokens as StacksSip010Token[];
