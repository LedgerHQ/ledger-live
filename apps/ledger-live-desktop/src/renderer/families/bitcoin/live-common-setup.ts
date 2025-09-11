import { setSecp256k1Instance } from "@ledgerhq/coin-bitcoin/wallet-btc/crypto/secp256k1";
import { Subject, firstValueFrom } from "rxjs";
import { first } from "rxjs/operators";
import { initWorker } from "../../webworkers";

// For production, we proxy the secp256k1 calls to a webworker because it is a CPU intensive task

// we spawn a few workers to tackle the publicKeyTweakAdd requests
const publicKeyTweakAddWorkerCount = 3;
const publicKeyTweakAddWorkerResponses = new Subject<{
  id: number;
  response: string;
  error?: string;
}>();
const workers = Array(publicKeyTweakAddWorkerCount)
  .fill(null)
  .map(async () => {
    const worker = await initWorker("../../webworkers/workers/publicKeyTweakAdd.ts");
    worker.onmessage = e => publicKeyTweakAddWorkerResponses.next(e.data);
    return worker;
  });
let idCounter = 0;
function runJob(message?: {
  publicKey: string;
  tweak: string;
}): Promise<{ response: string; error?: string }> {
  const id = idCounter++;
  const worker = workers[id % publicKeyTweakAddWorkerCount]; // round robin with the counter
  return worker.then(w => {
    const promise = firstValueFrom(publicKeyTweakAddWorkerResponses.pipe(first(e => e.id === id)));
    w.postMessage({ ...message, id });
    return promise;
  });
}

// Due to fact the web worker may fail in dev environment, we run a job to check if it is working
runJob() // Simple ping-pong test
  .then(
    result => {
      if (result.error) {
        throw new Error(result.error);
      }
      // We can configure the implementation of publicKeyTweakAdd to use our webworkers
      setSecp256k1Instance({
        async publicKeyTweakAdd(publicKey, tweak) {
          // we serialize to hex for a minimal size exchange instead of sending .buffer (it seems publicKey and tweak use huge buffers)
          const { response, error } = await runJob({
            publicKey: Buffer.from(publicKey).toString("hex"),
            tweak: Buffer.from(tweak).toString("hex"),
          });

          if (error) {
            throw new Error(error);
          }

          return new Uint8Array(Buffer.from(response, "hex").toJSON().data);
        },
      });
    },
    error => {
      // in error case, we fallback to the default implementation
      console.error("Failed to initialize publicKeyTweakAdd workers", error);
    },
  );

export default {};
