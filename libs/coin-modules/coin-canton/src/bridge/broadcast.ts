import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account, BroadcastArg, Operation } from "@ledgerhq/types-live";
import type { CantonContext } from "../config";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { getCurrencyContext } from "./context";

export const broadcast = async (
  context: CantonContext,
  { account, signedOperation }: BroadcastArg<Account>,
): Promise<Operation> => {
  const { operation, signature } = signedOperation;
  const hash = await broadcastLogic(getCurrencyContext(context, account.currency), signature);
  return patchOperationWithHash(operation, hash);
};
