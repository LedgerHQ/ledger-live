import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { SolanaTxConfirmationTimeout, SolanaTxSimulationFailedWhilePendingOp } from "./errors";
import { ChainAPI } from "./network";

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
  const { signature, operation, rawData } = signedOperation;

  try {
    const txSignature = await api.sendRawTransaction(
      Buffer.from(signature, "hex"),
      rawData?.recentBlockhash as BlockhashWithExpiryBlockHeight,
    );
    return patchOperationWithHash(operation, txSignature);
  } catch (e) {
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
