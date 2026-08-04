import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { IterateResultBuilder } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { runDerivationScheme } from "@ledgerhq/ledger-wallet-framework/derivation";
import { UpdateYourApp } from "@ledgerhq/errors";

/**
 * The signer's "can't authorize this path" signal. The signer owns the
 * device-version knowledge; the bridge only reacts. Match by `name` too so it
 * survives cross-process serialization (prototype stripped).
 */
export function isUpdateYourAppError(e: unknown): boolean {
  return (
    e instanceof UpdateYourApp ||
    (typeof e === "object" && e !== null && (e as { name?: unknown }).name === "UpdateYourApp")
  );
}

/**
 * Custom `buildIterateResult`: like the framework default, but returns `null`
 * (→ index loop breaks) on the signer's `UpdateYourApp` so accounts on
 * authorized paths are still added instead of the whole scan aborting. Any
 * other error rethrows. Device-version knowledge lives in the signer.
 */
export const buildResilientIterateResult =
  (getAddressFn: GetAddressFn): IterateResultBuilder =>
  () =>
    Promise.resolve(
      async ({ index, derivationsCache, derivationScheme, derivationMode, currency, deviceId }) => {
        const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
          account: index,
        });
        const cacheKey = `${freshAddressPath}:${derivationMode}`;
        let res = derivationsCache[cacheKey];
        if (!res) {
          try {
            res = await getAddressFn(deviceId, {
              currency,
              path: freshAddressPath,
              derivationMode,
            });
          } catch (e) {
            if (isUpdateYourAppError(e)) return null;
            throw e;
          }
          derivationsCache[cacheKey] = res;
        }
        return res;
      },
    );
