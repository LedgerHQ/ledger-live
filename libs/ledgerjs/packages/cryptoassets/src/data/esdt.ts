export type MultiversXESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
];

import tokens from "./esdt.json";

export { default as hash } from "./esdt-hash.json";

export default tokens as MultiversXESDTToken[];
