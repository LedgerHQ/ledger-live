import type { DeviceSpec, ProviderSpec } from "./types";

/**
 * Bump when the shape of the cached matrix changes, so stale caches are discarded rather
 * than rendered by code that no longer understands them. Editing DEVICES is not such a
 * change: the cache stores no device list, only columns keyed by device.
 */
export const CACHE_KEY = "firmware-app-deployments:v1";

/** Deploys land weekly, so a cache older than this is missing at least one batch. */
export const STALE_DAYS = 7;

export const FIRMWARE_ATTEMPTS = 4;

export const REQUEST_CONCURRENCY = 4;

/**
 * Provider ids and their internal names, per the FW-space "Providers management" page.
 * These are not the key names live-common uses — see getProviderIdUseCase in device-core.
 *
 * Providers 80-83 are per-device firmware-upgrade test providers rather than app
 * staging; 2 (das) and 5 (vault) have no documented owner. Neither is collected.
 * P3 (club) is a genuine pre-production provider but holds only the swap set, so it is
 * left out; adding it here is enough to bring its columns back.
 */
export const PROVIDERS: ProviderSpec[] = [
  { id: 1, label: "P1" }, // vanilla — production
  { id: 4, label: "P4" }, // test — pre-production
];

/**
 * `label` is what the page shows, and deliberately not the API's own `name`: the catalog
 * still carries internal codenames for devices that ship under another one. Device 136 is
 * "Apex P" in the API and Gen5 in marketing material.
 */
export const DEVICES: DeviceSpec[] = [
  { id: 16, key: "nanosp", label: "Nano S Plus" },
  { id: 9, key: "nanox", label: "Nano X" },
  { id: 17, key: "stax", label: "Stax" },
  { id: 135, key: "flex", label: "Flex" },
  { id: 136, key: "apex", label: "Gen5" },
];

/** The device selected on a first visit. Keep it first in DEVICES, so it also leads the
 * controls and the chips. */
export const DEFAULT_DEVICE = "nanosp";
