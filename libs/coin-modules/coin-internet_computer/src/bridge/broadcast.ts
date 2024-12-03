import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn } from "./bridgeHelpers/icpRosetta";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  // log("debug", "[broadcast] start fn");

  await broadcastTxn(signature);

  const result = { ...operation };

  return result;
};
