import { useEffect, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import logger from "~/renderer/logger";
import { useCardHostedManifests } from "./useCardHostedManifests";

const WIPE_ON_PAY_TAB_ENTER = true;

const MANIFEST_COUNT = 2;

let hostedSessionWipe: Promise<void> = Promise.resolve();

/** Best effort on purpose: a provider session left behind must never hold the login back. */
function wipeHostedSessionForManifest(manifest: LiveAppManifest): Promise<void> {
  return ipcRenderer
    .invoke("clearCardHostedSessionData", [String(manifest.url)])
    .catch(logger.error);
}

export async function whenHostedSessionWiped(): Promise<void> {
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

    const resolvedManifests = [login, hosted].filter(
      (manifest): manifest is LiveAppManifest => !!manifest,
    );

    if (!hasPendingWipe.current || resolvedManifests.length === 0) {
      return;
    }

    hasPendingWipe.current = resolvedManifests.length < MANIFEST_COUNT;

    hostedSessionWipe = Promise.all(resolvedManifests.map(wipeHostedSessionForManifest))
      .then(() => undefined)
      .catch(() => undefined);
  }, [isSignedIn, login, hosted]);
}
