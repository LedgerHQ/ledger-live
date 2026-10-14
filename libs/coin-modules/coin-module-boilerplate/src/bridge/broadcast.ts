import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountBridge } from "@ledgerhq/types-live";
import type { BoilerplateContext } from "../config";
import { broadcast as broadcastLogic } from "../logic/broadcast";
import { Transaction } from "../types";

export const buildBroadcast =
  (context: BoilerplateContext): AccountBridge<Transaction>["broadcast"] =>
  async ({ signedOperation: { signature, operation } }) => {
    const hash = await broadcastLogic(await context.config(), signature);
    return patchOperationWithHash(operation, hash);
  };
