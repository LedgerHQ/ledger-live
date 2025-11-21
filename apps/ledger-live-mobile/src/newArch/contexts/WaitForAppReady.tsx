import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";
import { logStartupEvent, useLogStartupEvent } from "../hooks/useLogStartupEvent";
import { useWait } from "../hooks/useWait";

const MAX_WAIT = 1_000;

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  useLogStartupEvent("WaitForAppReady render");

  const initialQueries = useContext(InitialQueriesContext);
  const isLoaded =
    currencyInitialized && !initialQueries.ofacResult.isLoading && initialQueries.firebaseIsReady;

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;

  if (!timedOut && !isLoaded) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
