import invariant from "invariant";
import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchAccountNetworkInfo } from "../network";
import { getAssetCodeIssuer } from "./logic";
import type { Transaction } from "../types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const networkInfo = transaction.networkInfo || (await fetchAccountNetworkInfo(account));
  invariant(networkInfo.family === "stellar", "stellar networkInfo expected");
  const fees = transaction.fees || networkInfo.fees;
  const baseReserve = transaction.baseReserve || networkInfo.baseReserve;
  const [assetCode, assetIssuer] = getAssetCodeIssuer(transaction);

  if (
    transaction.networkInfo !== networkInfo ||
    transaction.fees !== fees ||
    transaction.baseReserve !== baseReserve
  ) {
    return updateTransaction(transaction, {
      networkInfo,
      fees,
      baseReserve,
      assetCode,
      assetIssuer,
    });
  }

  return updateTransaction(transaction, { assetCode, assetIssuer });
};

export default prepareTransaction;
