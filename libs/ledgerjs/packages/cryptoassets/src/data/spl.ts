export type SPLToken = [
  string, // CAL id
  string, // network
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

import tokens from "./spl.json";

export { default as hash } from "./spl-hash.json";

export default tokens as SPLToken[];
