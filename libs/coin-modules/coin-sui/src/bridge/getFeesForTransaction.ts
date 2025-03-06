import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { SuiAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";
import { buildTransaction } from "./buildTransaction";
import { estimateFees } from "../logic";
// import { loadSui } from "../logic/loadSui";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export default async function getEstimatedFees({
  account,
  transaction,
}: {
  account: SuiAccount;
  transaction: Transaction;
}): Promise<BigNumber> {
  // await loadSui();

  const t = {
    ...transaction,
    recipient: getAbandonSeedAddress(account.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      account,
      transaction: {
        ...transaction,
        fees: new BigNumber(transaction.fees || 0),
      },
    }), // Remove fees if present since we are fetching fees
  };

  // const tx = await buildTransaction(account, t);
  // console.log("getEstimatedFees tx", tx);
  const fees = await estimateFees(account.freshAddress, t);
  return new BigNumber(fees.toString());
}
