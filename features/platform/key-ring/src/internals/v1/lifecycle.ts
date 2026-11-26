import type { TrustchainLifecycle } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { KeyRingStream } from "../../types";
import type { LifecycleHub } from "../lifecycleHub";
import { streamRefOf, v1Stream } from "./stream";

/** The v1 SDK takes one lifecycle at construction: this one forwards to whatever is registered. */
export function v1Lifecycle(hub: LifecycleHub): TrustchainLifecycle {
  return {
    async onTrustchainRotation(sdk, oldTrustchain, memberCredentials) {
      // Sequential on purpose: handlers run in registration order.
      const afterRotation: Array<(next: KeyRingStream) => Promise<void>> = [];
      for (const handler of hub.rotationHandlers()) {
        afterRotation.push(await handler(v1Stream(sdk, oldTrustchain, memberCredentials)));
      }
      return async newTrustchain => {
        for (const after of afterRotation) {
          await after(v1Stream(sdk, newTrustchain, memberCredentials));
        }
        hub.emit({ type: "key-rotated", tree: streamRefOf(newTrustchain) });
      };
    },
  };
}
