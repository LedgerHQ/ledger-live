import type { Operation } from "../../types";
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature },
}): Promise<Operation> {
  const algorandAccount = await coreAccount.asAlgorandAccount();
  let hash = "";
  hash = await algorandAccount.broadcastRawTransaction(signature);
  const op = patchOperationWithHash(operation, hash);
  return op;
}

export default makeBroadcast({
  broadcast,
});
