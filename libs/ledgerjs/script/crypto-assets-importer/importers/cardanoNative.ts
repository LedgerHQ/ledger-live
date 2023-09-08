import fs from "fs";
import { log } from "console";
import path from "path";
import { fetchTokens } from "../fetch";

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
  log("importing cardanoNative tokens...");
  const cardanoNativeTokens = await fetchTokens<CardanoNativeToken[]>("cardanoNative.json");
  const filePath = path.join(outputDir, "cardanoNative");
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(cardanoNativeTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `export type CardanoNativeToken = [
  string, // parentCurrencyId
  string, // policyId
  string, // assetName
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
  boolean // disableCountervalue
];

import tokens from "./cardanoNative.json";

export default tokens as CardanoNativeToken[];
`,
  );

  log("importing cardanoNative tokens sucess");
};
