import fs from "fs";
import path from "path";
import { fetchTokensFromCALService, toCryptoCurrencyId } from "../../fetch";

type SuiToken = [
  string, // id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
  string, // live_signature
];

export const importSuiTokens = async (outputDir: string) => {
  try {
    console.log("importing sui tokens...");

    const { tokens, hash } = await fetchTokensFromCALService(
      { blockchain_name: toCryptoCurrencyId("sui") },
      ["id", "name", "ticker", "contract_address", "decimals", "live_signature"],
    );

    const suiTokens: SuiToken[] = tokens.map(token => [
      token.id,
      token.name,
      token.ticker,
      token.contract_address,
      token.decimals,
      token.live_signature,
    ]);

    const filePath = path.join(outputDir, "sui");
    const suiTypeStringified = `export type SuiToken = [
  string, // id
  string, // name
  string, // ticker
  string, // address
  number, // decimals
  string, // live_signature
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
