import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { FeeEstimation } from "@ledgerhq/coin-framework/api/types";

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
      customFees?: FeeEstimation;
      assetReference?: string;
      assetOwner?: string;
      subAccountId?: string;
    },
  ) => {
    const [assetReference, assetOwner] = getAssetInfos(transaction);

    let fees = transaction.customFees?.parameters?.fees || null;
    if (fees === null) {
      fees = (
        await getAlpacaApi(network, kind).estimateFees(
          transactionToIntent(account, {
            ...transaction,
          }),
        )
      ).value;
    }

    if (!bnEq(transaction.fees, new BigNumber(fees.toString()))) {
      return {
        ...transaction,
        fees: new BigNumber(fees.toString()),
        assetReference,
        assetOwner,
        customFees: {
          parameters: {
            fees: new BigNumber(fees.toString()),
          },
        },
      };
    }

    return transaction;
  };
}

export function getAssetInfos(
  tr: TransactionCommon & { assetReference?: string; assetOwner?: string },
): string[] {
  if (tr.subAccountId) {
    const assetString = tr.subAccountId.split("+")[1];
    return assetString.split(":");
  }
  return [tr.assetReference || "", tr.assetOwner || ""];
}
