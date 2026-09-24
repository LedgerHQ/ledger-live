import {
  resolveAppLockScheme,
  selectBiometricsEnabled,
  selectHasPassword,
  type WithAppLock,
} from "@features/platform-app-lock";
import {
  selectFeature,
  selectRemoteFlagsReady,
  type WithFeatureFlags,
} from "@shared/feature-flags";
import type { Store } from "redux";

type ProtectionState = WithAppLock & WithFeatureFlags;

// `WaitForAppReady` lets the tree through a second after launch whether the remote flags answered
// or not, and an unanswered flag reads as disabled. Deciding then would wave an unprotected user
// through on the strength of a flag nobody has heard from yet, so the request waits instead — this
// is a button press, and the flags either land or the app gives up on them.
const FLAGS_WAIT_MS = 2_000;

export function whenFlagsAnswered(store: Store<ProtectionState>): Promise<void> {
  if (selectRemoteFlagsReady(store.getState())) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const settle = () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };

    const timer = setTimeout(settle, FLAGS_WAIT_MS);
    const unsubscribe = store.subscribe(() => {
      if (selectRemoteFlagsReady(store.getState())) {
        settle();
      }
    });
  });
}

export function isRevampedScheme(state: ProtectionState): boolean {
  return (
    resolveAppLockScheme({
      hasStoredProtection: selectHasPassword(state) || selectBiometricsEnabled(state),
      isRevampEnabled: selectFeature(state, "lwmPasswordRevamp")?.enabled ?? false,
    }) === "revamped"
  );
}
