export type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean? // enableCountervalues
];

import tokens from "./trc20.json";

export default tokens as TRC20Token[];
