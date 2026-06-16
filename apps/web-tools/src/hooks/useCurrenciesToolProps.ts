import { useSelector } from "react-redux";
import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useGetSupportedFiatsQuery } from "@domain/api-currencies";
import { selectSupportedFiats } from "@features/platform-currencies";
import type { DevToolsConfig } from "@devtools/shell";

type CurrenciesToolProps = Extract<DevToolsConfig[number], { id: "currencies" }>["config"];

function formatQueryError(error: FetchBaseQueryError | SerializedError | undefined) {
  if (!error) return undefined;
  if ("status" in error) {
    return typeof error.status === "number" ? `HTTP ${error.status}` : error.error;
  }
  return error.message ?? "Unknown error";
}

export function useCurrenciesToolProps(): CurrenciesToolProps {
  const { isFetching, error, refetch } = useGetSupportedFiatsQuery();
  const supportedFiats = useSelector(selectSupportedFiats);

  return {
    supportedFiats,
    isFetching,
    error: formatQueryError(error),
    refetch,
  };
}
