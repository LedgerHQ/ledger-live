export type TRC10Token = [
  id: number,
  abbr: string,
  name: string,
  contractAddress: string,
  precision: number,
  delisted: boolean,
  ledgerSignature: string,
  enableCountervalues?: boolean
];

import tokens from "./trc10.json";

export default tokens as TRC10Token[];
