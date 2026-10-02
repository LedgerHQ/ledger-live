import type { Store } from "redux";
import { selectCachedFlagsSettled, type WithFeatureFlags } from "@shared/feature-flags";

/**
 * Resolves once the feature-flags cache read has settled, so `resolved` holds the values Firebase
 * last sent to this device. Local only: it never waits on the network.
 */
export function whenCachedFlagsSettled(
  store: Pick<Store<WithFeatureFlags>, "getState" | "subscribe">,
): Promise<void> {
  return new Promise(resolve => {
    let unsubscribe: (() => void) | undefined;
    const check = () => {
      if (!selectCachedFlagsSettled(store.getState())) return;
      unsubscribe?.();
      resolve();
    };
    // Subscribed before the first check so a settle can never slip through the gap between them.
    unsubscribe = store.subscribe(check);
    check();
  });
}
