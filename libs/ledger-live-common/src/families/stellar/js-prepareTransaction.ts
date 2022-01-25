import invariant from "invariant";
import { fetchAccountNetworkInfo } from "./api";
import type { Account } from "../../types";

import type { Transaction } from "./types";

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  const networkInfo: any = t.networkInfo || (await fetchAccountNetworkInfo(a));
  invariant(networkInfo.family === "stellar", "stellar networkInfo expected");
  const fees = t.fees || networkInfo.fees;
  const baseReserve = t.baseReserve || networkInfo.baseReserve;

  if (
    t.networkInfo !== networkInfo ||
    t.fees !== fees ||
    t.baseReserve !== baseReserve
  ) {
    return { ...t, networkInfo, fees, baseReserve };
  }

  return t;
};

export default prepareTransaction;
