export type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
  boolean, // enableCountervalues
];

import tokens from "./ton-jetton.json";

export { default as hash } from "./ton-jetton-hash.json";

export default tokens as TonJettonToken[];
