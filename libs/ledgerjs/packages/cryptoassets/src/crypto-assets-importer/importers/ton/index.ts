import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
];

export const importTonJettonTokens = async (outputDir: string) => {
  try {
    console.log("importing ton jetton tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "ton" }, [
      "contract_address",
      "name",
      "ticker",
      "decimals",
      "delisted",
    ]);
    const jettonTokens: TonJettonToken[] = tokens.map(token => [
      token.contract_address,
      token.name,
      token.ticker,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, "ton-jetton");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(jettonTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `export type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
];

import tokens from "./ton-jetton.json";

${hash ? `export { default as hash } from "./ton-jetton-hash.json";` : ""}

export default tokens as TonJettonToken[];
`,
    );

    console.log("importing ton jetton tokens success");
  } catch (err) {
    console.error(err);
  }
};
