import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "../../operation";
import { apiForCurrency } from "./api";
import { Transaction } from "./types";

const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { operation, signature },
}) => {
  const api = apiForCurrency(account.currency);
  const hash = await api.broadcastTransaction(signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
