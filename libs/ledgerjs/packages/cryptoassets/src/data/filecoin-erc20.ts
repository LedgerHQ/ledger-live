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
];

import tokens from "./filecoin-erc20.json";

export { default as hash } from "./filecoin-erc20-hash.json";

export default tokens as FilecoinERC20Token[];
