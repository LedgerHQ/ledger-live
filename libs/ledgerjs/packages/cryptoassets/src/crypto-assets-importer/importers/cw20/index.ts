import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type CW20Token = [
  string, // token identifier
  string, // ticker/symbol
  string, // name
  string, // contract address
  number, // decimals
];

export const importCW20Tokens = async (outputDir: string) => {
  try {
    console.log("importing Terra Classic CW20 tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "terra_classic" }, [
      "id",
      "ticker",
      "name",
      "contract_address",
      "decimals",
    ]);
    const cw20Tokens: CW20Token[] = tokens.map(token => {
      const [, , tokenIdentifier] = token.id.split("/");

      return [tokenIdentifier, token.ticker, token.name, token.contract_address, token.decimals];
    });

    const filePath = path.join(outputDir, "cw20");
    const cw20TypeStringified = `export type CW20Token = [
  string, // token identifier
  string, // ticker/symbol
  string, // name
  string, // contract address
  number, // decimals
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(cw20Tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }
    fs.writeFileSync(
      `${filePath}.ts`,
      `${cw20TypeStringified}

import tokens from "./cw20.json";

${hash ? `export { default as hash } from "./cw20-hash.json";` : ""}

export default tokens as CW20Token[];
`,
    );

    console.log("importing Terra Classic CW20 tokens success");
  } catch (err) {
    console.error(err);
  }
};
