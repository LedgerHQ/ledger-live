import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type CasperToken = [
  string, // assetCode
  string, // assetIssuer
  "Casper", // assetType (note: only used in Receive asset message and always should be "Casper")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];

export const importCasperTokens = async (outputDir: string) => {
  try {
    console.log("importing casper tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "casper" }, [
      "ticker",
      "contract_address",
      "name",
      "decimals",
    ]);
    const casperTokens: CasperToken[] = tokens.map(token => [
      token.ticker.toLowerCase(),
      token.contract_address.toLowerCase(),
      "Casper",
      token.name,
      token.decimals,
      true,
    ]);

    const filePath = path.join(outputDir, "casper");
    const casperTypeStringified = `export type CasperToken = [
  string, // assetCode
  string, // assetIssuer
  "Casper", // assetType (note: only used in Receive asset message and always should be "Casper")
  string, // name
  number, // precision
  boolean, // enableCountervalues
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(casperTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${casperTypeStringified}

import tokens from "./casper.json";

${hash ? `export { default as hash } from "./casper-hash.json";` : ""}

export default tokens as CasperToken[];
`,
    );

    console.log("importing casper tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
