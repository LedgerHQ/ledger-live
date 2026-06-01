/**
 * Mobile-side aliases for the `custom.swap` wire types.
 *
 * The single source of truth lives in `@ledgerhq/wallet-api-exchange-module`
 * and is re-exported via `@ledgerhq/live-common`. We re-export here so the
 * rest of the POC keeps importing from a feature-local barrel and we never
 * end up with two competing shapes.
 */
export type {
  CustomSwapParams,
  CustomSwapResult,
} from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
