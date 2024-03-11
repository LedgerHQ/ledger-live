import type { PolkadotAccount, Transaction } from "../types";
import { getEstimatedFees } from "../logic";
import BigNumber from "bignumber.js";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} a
 * @param {Transaction} t
 */
const prepareTransaction = async (a: PolkadotAccount, t: Transaction) => {
  let fees = t.fees;
  fees = await getEstimatedFees({
    a,
    t,
  });

  if (!sameFees(fees, t.fees)) {
    return { ...t, fees };
  }

  return t;
};

export default prepareTransaction;
