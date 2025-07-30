import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

export function genericPrepareTransaction(
  network: string,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (
    account,
    transaction: TransactionCommon & {
      fees: BigNumber | null | undefined;
      assetCode?: string;
      assetIssuer?: string;
      subAccountId?: string;
    },
  ) => {
    const [assetCode, assetIssuer] = getAssetCodeIssuer(transaction);
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(account, {
        ...transaction,
        fees: transaction.fees ? BigInt(transaction.fees.toString()) : 0n,
      }),
    );
    // NOTE: this is problematic, we should maybe have a method / object that lists what field warrant an update per chain
    // for reference, stellar checked this:
    // transaction.networkInfo !== networkInfo ||
    // transaction.baseReserve !== baseReserve
    if (!bnEq(transaction.fees, new BigNumber(fees.value.toString()))) {
      return { ...transaction, fees: new BigNumber(fees.value.toString()), assetCode, assetIssuer };
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
