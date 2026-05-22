/**
 * Defaults used by the DEX builders when the quote does not carry an
 * explicit gas hint. These mirror the live-app values used in the
 * `executeSwap` pipeline so behaviour is consistent across surfaces.
 *
 * Feature-flag plumbing (remote-configured multiplier / default) is out of
 * scope for the mobile POC; once that lands these constants will be
 * replaced by an injected config.
 */
export const DEFAULT_DEX_GAS_LIMIT_MULTIPLIER = 1.5;
export const DEFAULT_DEX_GAS_LIMIT = "3000000";
