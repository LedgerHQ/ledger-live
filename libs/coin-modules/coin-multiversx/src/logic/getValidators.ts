import type { Page, Validator } from "@ledgerhq/coin-module-framework/api/index";

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

    const activeProviders = providers.filter(provider => provider.disabled !== true);

    return {
      items: activeProviders.map(mapToValidator),
      next: undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      const wrappedError: Error & { cause?: unknown } = new Error(
        `getValidators failed: ${error.message}`,
      );
      if (error.stack !== undefined) {
        wrappedError.stack = error.stack;
      }
      wrappedError.cause = error;
      throw wrappedError;
    }
    throw new Error(`getValidators failed: ${String(error)}`);
  }
}
