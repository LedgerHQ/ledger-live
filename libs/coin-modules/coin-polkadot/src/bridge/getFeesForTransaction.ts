import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { BigNumber } from "bignumber.js";
import type { PolkadotContext } from "../config";
import { POLKADOT_NULL_ADDRESS } from "../constants";
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
export default async function getEstimatedFees(
  context: PolkadotContext,
  {
    account,
    transaction,
  }: {
    account: PolkadotAccount;
    transaction: Transaction;
  },
): Promise<BigNumber> {
  await loadPolkadotCrypto();

  const config = await context.config(account.currency.id);
  const t = {
    ...transaction,
    recipient: POLKADOT_NULL_ADDRESS,
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      config,
      account,
      transaction: { ...transaction, fees: new BigNumber(0) },
    }), // Remove fees if present since we are fetching fees
  };
  const currency: CryptoCurrency = getCryptoCurrencyById(account.currency.id);

  const tx = await buildTransaction(context, account, t);
  const fees = await estimateFees(config, tx, currency);
  return new BigNumber(fees.toString());
}
