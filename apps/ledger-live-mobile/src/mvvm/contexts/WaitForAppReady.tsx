import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";
import { useWait } from "../hooks/useWait";
import { logStartupEvent } from "../utils/logStartupTime";

const MAX_WAIT = 1_000;

export interface WaitForAppReadyProps {
  currencyInitialized: boolean;
  importAccounts: () => Promise<void>;
}

export function WaitForAppReady({
  children,
  currencyInitialized,
  importAccounts,
}: React.PropsWithChildren<WaitForAppReadyProps>) {
  logStartupEvent("WaitForAppReady render");

  const initialQueries = useContext(InitialQueriesContext);
  const accountsImported = useWait<boolean>(resolve =>
    importAccounts().finally(() => resolve(true)),
  );
  const isLoaded =
    accountsImported &&
    currencyInitialized &&
    !initialQueries.ofacResult.isLoading &&
    initialQueries.firebaseIsReady;

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;

  if (!timedOut && !isLoaded) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
