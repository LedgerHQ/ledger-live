import { BigNumber } from "bignumber.js";
import type { IconAccount, Transaction } from "./types";
import { getFees } from "./api/node";
import { buildTransaction } from "./buildTransaction";
import { getStepPrice } from "./api/node";
import { FEES_SAFETY_BUFFER, calculateAmount } from "./logic";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {IconAccount} account
 * @param {Transaction} transaction
 */
const getEstimatedFees = async ({
  account,
  transaction,
}: {
  account: IconAccount;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const tx = {
    ...transaction,
    recipient: getAbandonSeedAddress(account.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      account,
      transaction: {
        ...transaction,
        fees: new BigNumber(0),
      },
    }), // Remove fees if present since we are fetching fees
  };
  try {
    const { unsigned } = await buildTransaction(account, tx);
    const stepLimit = await getFees(unsigned, account);
    transaction.stepLimit = stepLimit;
    const stepPrice = await getStepPrice(account);
    return stepLimit.multipliedBy(stepPrice);
  } catch (_error) {
    // Fix ME, the API of Icon throws an error when getting the fee with maximum balance
    return FEES_SAFETY_BUFFER;
  }
};

export default getEstimatedFees;
