import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { CryptoCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { AccountBridge } from "@ledgerhq/types-live";
import { broadcast as broadcastLogic } from "../common-logic";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const { operation, signature } = signedOperation;
  const hash = await broadcastLogic(
    { ...account.currency, id: CryptoCurrencyIdSchema.parse(account.currency.id) },
    signature,
  );
  if (!hash) {
    throw new Error("canton: broadcast returned no transaction id");
  }
  return patchOperationWithHash(operation, hash);
};
