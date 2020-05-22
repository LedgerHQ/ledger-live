// @flow
import type { Operation } from "../../types";
import type { CosmosBroadcastResponse } from "./types";
import { makeBroadcast } from "../../libcore/broadcast";
import { CosmosBroadcastError } from "../../errors";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature },
}): Promise<Operation> {
  const cosmosLikeAccount = await coreAccount.asCosmosLikeAccount();
  const res = await cosmosLikeAccount.broadcastRawTransaction(signature);
  const parsed: CosmosBroadcastResponse = JSON.parse(res);
  if (parsed.code) {
    throw new CosmosBroadcastError[parsed.code]();
  }

  // Note : 0 is the index of transaction because cosmos can contains 1 or more operations in a transaction
  return {
    ...operation,
    hash: parsed.txhash,
    id: `${operation.accountId}-${parsed.txhash}-0-${operation.type}`,
  };
}

export default makeBroadcast({ broadcast });
