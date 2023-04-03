// @flow
import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import { Subject } from "rxjs";
import { first } from "rxjs/operators";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { setSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/wallet-btc/crypto/secp256k1";
import { retry } from "@ledgerhq/live-common/promise";
import { listen as listenLogs } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import { initWorker } from "./webworkers";
import logger from "./logger";

listenLogs(({ id, date, ...log }) => {
  if (log.type === "hid-frame") return;
  logger.debug(log);
});

setEnvOnAllThreads("USER_ID", getUserId());

// This defines our IPC Transport that will proxy to an internal process (we shouldn't use node-hid on renderer)
registerTransportModule({
  id: "ipc",
  open: id => retry(() => IPCTransport.open(id)),
  disconnect: () => Promise.resolve(),
});

// We proxy the secp256k1 calls to a webworker because it is a CPU intensive task

// we spawn a few workers to tackle the publicKeyTweakAdd requests
const publicKeyTweakAddWorkerCount = 3;
const publicKeyTweakAddWorkerResponses = new Subject();
const workers = Array(publicKeyTweakAddWorkerCount)
  .fill(null)
  .map(async (_, i) => {
    const worker = await initWorker("../../webworkers/workers/publicKeyTweakAdd.ts");
    worker.onmessage = e => publicKeyTweakAddWorkerResponses.next(e.data);
    return worker;
  });
let idCounter = 0;
function runJob(message) {
  const id = idCounter++;
  const worker = workers[id % publicKeyTweakAddWorkerCount]; // round robin with the counter
  return worker.then(w => {
    const promise = publicKeyTweakAddWorkerResponses.pipe(first(e => e.id === id)).toPromise();
    w.postMessage({ ...message, id });
    return promise;
  });
}

// We can configure the implementation of publicKeyTweakAdd to use our webworkers
setSecp256k1Instance({
  async publicKeyTweakAdd(publicKey, tweak) {
    // we serialize to hex for a minimal size exchange instead of sending .buffer (it seems publicKey and tweak use huge buffers)
    const { response } = await runJob({
      publicKey: Buffer.from(publicKey).toString("hex"),
      tweak: Buffer.from(tweak).toString("hex"),
    });
    return new Uint8Array(Buffer.from(response, "hex").toJSON().data);
  },
});
