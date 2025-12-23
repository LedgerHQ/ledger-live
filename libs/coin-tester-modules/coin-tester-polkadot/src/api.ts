import { ApiPromise, WsProvider } from "@polkadot/api";
import type { ApiOptions } from "@polkadot/api/types";

/**
 * Creates an ApiPromise with a WsProvider.
 * This helper handles the type mismatch between WsProvider and ProviderInterface
 * that occurs with exactOptionalPropertyTypes enabled in TypeScript.
 *
 * The issue is that WsProvider.ttl is typed as `number | null | undefined`
 * but ProviderInterface expects `number | null`.
 */
export async function createApiPromise(wsProvider: WsProvider): Promise<ApiPromise> {
  // Ensure ttl is not undefined to satisfy ProviderInterface
  if (wsProvider.ttl === undefined) {
    Object.defineProperty(wsProvider, "ttl", { value: null });
  }

  return ApiPromise.create({
    provider: wsProvider as NonNullable<ApiOptions["provider"]>,
    noInitWarn: true,
  });
}
