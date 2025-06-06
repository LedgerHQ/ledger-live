import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

export function genericPrepareTransaction(
  network,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (
    _account,
    transaction: TransactionCommon & { fees: BigNumber; assetCode?: string; assetIssuer?: string },
  ) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(_account, transaction),
    );
    const bnFee = BigNumber(fees.value.toString());
    if (transaction?.subAccountId) {
      const [assetCode, assetIssuer] = getAssetCodeIssuer(transaction);
      return updateTransaction(transaction, {
        fees: bnFee,
        assetCode,
        assetIssuer,
      });
    }

    if (!bnEq(transaction.fees, bnFee)) {
      return { ...transaction, fees: bnFee };
    }

    return transaction;
  };
}

export function getAssetCodeIssuer(
  tr: TransactionCommon & { assetCode?: string; assetIssuer?: string },
): string[] {
  if (tr.subAccountId) {
    const assetString = tr.subAccountId.split("+")[1];
    return assetString.split(":");
  }
  return [tr.assetCode || "", tr.assetIssuer || ""];
}
