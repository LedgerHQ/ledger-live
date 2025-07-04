import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

export function genericPrepareTransaction(
  network: string,
  kind: "local" | "remote",
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(account, transaction),
    );
    const bnFee = BigNumber(fees.value.toString());

    if (!bnEq(transaction.fees, bnFee)) {
      return { ...transaction, fees: bnFee };
    }

    return transaction;
  };
}
