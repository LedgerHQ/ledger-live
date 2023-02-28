export type CardanoNativeToken = [
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
