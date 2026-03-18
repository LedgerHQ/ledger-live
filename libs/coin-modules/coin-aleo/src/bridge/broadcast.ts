import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { broadcast as logicBroadcast } from "../logic/broadcast";

export const broadcast: AccountBridge<AleoTransaction, AleoAccount>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const hash = await logicBroadcast({
    account,
    signedTx: signedOperation.signature,
  });
  return patchOperationWithHash(signedOperation.operation, hash);
};
