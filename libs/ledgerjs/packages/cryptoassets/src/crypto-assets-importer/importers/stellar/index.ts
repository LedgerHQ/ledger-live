import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  "stellar", // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
];

export const importStellarTokens = async (outputDir: string) => {
  try {
    console.log("importing stellar tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "stellar" }, [
      "ticker",
      "contract_address",
      "name",
      "decimals",
    ]);
    const stellarTokens: StellarToken[] = tokens.map(token => [
      token.ticker.toLowerCase(),
      token.contract_address.toLowerCase(),
      "stellar",
      token.name,
      token.decimals,
    ]);

    const filePath = path.join(outputDir, "stellar");
    const stellarTypeStringified = `export type StellarToken = [
  string, // assetCode
  string, // assetIssuer
  "stellar", // assetType (note: only used in Receive asset message and always should be "Stellar")
  string, // name
  number, // precision
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(stellarTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${stellarTypeStringified}

import tokens from "./stellar.json";

${hash ? `export { default as hash } from "./stellar-hash.json";` : ""}

export default tokens as StellarToken[];
`,
    );

    console.log("importing stellar tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
