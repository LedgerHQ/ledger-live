import { log } from "@ledgerhq/logs";
import { patchOperationWithHash } from "../../operation";
import type { Account, Operation, SignedOperation } from "../../types";
import { ChainAPI } from "./api";

export const broadcastWithAPI = async (
  {
    account,
    signedOperation,
  }: {
    account: Account;
    signedOperation: SignedOperation;
  },
  api: ChainAPI
): Promise<Operation> => {
  const { signature, operation } = signedOperation;

  try {
    const txSignature = await api.sendRawTransaction(
      Buffer.from(signature, "hex")
    );
    return patchOperationWithHash(operation, txSignature);
  } catch (e: any) {
    // heuristics to make some errors more user friendly
    if (e instanceof Error) {
      log("broadcast-error", e.message);

      if (
        e.message.includes("simulation failed") &&
        account.pendingOperations.length > 0
      ) {
        throw new Error(
          "Your previous transaction hasn't been processed yet. Please wait a moment then check the transaction history before trying again."
        );
      }

      if (e.message.includes("was not confirmed in")) {
        throw new Error(
          "Your transaction may have failed. Please wait a moment then check the transaction history before trying again."
        );
      }
    }

    throw e;
  }
};
