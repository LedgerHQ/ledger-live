import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];

export const importStellarTokens = async (outputDir: string) => {
  console.log("importing stellar tokens...");
  const stellarTokens = await fetchTokens<StellarToken[]>("stellar.json");
  const filePath = path.join(outputDir, "stellar");

  const stellarTypeStringified = `export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  string, // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];`;

  fs.writeFileSync(`${filePath}.json`, JSON.stringify(stellarTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `${stellarTypeStringified}

import tokens from "./stellar.json";

export default tokens as StellarToken[];
`,
  );

  console.log("importing stellar tokens sucess");
};
