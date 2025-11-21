import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";
import { logStartupEvent, useLogStartupEvent } from "../hooks/useLogStartupEvent";

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  useLogStartupEvent("WaitForAppReady render");

  const initialQueries = useContext(InitialQueriesContext);
  if (
    !currencyInitialized ||
    !initialQueries.firebaseIsReady ||
    initialQueries.ofacResult.isLoading
  ) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
