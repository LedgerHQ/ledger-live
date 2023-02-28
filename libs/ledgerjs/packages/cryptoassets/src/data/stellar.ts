export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean // enableCountervalues
];

import tokens from "./stellar.json";

export default tokens as StellarToken[];
