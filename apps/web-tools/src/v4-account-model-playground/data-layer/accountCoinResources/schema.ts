/**
 * AccountCoinResources domain – TEMPORARY PLACEHOLDER.
 *
 * This slice is a single generic bucket for all coin-specific Account extras
 * (bitcoinResources, tezosResources, etc.) so we can reconstruct Account for the bridge.
 * It is intentionally temporary: the target architecture is one slice per coin family
 * (e.g. bitcoinResources, cosmosResources), each with its own schema, persistence, and
 * collocated logic. See README § "Coin-specific resources: placeholder vs coin-by-coin"
 * (see README).
 */
import { z } from "zod";

export const AccountCoinResourcesStateSchema = z.object({
  byAccountId: z.record(z.record(z.unknown())),
});

export type AccountCoinResourcesState = z.infer<typeof AccountCoinResourcesStateSchema>;

/** Per-account coin-specific extras (for reconstruction). Placeholder: prefer coin-specific slices when they exist. */
export type AccountCoinResources = Record<string, unknown>;
