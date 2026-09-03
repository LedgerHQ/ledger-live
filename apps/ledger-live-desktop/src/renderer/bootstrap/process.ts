import { bootstrap } from "~/renderer/bridge";

/**
 * Stand-ins for the Node `process` properties the renderer reads. DefinePlugin rewrites
 * those reads to the globals assigned below; this module is prepended to the renderer entry
 * so it is evaluated before the application's first module.
 *
 * Deliberately NOT a general `process` polyfill. `process/browser` reports
 * `platform === "browser"`, which would silently break frameless-window dragging on macOS,
 * select the wrong USB-troubleshooting branch, and make every build look like a direct
 * download — so store builds would start self-updating.
 */
const globals = globalThis as unknown as {
  __LLD_PROCESS_ENV__: Record<string, string | undefined>;
  __LLD_PROCESS_PLATFORM__: string;
  __LLD_PROCESS_MAS__: true | undefined;
  __LLD_PROCESS_WINDOWS_STORE__: true | undefined;
  __LLD_PROCESS__: {
    cwd: () => string;
    nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
    browser: true;
  };
};

// A mutable copy: `bootstrap.env` is frozen, and `live-common-setup-base` assigns
// `process.env.LEDGER_CLIENT_VERSION` at module scope, which would throw in strict mode.
globals.__LLD_PROCESS_ENV__ = { ...bootstrap.env };

globals.__LLD_PROCESS_PLATFORM__ = bootstrap.os.platform;

// Electron leaves these undefined outside a store build, and consumers test for presence.
globals.__LLD_PROCESS_MAS__ = bootstrap.distributionChannel === "mac-app-store" ? true : undefined;

globals.__LLD_PROCESS_WINDOWS_STORE__ =
  bootstrap.distributionChannel === "windows-store" ? true : undefined;

/**
 * The subset of `process` read by dependencies that do not feature-detect first.
 *
 * `processShimLoader.cjs` binds `process` to this object inside the narrow `include` list in
 * `rspack.renderer.ts` and nowhere else, so every other module still sees no `process` and
 * keeps taking its `typeof process` browser branch. Anything missing here fails the build
 * rather than throwing at runtime — see `tools/rspack/processReadGuard.cjs`.
 */
globals.__LLD_PROCESS__ = {
  // A renderer has no working directory. Both callers use the result only as the base for a
  // relative path, so the filesystem root is honest where a fabricated project path is not.
  cwd: () => "/",

  // `queueMicrotask` is the browser equivalent: both drain before the next task. Trailing
  // arguments are forwarded to match Node's signature.
  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },

  browser: true,
};
