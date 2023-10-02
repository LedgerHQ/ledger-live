export type PolygonERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  (string | null)?, // legacy
  (string | null)?, // legacy
];

import tokens from "./polygon-erc20.json";

export default tokens as PolygonERC20Token[];
