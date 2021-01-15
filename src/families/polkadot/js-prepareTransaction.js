// @flow
import type { Account } from "../../types";
import type { Transaction } from "./types";

import { getFees } from "./cache";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {Account} a
 * @param {Transaction} t
 */
const prepareTransaction = async (a: Account, t: Transaction) => {
  let fees = t.fees;

  fees = await getFees({ a, t });

  if (!sameFees(t.fees, fees)) {
    return { ...t, fees };
  }

  return t;
};

export default prepareTransaction;
