import { getEnv } from "@shared/env";
import { A4_SUPPORTED_NETWORKS } from "../config";
import type { A4Environment } from "../config";

const A4_SUPPORTED_NETWORK_SET: ReadonlySet<string> = new Set(A4_SUPPORTED_NETWORKS);

function remapCurrencyId(currencyId: string): string {
  switch (currencyId) {
    case "xrp":
      return "ripple";
    default:
      return currencyId;
  }
}

export function toA4Network(currencyId: string): string | null {
  const network = remapCurrencyId(currencyId);
  return A4_SUPPORTED_NETWORK_SET.has(network) ? network : null;
}

export function resolveA4BaseUrl(environment: A4Environment): string {
  switch (environment) {
    case "stg":
      return getEnv("A4_URL_STG");
    case "ppr":
      return getEnv("A4_URL_PPR");
    case "prd":
      return getEnv("A4_URL_PRD");
  }
}
