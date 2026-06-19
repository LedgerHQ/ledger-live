/**
 * Recreates the globals that e2e/mobile/jest.environment.ts normally installs
 * (TestEnvironment.setup). We don't use that environment because it extends
 * DetoxEnvironment (which would manage/launch the app); Maestro launches the app.
 * The bridge (bridge/server.ts) reads the bare `webSocket` global, and a few
 * helpers read `pendingCallbacks` / `speculosDevices` / `IS_FAILED`.
 */
import { Subject } from "rxjs";

const g = globalThis as Record<string, unknown>;

g.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject(),
};
g.pendingCallbacks = new Map();
g.speculosDevices = new Map();
g.IS_FAILED = false;
// Speculos launch (utils/speculosUtils.ts) reads `jestExpect.getState()`; the Detox
// env normally exposes jest's expect under this name.
g.jestExpect = (globalThis as { expect?: unknown }).expect;
