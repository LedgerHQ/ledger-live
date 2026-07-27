// Device-authorization knowledge lives in the signer (not the bridge): which
// paths a Celo app authorizes is a firmware-version concern.

/** OS "path not authorized" (0x4215), folded to 0x6a15 by the app's catch-all. */
export const SW_DERIVATION_PATH_UNAUTHORIZED = 0x6a15;

/** First Celo app version authorizing the full `44'/60'` prefix (v1.7.0, PR #37). */
export const CELO_MULTIPATH_MIN_VERSION = "1.7.0";

export const CELO_MANAGER_APP_NAME = "Celo";

/** Numeric `M.N.P` compare — avoids a `semver` dependency. */
export function isVersionBelow(version: string, min: string): boolean {
  const a = version.split(".").map(n => Number.parseInt(n, 10) || 0);
  const b = min.split(".").map(n => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

export function isUnauthorizedPathError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { name?: unknown }).name === "TransportStatusError" &&
    (e as { statusCode?: unknown }).statusCode === SW_DERIVATION_PATH_UNAUTHORIZED
  );
}
