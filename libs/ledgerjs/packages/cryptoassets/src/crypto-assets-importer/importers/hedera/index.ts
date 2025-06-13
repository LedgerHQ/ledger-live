import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];

export const importHederaTokens = async (outputDir: string) => {
  try {
    console.log("importing hedera tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "hedera" }, [
      "id",
      "contract_address",
      "name",
      "ticker",
      "network",
      "decimals",
      "delisted",
    ]);
    const hederaTokens: HederaToken[] = tokens.map(token => [
      token.id,
      token.contract_address,
      token.name,
      token.ticker,
      token.network,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, "hedera");
    const hederaTypeStringified = `export type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(hederaTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${hederaTypeStringified}

import tokens from "./hedera.json";

${hash ? `export { default as hash } from "./hedera-hash.json";` : ""}

export default tokens as HederaToken[];
`,
    );

    console.log("importing hedera tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
