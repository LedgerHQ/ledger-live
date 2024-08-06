import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type AlgorandASAToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // precision
  true, // [deprecated] enableCountervalues
];

export const importAsaTokens = async (outputDir: string) => {
  try {
    console.log("importing asa tokens...");
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        blockchain_name: "algorand",
      },
      ["contract_address", "token_identifier", "decimals", "name", "ticker", "live_signature"],
    );
    const asaTokens: AlgorandASAToken[] = tokens.map(token => [
      token.token_identifier,
      token.ticker,
      token.name,
      token.contract_address,
      token.decimals,
      true,
    ]);

    const filePath = path.join(outputDir, "asa");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(asaTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // enableCountervalues
];

import tokens from "./asa.json";

${hash ? `export { default as hash } from "./asa-hash.json";` : ""}

export default tokens as AlgorandASAToken[];
`,
    );

    console.log("importing asa tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
