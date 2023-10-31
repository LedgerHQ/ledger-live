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
  console.log("importing cardanoNative tokens...");
  const cardanoNativeTokens = await fetchTokens<CardanoNativeToken[]>("cardanoNative.json");
  const filePath = path.join(outputDir, "cardanoNative");

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

  fs.writeFileSync(`${filePath}.json`, JSON.stringify(cardanoNativeTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `${cardanoNativeTypeStringified}

import tokens from "./cardanoNative.json";

export default tokens as CardanoNativeToken[];
`,
  );

  console.log("importing cardanoNative tokens sucess");
};
