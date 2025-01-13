import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

import { fromTransactionCommonRaw } from "@ledgerhq/coin-framework/serialization";

export const fromTransactionRaw = (t: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    options: JSON.parse(t.options),
    estimate: JSON.parse(t.estimate),
    firstEmulation: JSON.parse(t.firstEmulation),
    ...(t.fees && { fees: new BigNumber(t.fees) }),
    ...(t.errors && { errors: JSON.parse(t.errors) }),
  };
};

export default {
  fromTransactionRaw,
};
