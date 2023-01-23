export type TRC20Token = [
  id: string,
  abbr: string,
  name: string,
  contractAddress: string,
  precision: number,
  delisted?: boolean,
  ledgerSignature?: string,
  enableCountervalues?: boolean
];

import tokens from "./trc20.json";

export default tokens as TRC20Token[];
