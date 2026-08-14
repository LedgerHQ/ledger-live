import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction, TronAccount } from "../types";
import createTransaction from "./createTransaction";
import getEstimatedFees, {
  computeSponsoredUsdtFee,
  getFeeResourceBreakdown,
} from "./getEstimateFees";

const estimateMaxSpendable: AccountBridge<
  Transaction,
  TronAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const txForFees: Transaction = {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    // Placeholder when no recipient is set yet; a valid Tron address (self) keeps the TRC20 energy
    // simulation in the sponsored-fee path from failing to decode an Ethereum-style address.
    recipient: transaction?.recipient || mainAccount.freshAddress,
    amount: new BigNumber(0),
  };
  // The parent (TRX) account's max is its spendable balance minus the network fees; the token
  // account's max is its balance minus only the sponsored USDT rental fee (TRX fees are charged to
  // the parent, not the token), so skip the unused fee estimation for token accounts.
  if (account.type !== "TokenAccount") {
    const fees = await getEstimatedFees(mainAccount, txForFees, undefined);
    return BigNumber.max(0, account.spendableBalance.minus(fees));
  }

  // Reserve the sponsored USDT rental fee so "Max" doesn't overshoot what getTransactionStatus will
  // accept (LIVE-32777). Only quote for a sponsored send; useAllAmount makes the energy simulation
  // use the token balance rather than a 0-amount transfer.
  let rentalFee = new BigNumber(0);
  if (transaction?.energyProviderInfo) {
    const txForRent: Transaction = { ...txForFees, useAllAmount: true };
    const breakdown = await getFeeResourceBreakdown(mainAccount, txForRent, account);
    rentalFee = await computeSponsoredUsdtFee(mainAccount, txForRent, account, breakdown);
  }
  return BigNumber.max(0, account.balance.minus(rentalFee));
};

export default estimateMaxSpendable;
