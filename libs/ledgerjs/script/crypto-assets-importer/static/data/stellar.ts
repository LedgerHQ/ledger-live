export type StellarToken = [
  assetCode: string,
  assetIssuer: string,
  assetType: string, // note: only used in Receive asset message and always should be "Stellar"
  name: string,
  precision: number,
  enableCountervalues: boolean
];

import tokens from "./stellar.json";

export default tokens as StellarToken[];
