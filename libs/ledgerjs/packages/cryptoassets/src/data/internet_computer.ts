export type ICPToken = [string, string, string, string, number, boolean];

const tokens: ICPToken[] = [
  // [assetCode, assetIssuer, asset type, name, precision, enableCountervalues]
  // Note: asset type is only used in Receive asset message and always should be
  // "InternetComputer"
  [
    "USDC",
    "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    "InternetComputer",
    "USDC",
    7,
    true,
  ],
];

export default tokens;
