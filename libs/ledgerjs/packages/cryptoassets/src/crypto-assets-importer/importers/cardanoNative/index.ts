import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type CardanoNativeToken = [
  string, // parentCurrencyId
  string, // policyId
  string, // assetName
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
  boolean, // disableCountervalue
];

export const importCardanoNativeTokens = async (outputDir: string) => {
  try {
    console.log("importing cardanoNative tokens...");
    const [cardanoNativeTokens, hash] =
      await fetchTokens<CardanoNativeToken[]>("cardanoNative.json");
    const filePath = path.join(outputDir, "cardanoNative");

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(cardanoNativeTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    const cardanoNativeTypeStringified = `export type CardanoNativeToken = [
  string, // parentCurrencyId
  string, // policyId
  string, // assetName
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
  boolean // disableCountervalue
];`;

    fs.writeFileSync(
      `${filePath}.ts`,
      `${cardanoNativeTypeStringified}

import tokens from "./cardanoNative.json";

${hash ? `export { default as hash } from "./cardanoNative-hash.json";` : null}

export default tokens as CardanoNativeToken[];
`,
    );

    console.log("importing cardanoNative tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
