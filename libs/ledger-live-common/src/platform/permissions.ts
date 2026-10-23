import { PlatformAPIPermissionDenied } from "../errors";
import type { LiveAppManifest } from "./types";

/**
 * Platform API methods that hand wallet accounts or addresses to the Live App. Like Wallet API
 * methods, they must be listed in the manifest `permissions`.
 */
export const PLATFORM_API_PERMISSIONED_METHODS: ReadonlySet<string> = new Set([
  "account.list",
  "account.request",
  "account.receive",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlatformAPIHandlers = Record<string, (...args: any[]) => unknown>;

/**
 * Checks the permissioned methods against `manifest.permissions`. A denial is logged once per
 * method, and only blocks the call when `enforce` is on: manifests are backfilled first.
 */
export function withPlatformAPIPermissions<H extends PlatformAPIHandlers>(
  handlers: H,
  manifest: Pick<LiveAppManifest, "id" | "permissions">,
  enforce: boolean,
): H {
  const allowedMethods = new Set(manifest.permissions ?? []);
  const loggedDenials = new Set<string>();

  return Object.fromEntries(
    Object.entries(handlers).map(([method, handler]) => {
      if (!PLATFORM_API_PERMISSIONED_METHODS.has(method) || allowedMethods.has(method)) {
        return [method, handler];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkedHandler = (...args: any[]) => {
        if (!loggedDenials.has(method)) {
          loggedDenials.add(method);
          console.warn("Platform API method missing from the manifest permissions", {
            manifestId: manifest.id,
            method,
            enforced: enforce,
          });
        }
        if (enforce) {
          throw new PlatformAPIPermissionDenied(method);
        }
        return handler(...args);
      };
      return [method, checkedHandler];
    }),
  ) as H;
}
