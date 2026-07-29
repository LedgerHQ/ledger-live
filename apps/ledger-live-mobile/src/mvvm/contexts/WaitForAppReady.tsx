import React from "react";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { useSelector } from "~/context/hooks";
import LoadingApp from "~/components/LoadingApp";
import { useWait } from "../hooks/useWait";
import { logStartupEvent } from "../utils/logStartupTime";

const MAX_WAIT = 1_000;

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");

  const { isLoading: ofacLoading } = ofacGeoBlockApi.useCheckQuery();
  const firebaseIsReady = useSelector(selectRemoteFlagsReady);
  const isLoaded = currencyInitialized && !ofacLoading && firebaseIsReady;

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;

  if (!timedOut && !isLoaded) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
