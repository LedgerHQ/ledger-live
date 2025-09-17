import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { GenericTransaction } from "./types";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

function assetInfosFallback(transaction: GenericTransaction): {
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
): AccountBridge<GenericTransaction, Account>["prepareTransaction"] {
  return async (account, transaction: GenericTransaction) => {
    const { getAssetFromToken } = getAlpacaApi(account.currency.id, kind);
    const { assetReference, assetOwner } = getAssetFromToken
      ? getAssetInfos(transaction, account.freshAddress, getAssetFromToken)
      : assetInfosFallback(transaction);

    let fees: BigNumber | bigint | null = transaction.customFees?.parameters?.fees || null;
    if (fees === null) {
      fees = (
        await getAlpacaApi(account.currency.id, kind).estimateFees(
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
  tr: GenericTransaction,
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
