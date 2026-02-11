import { AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { bigNumberToBigIntDeep, extractBalances, transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { GenericTransaction } from "./types";
import { computeIntentType } from "../computeIntentType";
import { getAssetFromToken } from "./token";

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
    case "gasLimit":
    case "gasPrice":
    case "maxFeePerGas":
    case "maxPriorityFeePerGas":
    case "additionalFees":
      dest[field] = new BigNumber(value.toString());
      return;
    default:
      return;
  }
}

export function genericPrepareTransaction(
  network: string,
  kind: string,
): AccountBridge<GenericTransaction>["prepareTransaction"] {
  return async (account, transaction) => {
    const { estimateFees, validateIntent } = getAlpacaApi(account.currency.id, kind);
    const { assetReference, assetOwner } = getAssetFromToken
      ? await getAssetInfos(
          transaction,
          account.freshAddress,
          getAssetFromToken(network, account.currency),
        )
      : assetInfosFallback(transaction);
    const customParametersFees = transaction.customFees?.parameters?.fees;

    /**
     * Ticking `useAllAmount` constantly resets the amount to 0. This is problematic
     * because some Blockchain need the actual transaction amount to compute the fees
     * (Example with EVM and ERC20 transactions)
     * In case of `useAllAmount` and token transaction, we read the token account spendable
     * balance instead.
     */
    let amount = transaction.amount;
    if (transaction.useAllAmount && transaction.subAccountId) {
      const subAccount = account.subAccounts?.find(acc => acc.id === transaction.subAccountId);
      amount = subAccount?.spendableBalance ?? amount;
    }

    // Pass any parameters that help estimating fees
    // This includes `assetOwner` and `assetReference` that are not used by some apps that only rely on `subAccountId`
    // TODO Remove `assetOwner` and `assetReference` in order to maintain one unique way of identifying the type of asset
    // https://ledgerhq.atlassian.net/browse/LIVE-24044
    const intent = transactionToIntent(
      account,
      {
        ...transaction,
        assetOwner,
        assetReference,
        amount,
      },
      computeIntentType(network),
    );
    const customFeesParameters = bigNumberToBigIntDeep({
      gasPrice: transaction.gasPrice,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      gasLimit: transaction.customGasLimit,
      gasOptions: transaction.gasOptions,
    });
    const estimation: FeeEstimation = customParametersFees
      ? { value: BigInt(customParametersFees.toFixed()) }
      : await estimateFees(intent, customFeesParameters);
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
      const fieldsToPropagate = [
        "type",
        "storageLimit",
        "gasLimit",
        "gasPrice",
        "maxFeePerGas",
        "maxPriorityFeePerGas",
        "additionalFees",
      ];

      for (const field of fieldsToPropagate) {
        propagateField(estimation, field, next);
      }

      // align with stellar/xrp: when send max (or staking intents), reflect validated amount in UI
      if (transaction.useAllAmount || ["stake", "unstake"].includes(transaction.mode ?? "")) {
        // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22228
        const { amount } = await validateIntent(
          transactionToIntent(
            account,
            {
              ...transaction,
              assetOwner,
              assetReference,
            },
            computeIntentType(network),
          ),
          extractBalances(account, getAssetFromToken),
        );
        next.amount = new BigNumber(amount.toString());
      }
      return next;
    }

    return transaction;
  };
}

export async function getAssetInfos(
  tr: GenericTransaction,
  owner: string,
  getAssetFromToken: (token: TokenCurrency, owner: string) => AssetInfo,
): Promise<{
  assetReference: string;
  assetOwner: string;
}> {
  if (tr.subAccountId) {
    const { token } = await decodeTokenAccountId(tr.subAccountId);

    if (!token) return assetInfosFallback(tr);

    const asset = getAssetFromToken(token, owner);

    return {
      assetOwner: ("assetOwner" in asset && asset.assetOwner) || "",
      assetReference: ("assetReference" in asset && asset.assetReference) || "",
    };
  }
  return assetInfosFallback(tr);
}
