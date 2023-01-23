export type SPLToken = [
  chainId: number,
  name: string,
  symbol: string,
  address: string,
  decimals: number,
  enableCountervalues?: boolean
];

import tokens from "./spl.json";

export default tokens as SPLToken[];
