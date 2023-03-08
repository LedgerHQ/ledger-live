export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean // disableCounterValue
];

import tokens from "./esdt.json";

export default tokens as ElrondESDTToken[];
