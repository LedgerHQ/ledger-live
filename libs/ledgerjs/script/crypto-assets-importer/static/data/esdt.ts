export type ElrondESDTToken = [
  ticker: string,
  identifier: string,
  decimals: number,
  signature: string,
  name: string
];

import tokens from "./esdt.json";

export default tokens as ElrondESDTToken[];
