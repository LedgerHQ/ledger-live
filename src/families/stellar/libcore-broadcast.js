// @flow
import type { Operation } from "../../types";
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature }
}): Promise<Operation> {
  const stellarLikeAccount = await coreAccount.asStellarLikeAccount();
  const hash = await stellarLikeAccount.broadcastRawTransaction(signature);
  return patchOperationWithHash(operation, hash);
}

export default makeBroadcast({ broadcast });
