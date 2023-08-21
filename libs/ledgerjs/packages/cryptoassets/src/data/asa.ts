export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean? // enableCountervalues
];

import tokens from "./asa.json";

export default tokens as AlgorandASAToken[];
