import { bootstrap } from "~/renderer/bridge";

/**
 * Stand-ins for the Node `process` properties the renderer reads.
 *
 * A context-isolated renderer has no `process`, but roughly 45 call sites read
 * `process.env` — many at module scope, where an asynchronous lookup could not work. The
 * bundler rewrites those reads to the globals assigned below.
 *
 * This module is prepended to the renderer entry rather than imported, so it is evaluated
 * before the application's first module. `ProvidePlugin` would have been tidier, but it
 * only rewrites free variables it sees while parsing the source: the identifiers here are
 * introduced by `DefinePlugin` afterwards, so `ProvidePlugin` never observes them and the
 * bundle ends up referencing globals that nothing defines.
 *
 * Deliberately NOT a general `process` polyfill. `process/browser` reports
 * `platform === "browser"`, which would silently break frameless-window dragging on macOS,
 * select the wrong USB-troubleshooting branch, and make every build look like a direct
 * download — so store builds would start self-updating. Each value here is real or
 * intentionally absent.
 */
const globals = globalThis as unknown as {
  __LLD_PROCESS_ENV__: Record<string, string | undefined>;
  __LLD_PROCESS_PLATFORM__: string;
  __LLD_PROCESS_MAS__: true | undefined;
  __LLD_PROCESS_WINDOWS_STORE__: true | undefined;
};

/**
 * A mutable copy. `bootstrap.env` is frozen so renderer code cannot mutate the snapshot of
 * main's state, but `live-common-setup-base` assigns `process.env.LEDGER_CLIENT_VERSION` at
 * module scope — which against a frozen object throws in strict mode.
 */
globals.__LLD_PROCESS_ENV__ = { ...bootstrap.env };

globals.__LLD_PROCESS_PLATFORM__ = bootstrap.os.platform;

/** Mac App Store and Windows Store builds set these; Electron leaves them undefined otherwise. */
globals.__LLD_PROCESS_MAS__ = bootstrap.distributionChannel === "mac-app-store" ? true : undefined;

globals.__LLD_PROCESS_WINDOWS_STORE__ =
  bootstrap.distributionChannel === "windows-store" ? true : undefined;

export {};
