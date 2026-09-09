import { useEffect, useMemo, useRef } from "react";
import { ipcRenderer } from "electron";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import useEnv from "@features/platform-env";
import logger from "~/renderer/logger";

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function useWipeHostedSessionOnSignInChange(): void {
  const isSignedIn = useIsCardSignedIn();
  const apiUrl = useEnv("CARD_BAANX_API_URL");
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const lastSignedIn = useRef(isSignedIn);

  const hosts = useMemo(
    () => [hostOf(apiUrl), hostOf(hostedUiUrl)].filter(host => host !== null),
    [apiUrl, hostedUiUrl],
  );

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
