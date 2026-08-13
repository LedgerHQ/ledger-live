import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import { getCoinConfig } from "../config";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { Transaction } from "../types";
import type { CasperContext } from "../types/config";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation, rawData },
}) => {
  invariant(rawData, "casper: rawData is required");
  invariant(typeof rawData.tx === "string", "casper: rawData.tx is required and must be a string");
  const combinedTx = combine(rawData.tx, signature, account.freshAddress);

  const context: CasperContext = {
    config: async () => getCoinConfig(),
    logger: (...args: unknown[]) => log("debug", args.join(" ")),
  };
  const hash = await logicBroadcast(context, combinedTx);
  invariant(hash, "casper: failed to broadcast transaction and get transaction hash");

  const result = patchOperationWithHash(operation, hash);

  return result;
};
