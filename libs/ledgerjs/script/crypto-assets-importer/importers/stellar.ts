import fs from "fs";
import { log } from "console";
import { fetchTokens } from "../fetch";

type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];

export const importStellarTokens = async (outputFolder: string) => {
  log("importing stellar tokens...");
  const stellarTokens = await fetchTokens<StellarToken[]>("stellar.json");
  fs.writeFileSync(`${outputFolder}/stellar.json`, JSON.stringify(stellarTokens));
  fs.writeFileSync(
    `${outputFolder}/stellar.ts`,
    `export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];

import tokens from "./stellar.json";

export default tokens as StellarToken[];
`,
  );

  log("importing stellar tokens sucess");
};
