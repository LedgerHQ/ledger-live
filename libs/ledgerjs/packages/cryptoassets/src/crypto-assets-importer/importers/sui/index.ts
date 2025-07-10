import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type SuiToken = [
  string, // CAL id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

export const importSuiTokens = async (outputDir: string) => {
  try {
    console.log("importing sui tokens...");

    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "sui" }, [
      "id",
      "name",
      "ticker",
      "contract_address",
      "decimals",
    ]);

    const suiTokens: SuiToken[] = tokens.map(token => [
      token.id,
      token.name,
      token.ticker,
      token.contract_address,
      token.decimals,
    ]);

    const filePath = path.join(outputDir, "sui");
    const suiTypeStringified = `export type SuiToken = [
  string, // CAL id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(suiTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${suiTypeStringified}

import tokens from "./sui.json";

${hash ? `export { default as hash } from "./sui-hash.json";` : ""}

export default tokens as SuiToken[];
`,
    );

    console.log("importing sui tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
