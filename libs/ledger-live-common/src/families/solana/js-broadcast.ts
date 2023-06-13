import { log } from "@ledgerhq/logs";
import { patchOperationWithHash } from "../../operation";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { ChainAPI } from "./api";
import { SolanaTxConfirmationTimeout, SolanaTxSimulationFailedWhilePendingOp } from "./errors";

export const broadcastWithAPI = async (
  {
    account,
    signedOperation,
  }: {
    account: Account;
    signedOperation: SignedOperation;
  },
  api: ChainAPI,
): Promise<Operation> => {
  const { signature, operation } = signedOperation;

  try {
    const txSignature = await api.sendRawTransaction(Buffer.from(signature, "hex"));
    return patchOperationWithHash(operation, txSignature);
  } catch (e: any) {
    // heuristics to make some errors more user friendly
    if (e instanceof Error) {
      log("broadcast-error", e.message);

      if (e.message.includes("simulation failed") && account.pendingOperations.length > 0) {
        throw new SolanaTxSimulationFailedWhilePendingOp();
      }

      if (e.message.includes("was not confirmed in")) {
        throw new SolanaTxConfirmationTimeout();
      }
    }

    throw e;
  }
};
