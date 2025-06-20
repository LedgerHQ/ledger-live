export type CeloToken = [
  string, // ticker
  number, // decimals
  string, // contractAddress
  string, // name
];

import tokens from "./celo.json";

export { default as hash } from "./celo.json";

export default tokens as CeloToken[];
