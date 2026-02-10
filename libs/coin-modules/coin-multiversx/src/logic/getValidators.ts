import type { Page, Validator } from "@ledgerhq/coin-framework/api/types";

import type MultiversXApi from "../api/apiCalls";
import { mapToValidator } from "./mappers";

/**
 * Retrieves the list of available validators on MultiversX.
 * @param apiClient - The MultiversX API client
 * @returns A Page containing all active validators
 */
export async function getValidators(apiClient: MultiversXApi): Promise<Page<Validator>> {
  try {
    const providers = await apiClient.getProviders();

    // Filter out disabled providers (disabled === true means inactive)
    const activeProviders = providers.filter(provider => provider.disabled !== true);

    return {
      items: activeProviders.map(mapToValidator),
      next: undefined, // All validators returned in single page
    };
  } catch (error) {
    // Preserve original error if it's an Error instance, otherwise wrap it
    if (error instanceof Error) {
      const wrappedError = new Error(`getValidators failed: ${error.message}`);
      wrappedError.stack = error.stack;
      wrappedError.cause = error;
      throw wrappedError;
    }
    throw new Error(`getValidators failed: ${String(error)}`);
  }
}
