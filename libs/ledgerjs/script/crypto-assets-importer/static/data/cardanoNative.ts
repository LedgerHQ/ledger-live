export type CardanoNativeToken = [
  parentCurrencyId: string,
  policyId: string,
  assetName: string,
  name: string,
  ticker: string,
  decimals: number,
  delisted: boolean,
  disableCountervalue: boolean
];

import tokens from "./cardanoNative.json";

export default tokens as CardanoNativeToken[];
