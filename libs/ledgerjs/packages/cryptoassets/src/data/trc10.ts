export type TRC10Token = [
  number, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean, // delisted
  string, // ledgerSignature
  boolean? // enableCountervalues
];

import tokens from "./trc10.json";

export default tokens as TRC10Token[];
