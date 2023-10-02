export type ICPToken = [
    string, // assetCode
    string, // assetIssuer
    // Note: asset type is only used in Receive asset message and always should be "InternetComputer"
    string, // asset type
    string, // name
    number, // precision
    boolean // enableCountervalues
];

const tokens: ICPToken[] = [
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
