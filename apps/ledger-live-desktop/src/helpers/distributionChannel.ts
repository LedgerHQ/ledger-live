export type DistributionChannel = "mac-app-store" | "windows-store" | "direct";

/**
 * `process.mas` / `process.windowsStore` are set to `true` only by the Mac App
 * Store / Windows Store Electron variants, so a single bundle can be re-packaged
 * for store vs CDN with no build-time branching.
 */
export function getDistributionChannel(): DistributionChannel {
  if (process.mas) return "mac-app-store";
  if (process.windowsStore) return "windows-store";
  return "direct";
}

/** True when the app was installed from a first-party store that owns updates itself. */
export function isStoreDistribution(): boolean {
  return getDistributionChannel() !== "direct";
}
