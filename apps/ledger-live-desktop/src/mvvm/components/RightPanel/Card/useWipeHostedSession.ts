import { useEffect, useMemo, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import logger from "~/renderer/logger";
import { manifestOrigin, useCardHostedManifests } from "./useCardHostedManifests";

export function useWipeHostedSessionOnSignInChange(): void {
  const isSignedIn = useIsCardSignedIn();
  const { login, hosted } = useCardHostedManifests();
  const lastSeenSignedIn = useRef(isSignedIn);
  // Set on any sign-in change seen before the manifests resolved, so a second change during that
  // same wait (e.g. sign in then out again) still wipes once they do, instead of netting out to
  // "nothing changed" and losing both.
  const hasPendingWipe = useRef(false);

  const origins = useMemo(
    () => [
      ...new Set(
        [manifestOrigin(login), manifestOrigin(hosted)].filter(
          (origin): origin is string => origin !== null,
        ),
      ),
    ],
    [login, hosted],
  );

  useEffect(() => {
    if (lastSeenSignedIn.current !== isSignedIn) {
      lastSeenSignedIn.current = isSignedIn;
      hasPendingWipe.current = true;
    }

    if (!hasPendingWipe.current || origins.length === 0) {
      return;
    }

    hasPendingWipe.current = false;

    ipcRenderer.invoke("clearCardHostedSessionData", origins).catch(logger.error);
  }, [isSignedIn, origins]);
}
