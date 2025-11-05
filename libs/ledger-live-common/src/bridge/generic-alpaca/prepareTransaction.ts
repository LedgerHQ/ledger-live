import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
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

function propagateField(estimation: FeeEstimation, field: string, dest: GenericTransaction): void {
  const value = estimation?.parameters?.[field];

  if (typeof value !== "bigint" && typeof value !== "number" && typeof value !== "string") return;

  switch (field) {
    case "type":
      dest[field] = Number(value.toString());
      return;
    case "storageLimit":
      dest[field] = new BigNumber(value.toString());
      return;
    default:
      return;
  }
}

export function genericPrepareTransaction(
  network: string,
  kind,
): AccountBridge<GenericTransaction, Account>["prepareTransaction"] {
  return async (account, transaction: GenericTransaction) => {
    const { getAssetFromToken, computeIntentType, estimateFees, validateIntent } = getAlpacaApi(
      account.currency.id,
      kind,
    );
    const { assetReference, assetOwner } = getAssetFromToken
      ? getAssetInfos(transaction, account.freshAddress, getAssetFromToken)
      : assetInfosFallback(transaction);
    const customParametersFees = transaction.customFees?.parameters?.fees;
    const estimation: FeeEstimation = customParametersFees
      ? { value: BigInt(customParametersFees.toFixed()) }
      : await estimateFees(
          transactionToIntent(
            account,
            {
              ...transaction,
            },
            computeIntentType,
          ),
        );
    const fees = new BigNumber(estimation.value.toString());

    if (!bnEq(transaction.fees, fees)) {
      const next: GenericTransaction = {
        ...transaction,
        fees,
        assetReference,
        assetOwner,
        customFees: {
          parameters: {
            fees: customParametersFees ? new BigNumber(customParametersFees.toString()) : undefined,
          },
        },
      };

      // Propagate needed fields
      const fieldsToPropagate = ["type", "storageLimit"];

      for (const field of fieldsToPropagate) {
        propagateField(estimation, field, next);
      }

      // align with stellar/xrp: when send max (or staking intents), reflect validated amount in UI
      if (transaction.useAllAmount || ["stake", "unstake"].includes(transaction.mode ?? "")) {
        const { amount } = await validateIntent(
          transactionToIntent(
            account,
            {
              ...transaction,
            },
            computeIntentType,
          ),
        );
        next.amount = new BigNumber(amount.toString());
      }
      return next;
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
