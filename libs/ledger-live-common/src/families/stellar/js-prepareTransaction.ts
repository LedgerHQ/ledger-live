import invariant from "invariant";
import { fetchAccountNetworkInfo } from "./api";
import type { Account } from "@ledgerhq/types-live";
import { getAssetCodeIssuer } from "./logic";
import type { Transaction } from "./types";

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  const networkInfo: any = t.networkInfo || (await fetchAccountNetworkInfo(a));
  invariant(networkInfo.family === "stellar", "stellar networkInfo expected");
  const fees = t.fees || networkInfo.fees;
  const baseReserve = t.baseReserve || networkInfo.baseReserve;
  const [assetCode, assetIssuer] = getAssetCodeIssuer(t);

  if (
    t.networkInfo !== networkInfo ||
    t.fees !== fees ||
    t.baseReserve !== baseReserve
  ) {
    return { ...t, networkInfo, fees, baseReserve, assetCode, assetIssuer };
  }

  return { ...t, assetCode, assetIssuer };
};

export default prepareTransaction;
