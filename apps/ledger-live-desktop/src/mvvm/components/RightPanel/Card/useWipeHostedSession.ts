import { useEffect, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import logger from "~/renderer/logger";
import { useCardHostedManifests } from "./useCardHostedManifests";

const WIPE_ON_PAY_TAB_ENTER = true;

let hostedSessionWipe: Promise<void> = Promise.resolve();

/** Best effort on purpose: a provider session left behind must never hold the login back. */
function wipeHostedSessionForManifest(manifest: LiveAppManifest): Promise<void> {
  return ipcRenderer
    .invoke("clearCardHostedSessionData", [String(manifest.url)])
    .catch(logger.error);
}

/** The provider webview must open on a wiped session, never on the one the wipe still holds. */
export async function whenHostedSessionWiped(): Promise<void> {
  // A sign-in change during the wait queues a later batch, and that one must settle here too.
  let awaited: Promise<void> | undefined;

  while (awaited !== hostedSessionWipe) {
    awaited = hostedSessionWipe;
    await awaited;
  }
}

export function useWipeHostedSession(): void {
  const isSignedIn = useIsCardSignedIn();
  const { login, hosted } = useCardHostedManifests();
  const lastSeenSignedIn = useRef(isSignedIn);
  // Set on any sign-in change seen before the manifests resolved, so a second change during that
  // same wait (e.g. sign in then out again) still wipes once they do, instead of netting out to
  // "nothing changed" and losing both.
  const hasPendingWipe = useRef(WIPE_ON_PAY_TAB_ENTER);

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

    // The main process runs the wipes in the order they arrive, so the newest batch settles last.
    hostedSessionWipe = Promise.all([login, hosted].map(wipeHostedSessionForManifest)).then(
      () => undefined,
    );
  }, [isSignedIn, login, hosted]);
}
