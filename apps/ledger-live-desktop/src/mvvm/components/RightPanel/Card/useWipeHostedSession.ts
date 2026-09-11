import { useEffect, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import logger from "~/renderer/logger";
import { useCardHostedManifests } from "./useCardHostedManifests";

/** Best effort on purpose: a provider session left behind must never hold the login back. */
export function wipeHostedSessionForManifest(manifest: LiveAppManifest): Promise<void> {
  return ipcRenderer
    .invoke("clearCardHostedSessionData", [String(manifest.url)])
    .catch(logger.error);
}

export function useWipeHostedSessionOnSignInChange(): void {
  const isSignedIn = useIsCardSignedIn();
  const { login, hosted } = useCardHostedManifests();
  const lastSeenSignedIn = useRef(isSignedIn);
  // Set on any sign-in change seen before the manifests resolved, so a second change during that
  // same wait (e.g. sign in then out again) still wipes once they do, instead of netting out to
  // "nothing changed" and losing both.
  const hasPendingWipe = useRef(false);

  useEffect(() => {
    if (lastSeenSignedIn.current !== isSignedIn) {
      lastSeenSignedIn.current = isSignedIn;
      hasPendingWipe.current = true;
    }

    // Both manifests are needed: consuming the pending wipe on the first one to resolve would
    // leave the other one's session standing until the next sign-in change.
    if (!hasPendingWipe.current || !login || !hosted) {
      return;
    }

    hasPendingWipe.current = false;

    for (const manifest of [login, hosted]) {
      void wipeHostedSessionForManifest(manifest);
    }
  }, [isSignedIn, login, hosted]);
}
