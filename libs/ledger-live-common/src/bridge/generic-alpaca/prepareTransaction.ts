import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { GenericTransaction } from "./types";
import isEqual from "lodash/isEqual";

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
    const { getAssetFromToken, computeIntentType, estimateFees } = getAlpacaApi(
      account.currency.id,
      kind,
    );
    const { assetReference, assetOwner } = getAssetFromToken
      ? getAssetInfos(transaction, account.freshAddress, getAssetFromToken)
      : assetInfosFallback(transaction);

    const next: GenericTransaction = {
      ...transaction,
      assetOwner,
      assetReference,
    };

    const useAllAmount = !!next.useAllAmount || ["stake", "unstake"].includes(next.mode ?? "");

    // Anticipate use cases where token amounts impact fee calculuses
    if (useAllAmount && next.subAccountId) {
      const subAccount = account.subAccounts?.find(sub => sub.id === next.subAccountId);

      next.amount = subAccount?.spendableBalance ?? new BigNumber(0);
    }

    const intent = transactionToIntent(account, next, computeIntentType);
    const estimation = await estimateFees(intent);
    const customFeesValue = next.customFees?.parameters?.fees; // e.g. Stellar

    next.fees = customFeesValue ?? new BigNumber(estimation.value.toString());

    const fieldsToPropagate = ["storageLimit"] as const;

    for (const field of fieldsToPropagate) {
      const parameter = estimation.parameters?.[field];

      if (
        typeof parameter === "bigint" ||
        typeof parameter === "number" ||
        typeof parameter === "string"
      ) {
        next[field] = new BigNumber(parameter.toString());
      }
    }

    // Fees are now fixed, compute max spendable native
    if (useAllAmount && !next.subAccountId) {
      // Check if the estimation has been done for a custom amount
      const estimatedAmount = estimation.parameters?.amount;
      if (
        typeof estimatedAmount === "bigint" ||
        typeof estimatedAmount === "number" ||
        typeof estimatedAmount === "string"
      ) {
        next.amount = new BigNumber(estimatedAmount.toString());
      } else {
        next.amount = account.spendableBalance.gt(next.fees)
          ? account.spendableBalance.minus(next.fees)
          : new BigNumber(0);
      }
    }

    // Maintain reference if the transaction hasn't change.
    // Not keeping the object reference results in our various `useEffect`s to detect
    // changes and trigger their effect callback, even if objects stay deeply equal.
    // More specifically in `libs/ledger-live-common/src/hw/actions/transaction.ts`:
    // returning different references implies calling `signOperation` and the device
    // several times, which negatively affects the UI and prompts for multiple signatures.
    return isEqual(transaction, next) ? transaction : next;
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
