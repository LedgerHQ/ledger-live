import fs from "fs";
import { log } from "console";
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

export const importCardanoNativeTokens = async (outputFolder: string) => {
  log("importing cardanoNative tokens...");
  const cardanoNativeTokens = await fetchTokens<CardanoNativeToken[]>("cardanoNative.json");
  fs.writeFileSync(`${outputFolder}/cardanoNative.json`, JSON.stringify(cardanoNativeTokens));
  fs.writeFileSync(
    `${outputFolder}/cardanoNative.ts`,
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
