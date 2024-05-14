import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { PolkadotAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";
import { buildTransaction } from "./buildTransaction";
import { estimateFees } from "../logic";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export default async function getEstimatedFees({
  a,
  t,
}: {
  a: PolkadotAccount;
  t: Transaction;
}): Promise<BigNumber> {
  await loadPolkadotCrypto();

  const transaction = {
    ...t,
    recipient: getAbandonSeedAddress(a.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      a,
      t: { ...t, fees: new BigNumber(0) },
    }), // Remove fees if present since we are fetching fees
  };

  const tx = await buildTransaction(a, transaction);
  const fees = await estimateFees(tx);
  return new BigNumber(fees.toString());
}
