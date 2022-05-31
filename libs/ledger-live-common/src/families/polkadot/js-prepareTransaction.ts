import type { Account } from "../../types";
import type { Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import { loadPolkadotCrypto } from "./polkadot-crypto";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {Account} a
 * @param {Transaction} t
 */
const prepareTransaction = async (a: Account, t: Transaction) => {
  await loadPolkadotCrypto();
  let fees = t.fees;
  fees = await getEstimatedFees({
    a,
    t,
  });

  if (!sameFees(t.fees, fees)) {
    return { ...t, fees };
  }

  return t;
};

export default prepareTransaction;
