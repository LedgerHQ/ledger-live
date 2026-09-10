import { useEffect, useMemo, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import logger from "~/renderer/logger";
import { manifestOrigin, useCardHostedManifests } from "./useCardHostedManifests";

export function useWipeHostedSessionOnSignInChange(): void {
  const isSignedIn = useIsCardSignedIn();
  const { login, hosted } = useCardHostedManifests();
  const lastSignedIn = useRef(isSignedIn);

  const origins = useMemo(
    () => [...new Set([manifestOrigin(login), manifestOrigin(hosted)].filter(o => o !== null))],
    [login, hosted],
  );

  useEffect(() => {
    if (lastSignedIn.current === isSignedIn) {
      return;
    }

    if (origins.length === 0) {
      // The manifests have not resolved yet, so there is nothing to wipe. `lastSignedIn` stays
      // stale on purpose: once `origins` fills in and re-runs this effect, the sign-in change
      // this render saw is still pending and still fires the wipe below.
      return;
    }

    lastSignedIn.current = isSignedIn;

    ipcRenderer.invoke("clearCardHostedSessionData", origins).catch(logger.error);
  }, [isSignedIn, origins]);
}
