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
// utils/speculosUtils.ts reads the global `jestExpect.getState().testPath` and the allure helpers
// read the global `expect.getState()`. Outside jest there is no `expect`, so install a tiny shim: a
// callable returning a chainable no-op matcher, carrying getState() with the fields the infra reads.
const noop: unknown = new Proxy(function () {}, { get: () => noop, apply: () => noop });
const flowName = process.env.MAESTRO_FLOW ?? "add-account";
const expectShim = Object.assign(() => noop, {
  getState: () => ({ testPath: `maestro-${flowName}`, currentTestName: `maestro-${flowName}` }),
});
g.jestExpect = expectShim;
g.expect = expectShim;
