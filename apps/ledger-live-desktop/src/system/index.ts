import { bootstrap } from "~/renderer/bridge";

/**
 * Host OS facts, read from the snapshot main captures at startup.
 *
 * Do NOT reach for `os-browserify` if something reintroduces an `os` import: it reports
 * `type() === "Browser"` and an empty `hostname()`, which would silently mislabel the Ledger
 * Sync instance name and make the OS support check misclassify every platform. `os` is left
 * unresolvable in the bundler config so such an import fails the build instead.
 */
export const osType = (): string => bootstrap.os.type;

export const osRelease = (): string => bootstrap.os.release;

export const osPlatform = (): string => bootstrap.os.platform;

export const osHostname = (): string => bootstrap.os.hostname;
