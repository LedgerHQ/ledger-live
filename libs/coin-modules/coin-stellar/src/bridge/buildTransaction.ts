import { AmountRequired, FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { craftTransaction } from "../logic";
import type { Transaction } from "../types";
import { getAmountValue } from "./logic";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export async function buildTransaction(account: Account, transaction: Transaction) {
  const { recipient, networkInfo, fees, memoType, memoValue, mode, assetCode, assetIssuer } =
    transaction;

  invariant(networkInfo && networkInfo.family === "stellar", "stellar family");

  if (!fees) {
    throw new FeeNotLoaded();
  }

  const amount = getAmountValue(account, transaction, fees);

  if (!amount) {
    throw new AmountRequired();
  }

  const { transaction: built } = await craftTransaction(
    { address: account.freshAddress },
    {
      type: mode,
      recipient,
      amount: BigInt(amount.toString()),
      fee: BigInt(fees.toString()),
      assetCode,
      assetIssuer,
      memoType,
      memoValue,
    },
  );

  return built;
}

export default buildTransaction;
