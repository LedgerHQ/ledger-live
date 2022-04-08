import type { Operation } from "../../types";
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature },
}): Promise<Operation> {
  const tezosLikeAccount = await coreAccount.asTezosLikeAccount();
  const hash = await tezosLikeAccount.broadcastRawTransaction(signature);
  return patchOperationWithHash(operation, hash);
}

export default makeBroadcast({
  broadcast,
});
