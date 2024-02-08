import { BigNumber } from "bignumber.js";
import type { IconAccount, Transaction } from "./types";
import { getFees } from "./api/node";
import { buildTransaction } from "./js-buildTransaction";
import { getStepPrice } from "./api/node";
import { calculateAmount } from "./logic";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {IconAccount} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
}: {
  a: IconAccount;
  t: Transaction;
}): Promise<BigNumber | null> => {
  const transaction = {
    ...t,
    recipient: getAbandonSeedAddress(a.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      a,
      t: {
        ...t,
        // fees: new BigNumber(0),
      },
    }), // Remove fees if present since we are fetching fees
  };
  try {
    const { unsigned } = await buildTransaction(a, transaction);
    const stepLimit = await getFees(unsigned, a);
    t.stepLimit = stepLimit;
    const stepPrice = await getStepPrice(a);
    return stepLimit.multipliedBy(stepPrice);
  } catch (_error) {
    return null;
  }
};

export default getEstimatedFees;
