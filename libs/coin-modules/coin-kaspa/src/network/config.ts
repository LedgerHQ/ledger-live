import type { KaspaCoinConfig } from "../config";

/** Base URL of the Kaspa REST API, from the coin config the caller passes in. */
export const getApiBase = (config: KaspaCoinConfig): string => config.infra.API_KASPA_ENDPOINT;
