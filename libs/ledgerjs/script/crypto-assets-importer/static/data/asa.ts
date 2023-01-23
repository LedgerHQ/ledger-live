export type AlgorandASAToken = [
  id: string,
  abbr: string,
  name: string,
  contractAddress: string,
  precision: number,
  enableCountervalues?: boolean
];

import tokens from "./asa.json";

export default tokens as AlgorandASAToken[];
