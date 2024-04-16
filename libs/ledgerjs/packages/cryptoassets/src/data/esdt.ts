export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

import tokens from "./esdt.json";

export { default as hash } from "./esdt-hash.json";

export default tokens as ElrondESDTToken[];
