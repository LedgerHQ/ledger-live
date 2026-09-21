import { useEffect, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import logger from "~/renderer/logger";
import { useCardHostedManifests } from "./useCardHostedManifests";

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
  const wipedManifestUrls = useRef(new Set<string>());

  useEffect(() => {
    if (lastSeenSignedIn.current !== isSignedIn) {
      lastSeenSignedIn.current = isSignedIn;
      wipedManifestUrls.current.clear();
    }

    const manifestsToWipe = [login, hosted].filter(
      (manifest): manifest is LiveAppManifest =>
        !!manifest && !wipedManifestUrls.current.has(String(manifest.url)),
    );

    if (manifestsToWipe.length === 0) {
      return;
    }

    for (const manifest of manifestsToWipe) {
      wipedManifestUrls.current.add(String(manifest.url));
    }

    hostedSessionWipe = Promise.all(manifestsToWipe.map(wipeHostedSessionForManifest))
      .then(() => undefined)
      .catch(() => undefined);
  }, [isSignedIn, login, hosted]);
}
