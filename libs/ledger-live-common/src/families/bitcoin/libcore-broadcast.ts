import { patchOperationWithHash } from "../../operation";
import { makeBroadcast } from "../../libcore/broadcast";

async function broadcast({
  coreAccount,
  signedOperation: { signature, operation },
}) {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const txHash = await bitcoinLikeAccount.broadcastRawTransaction(signature);
  return patchOperationWithHash(operation, txHash);
}

export default makeBroadcast({
  broadcast,
});
