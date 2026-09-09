import { useEffect, useMemo, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import logger from "~/renderer/logger";
import { manifestOrigin, useCardHostedManifests } from "./useCardHostedManifests";

export function useWipeHostedSessionOnSignInChange(): void {
  const isSignedIn = useIsCardSignedIn();
  const { login, hosted } = useCardHostedManifests();
  const lastSignedIn = useRef(isSignedIn);

  const hosts = useMemo(() => {
    const origins = [manifestOrigin(login), manifestOrigin(hosted)];

    return [
      ...new Set(origins.filter(origin => origin !== null).map(origin => new URL(origin).host)),
    ];
  }, [login, hosted]);

  useEffect(() => {
    if (lastSignedIn.current === isSignedIn) {
      return;
    }

    lastSignedIn.current = isSignedIn;

    if (hosts.length === 0) {
      return;
    }

    ipcRenderer.invoke("clearCardHostedSessionData", hosts).catch(logger.error);
  }, [isSignedIn, hosts]);
}
