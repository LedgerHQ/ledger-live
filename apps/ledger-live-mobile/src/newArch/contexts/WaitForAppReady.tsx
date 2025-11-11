import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  const initialQueries = useContext(InitialQueriesContext);
  if (
    !currencyInitialized ||
    !initialQueries.firebaseIsReady ||
    initialQueries.ofacResult.isLoading
  ) {
    return <LoadingApp />;
  }

  return children;
}
