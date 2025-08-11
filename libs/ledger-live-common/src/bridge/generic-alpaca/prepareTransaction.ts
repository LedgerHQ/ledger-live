import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { NetworkInfo } from "./createTransaction";

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
      assetReference?: string;
      assetOwner?: string;
      subAccountId?: string;
      networkInfo?: NetworkInfo | null;
    },
  ) => {
    const [assetReference, assetOwner] = getAssetInfos(transaction);
    const alpacaApi = getAlpacaApi(network, kind);
    const intent = transactionToIntent(account, {
      ...transaction,
      fees: transaction.fees ? BigInt(transaction.fees.toString()) : 0n,
    });
    const fees = await alpacaApi.estimateFees(intent);
    // NOTE: this is problematic, we should maybe have a method / object that lists what field warrant an update per chain
    // for reference, stellar checked this:
    // transaction.networkInfo !== networkInfo ||
    // transaction.baseReserve !== baseReserve
    if (!bnEq(transaction.fees, new BigNumber(fees.value.toString()))) {
      const next: any = {
        ...transaction,
        fees: new BigNumber(fees.value.toString()),
        assetReference,
        assetOwner,
        networkInfo: {
          fees: new BigNumber(fees.value.toString()),
        },
      };
      // propagate storageLimit fee parameter when present (ex: tezos)
      const params = fees?.parameters as Record<string, unknown> | undefined;
      if (params) {
        const storageLimit = params["storageLimit"];
        if (
          storageLimit !== undefined &&
          (typeof storageLimit === "bigint" || typeof storageLimit === "number" || typeof storageLimit === "string")
        ) {
          (next as any).storageLimit = new BigNumber(storageLimit.toString());
        }
      }

      // align with stellar/xrp: when send max (or staking intents), reflect validated amount in UI
      if (transaction.useAllAmount || transaction["mode"] === "stake" || transaction["mode"] === "unstake") {
        const { amount } = await alpacaApi.validateIntent(intent);
        next.amount = new BigNumber(amount.toString());
      }
      return next;
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
