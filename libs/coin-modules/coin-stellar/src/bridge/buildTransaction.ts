import invariant from "invariant";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { craftTransaction } from "../logic";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export async function buildTransaction(account: Account, transaction: Transaction) {
  const { recipient, networkInfo, fees, memoType, memoValue, mode, assetCode, assetIssuer } =
    transaction;

  if (!fees) {
    throw new FeeNotLoaded();
  }

  invariant(networkInfo && networkInfo.family === "stellar", "stellar family");

  const { transaction: built } = await craftTransaction(
    { address: account.freshAddress },
    {
      mode,
      recipient,
      amount: BigInt(transaction.amount.toString()),
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
