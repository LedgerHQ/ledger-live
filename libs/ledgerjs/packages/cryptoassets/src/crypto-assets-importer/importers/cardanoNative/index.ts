import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type CardanoNativeToken = [
  "cardano", // parentCurrencyId
  string, // policyId
  string, // token identifier
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];

export const importCardanoNativeTokens = async (outputDir: string) => {
  try {
    console.log("importing cardanoNative tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "cardano" }, [
      "contract_address",
      "name",
      "token_identifier",
      "ticker",
      "decimals",
      "delisted",
    ]);
    const cardanoNativeTokens: CardanoNativeToken[] = tokens.map(token => [
      "cardano",
      token.contract_address,
      token.token_identifier,
      token.name,
      token.ticker,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, "cardanoNative");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(cardanoNativeTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    const cardanoNativeTypeStringified = `export type CardanoNativeToken = [
  "cardano", // parentCurrencyId
  string, // policyId
  string, // token identifier
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];`;

    fs.writeFileSync(
      `${filePath}.ts`,
      `${cardanoNativeTypeStringified}

import tokens from "./cardanoNative.json";

${hash ? `export { default as hash } from "./cardanoNative-hash.json";` : ""}

export default tokens as CardanoNativeToken[];
`,
    );

    console.log("importing cardanoNative tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
