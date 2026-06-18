import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { selectSupportedFiats, useGetSupportedFiatsQuery } from "@features/platform-currencies";
import type { DevToolsConfig } from "@devtools/shell";

type CurrenciesToolProps = Extract<DevToolsConfig[number], { id: "currencies" }>["config"];
type RemoteFiatStatus = CurrenciesToolProps["status"];

function formatQueryError(error: FetchBaseQueryError | SerializedError): string {
  if ("status" in error) {
    return typeof error.status === "number" ? `HTTP ${error.status}` : error.error;
  }
  return error.message ?? "Unknown error";
}

export function useCurrenciesToolProps(): CurrenciesToolProps {
  const { isFetching, isError, error, refetch } = useGetSupportedFiatsQuery();
  const supportedFiats = useSelector(selectSupportedFiats);

  return useMemo(() => {
    const status: RemoteFiatStatus =
      isError && error
        ? { type: "error", message: formatQueryError(error) }
        : isFetching
          ? { type: "fetching" }
          : { type: "idle" };
    return { supportedFiats, status, refetch };
  }, [supportedFiats, isFetching, isError, error, refetch]);
}
