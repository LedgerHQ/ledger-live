import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type SPLToken = [
  number, // chainId
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];

export const importSPLTokens = async (outputDir: string) => {
  try {
    console.log("importing spl tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "solana" }, [
      "chain_id",
      "name",
      "ticker",
      "contract_address",
      "decimals",
    ]);
    const splTokens: SPLToken[] = tokens.map(token => [
      token.chain_id,
      token.name,
      token.ticker,
      token.contract_address,
      token.decimals,
    ]);

    const filePath = path.join(outputDir, "spl");
    const splTypeStringified = `export type SPLToken = [
  number, // chainId
  string, // name
  string, // ticker
  string, // address
  number, // decimals
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(splTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }
    fs.writeFileSync(
      `${filePath}.ts`,
      `${splTypeStringified}

import tokens from "./spl.json";

${hash ? `export { default as hash } from "./spl-hash.json";` : ""}

export default tokens as SPLToken[];
`,
    );

    console.log("importing spl tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
