export type FilecoinERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract eth address
  //   string, // contract fil address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
  (string | null)?, // coumpound_for (legacy)
];

import tokens from "./filecoin-erc20.json";

export default tokens as FilecoinERC20Token[];
