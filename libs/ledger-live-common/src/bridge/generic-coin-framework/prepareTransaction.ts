import { AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import {
  bigNumberToBigIntDeep,
  extractBalances,
  toGasOptionsFromUnknown,
  transactionToIntent,
} from "./utils";
import BigNumber from "bignumber.js";
import type { AssetInfo, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { decodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { GenericTransaction } from "./types";

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

  switch (field) {
    case "type":
      if (typeof value !== "bigint" && typeof value !== "number" && typeof value !== "string")
        return;
      dest[field] = Number(value.toString());
      return;
    case "storageLimit":
    case "gasLimit":
    case "gasPrice":
    case "maxFeePerGas":
    case "maxPriorityFeePerGas":
    case "additionalFees":
      if (typeof value !== "bigint" && typeof value !== "number" && typeof value !== "string")
        return;
      dest[field] = new BigNumber(value.toString());
      return;
    case "gasOptions": {
      const gasOptions = toGasOptionsFromUnknown(value);
      if (gasOptions) dest.gasOptions = gasOptions;
      return;
    }
    default:
      return;
  }
}

export function genericPrepareTransaction(
  network: string,
  kind: string,
): AccountBridge<GenericTransaction>["prepareTransaction"] {
  return async (account, transaction) => {
    const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
    const bridgeApi = await getBridgeApi(account.currency, network);

    const getAssetFromTokenForCurrency = bridgeApi.getAssetFromToken;
    const { assetReference, assetOwner } = getAssetFromTokenForCurrency
      ? await getAssetInfos(transaction, account.freshAddress, getAssetFromTokenForCurrency)
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
      bridgeApi.computeIntentType,
      coinModuleApi.craftTransactionData,
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
      : await coinModuleApi.estimateFees(intent, customFeesParameters);
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
        "gasPrice",
        // gas limit must not change in case it is custom
        ...(transaction.customGasLimit ? [] : ["gasLimit"]),
        "maxFeePerGas",
        "maxPriorityFeePerGas",
        "additionalFees",
        // Slow/medium/fast presets produced by the coin-module: surfaced as-is
        // so the UI can render fee presets without ever fetching them itself.
        // Families that don't produce them leave this untouched.
        "gasOptions",
      ];

      for (const field of fieldsToPropagate) {
        propagateField(estimation, field, next);
      }

      if (
        transaction.useAllAmount ||
        ["stake", "unstake", "finalize_unstake", "delegate", "undelegate", "redelegate"].includes(
          transaction.mode ?? "",
        )
      ) {
        // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22228
        const { amount } = await coinModuleApi.validateIntent(
          transactionToIntent(
            account,
            {
              ...transaction,
              assetOwner,
              assetReference,
            },
            bridgeApi.computeIntentType,
            coinModuleApi.craftTransactionData,
          ),
          extractBalances(account, getAssetFromTokenForCurrency),
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
