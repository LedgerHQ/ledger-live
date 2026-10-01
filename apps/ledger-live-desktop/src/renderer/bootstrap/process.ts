import { bootstrap } from "~/renderer/bridge";

/**
 * Globals DefinePlugin rewrites `process.*` reads to. Not `process/browser`: its platform
 * "browser" breaks macOS window dragging and makes store builds self-update.
 */
const globals = globalThis as unknown as {
  __LLD_PROCESS_ENV__: Record<string, string | undefined>;
  __LLD_PROCESS_PLATFORM__: string;
  __LLD_PROCESS_MAS__: true | undefined;
  __LLD_PROCESS_WINDOWS_STORE__: true | undefined;
  __LLD_PROCESS__: {
    env: Record<string, string | undefined>;
    platform: string;
    cwd: () => string;
    nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
    browser: true;
  };
};

// A mutable copy: bootstrap.env is frozen, and live-common-setup-base assigns to process.env.
globals.__LLD_PROCESS_ENV__ = { ...__BUILD_ENVS__, ...bootstrap.env };

globals.__LLD_PROCESS_PLATFORM__ = bootstrap.os.platform;

// Electron leaves these undefined outside a store build, and consumers test for presence.
globals.__LLD_PROCESS_MAS__ = bootstrap.distributionChannel === "mac-app-store" ? true : undefined;

globals.__LLD_PROCESS_WINDOWS_STORE__ =
  bootstrap.distributionChannel === "windows-store" ? true : undefined;

// Bound as `process` only in the modules processShimLoader targets. That local binding hides them
// from DefinePlugin, so the fields it would have rewritten must be here too (util reads
// process.env.NODE_DEBUG at load).
globals.__LLD_PROCESS__ = {
  env: globals.__LLD_PROCESS_ENV__,
  platform: globals.__LLD_PROCESS_PLATFORM__,

  // No working directory in a renderer; callers only resolve relative paths against it.
  cwd: () => "/",

  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },

  browser: true,
};
