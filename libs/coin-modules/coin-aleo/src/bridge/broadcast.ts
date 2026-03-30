import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import aleoCoinConfig from "../config";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { broadcast as logicBroadcast } from "../logic/broadcast";

export const broadcast: AccountBridge<AleoTransaction, AleoAccount>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency);

  const hash = await logicBroadcast({
    configOrCurrencyId: config,
    account,
    signedTx: signedOperation.signature,
  });

  return patchOperationWithHash(signedOperation.operation, hash);
};
