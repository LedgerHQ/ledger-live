export type APTToken = [
  string, // CAL id
  string, // network
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

import tokens from "./apt.json";

export { default as hash } from "./apt-hash.json";

export default tokens as APTToken[];
