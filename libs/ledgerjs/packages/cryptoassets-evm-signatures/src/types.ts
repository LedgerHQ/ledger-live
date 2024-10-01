export type ERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  false, // [deprecated] disabled counter values
  boolean, // delisted
];
