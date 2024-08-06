export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  "stellar", // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
];

import tokens from "./stellar.json";

export { default as hash } from "./stellar-hash.json";

export default tokens as StellarToken[];
