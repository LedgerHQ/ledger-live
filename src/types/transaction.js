// @flow

import type { BigNumber } from "bignumber.js";

export type Transaction = {
  recipient: string,
  amount: ?(BigNumber | string),
  useAllAmount?: boolean,
  tokenAccountId?: ?string, // if provided, the transaction is done on a token instead
  // bitcoin
  feePerByte?: ?(BigNumber | string),
  // ethereum
  gasPrice?: BigNumber | string,
  gasLimit?: BigNumber | string,
  // xrp
  tag?: ?number,
  fee?: BigNumber | string
};
