// @flow
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature }
}) {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const txHash = await ethereumLikeAccount.broadcastRawTransaction(signature);
  return patchOperationWithHash(operation, txHash);
}

export default makeBroadcast({
  broadcast
});
