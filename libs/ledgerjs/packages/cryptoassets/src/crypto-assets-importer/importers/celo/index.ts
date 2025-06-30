import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type CeloToken = [
  string, // ticker
  number, // decimals
  string, // contractAddress
  string, // name
];

export const importCeloTokens = async (outputDir: string) => {
  try {
    console.log("importing celo tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "celo" }, [
      "ticker",
      "decimals",
      "contract_address",
      "name",
    ]);

    const celoTokens: CeloToken[] = tokens.map(token => {
      return [token.ticker, token.decimals, token.contract_address, token.name];
    });

    const filePath = path.join(outputDir, "celo");
    const celoTokensStringified = `export type CeloToken = [
  string, // ticker
  number, // decimals
  string, // contractAddress
  string, // name
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(celoTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${celoTokensStringified}

import tokens from "./celo.json";

${hash ? `export { default as hash } from "./celo-hash.json";` : ""}

export default tokens as CeloToken[];
`,
    );

    console.log("importing celo tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
