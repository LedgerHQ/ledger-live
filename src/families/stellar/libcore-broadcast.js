// @flow
import { log } from "@ledgerhq/logs";
import type { Operation } from "../../types";
import { makeBroadcast } from "../../libcore/broadcast";
import { patchOperationWithHash } from "../../operation";

const THRESHOLD_FALSE_NEGATIVE_BROADCAST_FAILURE = 20 * 1000;

async function broadcast({
  coreAccount,
  signedOperation: { operation, signature },
}): Promise<Operation> {
  const stellarLikeAccount = await coreAccount.asStellarLikeAccount();
  let hash = "";
  let startTime = Date.now();
  try {
    hash = await stellarLikeAccount.broadcastRawTransaction(signature);
  } catch (e) {
    // sometimes a failing broadcast still means the tx went out so we must assume it's a success.
    // FIXME when mobile have the e.status again, we should match for 504 http code too
    if (Date.now() - startTime > THRESHOLD_FALSE_NEGATIVE_BROADCAST_FAILURE) {
      log(
        "stellar-error",
        "error occurred but was long enough to assume it's a success. " +
          String(e)
      );
    } else {
      throw e;
    }
  }
  return patchOperationWithHash(operation, hash);
}

export default makeBroadcast({ broadcast });
