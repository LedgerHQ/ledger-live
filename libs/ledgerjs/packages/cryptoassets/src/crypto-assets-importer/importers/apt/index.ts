import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];

export const importAptosTokens = async (outputDir: string, standard: string) => {
  try {
    console.log(`importing aptos ${standard} tokens...`);
    const { tokens, hash } = await fetchTokensFromCALService(
      { blockchain_name: "aptos", standard: standard },
      ["id", "ticker", "name", "contract_address", "decimals", "delisted"],
    );
    const aptosTokens: AptosToken[] = tokens.map(token => [
      token.id,
      token.ticker,
      token.name,
      token.contract_address,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, `apt_${standard}`);
    const aptosTypeStringified = `export type AptosToken = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(aptosTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${aptosTypeStringified}

import tokens from "./apt_${standard}.json";

${hash ? `export { default as hash } from "./apt_${standard}-hash.json";` : ""}

export default tokens as AptosToken[];
`,
    );

    console.log(`importing aptos ${standard} tokens success`);
  } catch (err) {
    console.error(err);
  }
};
