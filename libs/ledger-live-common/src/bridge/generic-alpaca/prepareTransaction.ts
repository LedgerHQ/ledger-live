import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

type TransactionParam = TransactionCommon & {
  fees: BigNumber | null | undefined;
  customFees?: FeeEstimation;
  assetReference?: string;
  assetOwner?: string;
  subAccountId?: string;
};

function assetInfosFallback(transaction: TransactionParam): {
  assetReference: string;
  assetOwner: string;
} {
  return {
    assetReference: transaction.assetReference ?? "",
    assetOwner: transaction.assetOwner ?? "",
  };
}

export function genericPrepareTransaction(
  network: string,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (account, transaction: TransactionParam) => {
    const { getAssetFromToken } = getAlpacaApi(network, kind);
    const { assetReference, assetOwner } = getAssetFromToken
      ? getAssetInfos(transaction, account.freshAddress, getAssetFromToken)
      : assetInfosFallback(transaction);

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
  tr: TransactionParam,
  owner: string,
  getAssetFromToken: (token: TokenCurrency, owner: string) => AssetInfo,
): {
  assetReference: string;
  assetOwner: string;
} {
  if (tr.subAccountId) {
    const { token } = decodeTokenAccountId(tr.subAccountId);

    if (!token) return assetInfosFallback(tr);

    const asset = getAssetFromToken(token, owner);

    return {
      assetOwner: ("assetOwner" in asset && asset.assetOwner) || "",
      assetReference: ("assetReference" in asset && asset.assetReference) || "",
    };
  }
  return assetInfosFallback(tr);
}
