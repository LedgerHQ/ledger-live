import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type StacksSip010Token = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];

export const importStacksSip010Tokens = async (outputDir: string) => {
  try {
    console.log("importing stacks sip010 tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "stacks" }, [
      "contract_address",
      "name",
      "ticker",
      "decimals",
      "delisted",
    ]);
    const sip010Tokens: StacksSip010Token[] = tokens.map(token => [
      token.contract_address,
      token.name,
      token.ticker,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, "stacks-sip010");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(sip010Tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `export type StacksSip010Token = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];

import tokens from "./stacks-sip010.json";

${hash ? `export { default as hash } from "./stacks-sip010-hash.json";` : ""}

export default tokens as StacksSip010Token[];
`,
    );

    console.log("importing stacks sip010 tokens success");
  } catch (err) {
    console.error(err);
  }
};
