import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import aleoCoinConfig from "../config";
import type { AleoAccount, AleoOperation, Transaction as AleoTransaction } from "../types";
import { broadcast as logicBroadcast } from "../logic/broadcast";

export const broadcast: AccountBridge<AleoTransaction, AleoAccount>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const config = aleoCoinConfig.getCoinConfig(account.currency.id);

  const transaction = await logicBroadcast({
    configOrCurrencyId: config,
    account,
    signedTx: signedOperation.signature,
  });

  const op = patchOperationWithHash(signedOperation.operation, transaction.id) as AleoOperation;

  return {
    ...op,
    extra: {
      ...op.extra,
      firstTransitionId: transaction.execution.transitions[0].id,
    },
  };
};
