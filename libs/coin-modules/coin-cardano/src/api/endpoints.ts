import type { CardanoCoinConfig } from "../config";

// Read from the coin config the caller passes in (the bridge resolves it by currency, the api path
// from its context), never captured at module load, so a coin config update applies to the next
// request.

/** Base URL of the Cardano API. */
export function getApiEndpoint(config: CardanoCoinConfig): string {
  return config.infra.CARDANO_API_ENDPOINT;
}

/** URL of the current-epoch protocol params. */
export function getEpochParamsEndpoint(config: CardanoCoinConfig): string {
  return config.infra.CARDANO_EPOCH_PARAMS_ENDPOINT;
}
