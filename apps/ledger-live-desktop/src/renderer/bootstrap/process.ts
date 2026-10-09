import { bootstrap } from "~/renderer/bridge";

// Not process/browser: its "browser" platform breaks macOS window dragging and store updates.
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

// bootstrap.env is frozen, and live-common-setup-base writes to process.env.
globals.__LLD_PROCESS_ENV__ = { ...__BUILD_ENVS__, ...bootstrap.env };

globals.__LLD_PROCESS_PLATFORM__ = bootstrap.os.platform;

globals.__LLD_PROCESS_MAS__ = bootstrap.distributionChannel === "mac-app-store" ? true : undefined;

globals.__LLD_PROCESS_WINDOWS_STORE__ =
  bootstrap.distributionChannel === "windows-store" ? true : undefined;

// processShimLoader's local `process`, which DefinePlugin does not rewrite.
globals.__LLD_PROCESS__ = {
  env: globals.__LLD_PROCESS_ENV__,
  platform: globals.__LLD_PROCESS_PLATFORM__,

  cwd: () => "/",

  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },

  browser: true,
};
