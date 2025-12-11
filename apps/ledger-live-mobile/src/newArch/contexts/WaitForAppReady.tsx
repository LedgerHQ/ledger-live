import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";
import { logStartupEvent } from "../utils/logStartupTime";

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");

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
