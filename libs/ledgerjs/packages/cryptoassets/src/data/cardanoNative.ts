export type CardanoNativeToken = [
  "cardano", // parentCurrencyId
  string, // policyId
  string, // token identifier
  string, // name
  string, // ticker
  number, // decimals
  boolean, // delisted
];

import tokens from "./cardanoNative.json";

export { default as hash } from "./cardanoNative-hash.json";

export default tokens as CardanoNativeToken[];
