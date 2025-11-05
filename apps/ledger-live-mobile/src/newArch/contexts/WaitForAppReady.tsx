import React, { useContext } from "react";
import { InitialQueriesContext } from "./InitialQueriesContext";
import LoadingApp from "~/components/LoadingApp";

export function WaitForAppReady({ children }: React.PropsWithChildren) {
  const initialQueries = useContext(InitialQueriesContext);
  if (!initialQueries.firebaseIsReady || initialQueries.ofacResult.isLoading) {
    return <LoadingApp />;
  }

  return children;
}
