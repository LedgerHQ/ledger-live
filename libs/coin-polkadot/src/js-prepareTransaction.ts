import type { PolkadotAccount, Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import { loadPolkadotCrypto } from "./polkadot-crypto";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} a
 * @param {Transaction} t
 */
const prepareTransaction = async (a: PolkadotAccount, t: Transaction) => {
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
