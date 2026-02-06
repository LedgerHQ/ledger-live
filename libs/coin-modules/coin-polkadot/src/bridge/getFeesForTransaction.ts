import { getAbandonSeedAddress, getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { estimateFees } from "../logic";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import type { PolkadotAccount, Transaction } from "../types";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";

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
  account: PolkadotAccount;
  transaction: Transaction;
}): Promise<BigNumber> {
  await loadPolkadotCrypto();

  const t = {
    ...transaction,
    recipient: getAbandonSeedAddress(account.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      account,
      transaction: { ...transaction, fees: new BigNumber(0) },
    }), // Remove fees if present since we are fetching fees
  };
  const currency: CryptoCurrency = getCryptoCurrencyById(account.currency.id);

  const tx = await buildTransaction(account, t);
  const fees = await estimateFees(tx, currency);
  return new BigNumber(fees.toString());
}
