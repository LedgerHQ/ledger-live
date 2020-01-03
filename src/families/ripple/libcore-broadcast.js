// @flow
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature }
}) {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();
  const txHash = await rippleLikeAccount.broadcastRawTransaction(signature);
  return patchOperationWithHash(operation, txHash);
}

export default makeBroadcast({ broadcast });
