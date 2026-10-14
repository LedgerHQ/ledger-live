import type { Network, PortfolioApi } from "@ledgerhq/portfolio-module-framework";
import { onBothSides } from "./sides";
import type { Side, SideNetworks } from "./types";

/** Loads once and shares the result; a failed load is retried on the next call. */
export function cacheOnSuccess<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | undefined;
  return () => {
    cached ??= load().catch((error: unknown) => {
      cached = undefined;
      throw error;
    });
    return cached;
  };
}

export function cachedSideNetworks(
  apis: Record<Side, Pick<PortfolioApi, "listNetworks">>,
): () => Promise<SideNetworks> {
  const loaders: Record<Side, () => Promise<Network[]>> = {
    local: cacheOnSuccess(() => apis.local.listNetworks()),
    remote: cacheOnSuccess(() => apis.remote.listNetworks()),
  };
  return () => onBothSides(side => loaders[side]());
}
