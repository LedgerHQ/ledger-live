import os from "os";

/**
 * Single chokepoint for host operating-system facts in the renderer.
 *
 * Only these four primitives are ever needed, which is what makes the renderer's
 * dependency on the `os` module removable: once the renderer is context-isolated it has
 * no `os` at all, and these values will instead be read from a snapshot captured in the
 * main process at startup. Routing every consumer through this module now means that
 * swap is a change to this file alone.
 *
 * Do NOT reach for an `os` browser polyfill as a shortcut: `os-browserify` reports
 * `type() === "Browser"` and an empty `hostname()`, which would silently mislabel the
 * Ledger Sync instance name and make the OS support check misclassify every platform.
 */
export const osType = (): string => os.type();

export const osRelease = (): string => os.release();

export const osPlatform = (): string => os.platform();

export const osHostname = (): string => os.hostname();
