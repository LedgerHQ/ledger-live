/**
 * Minimal `detox` stand-in for the Maestro harness (mapped via moduleNameMapper in
 * harness/jest.config.js). Maestro owns the device, so Detox's `device` port-forwarding
 * is a no-op here — on an iOS simulator host<->sim share localhost, so Speculos at
 * localhost:<port> is reachable without `reverseTcpPort`. `log` just no-ops.
 *
 * (For Android, real port reversing would be needed — do it with `adb reverse` in the
 * orchestrator rather than reintroducing the Detox worker.)
 */
const noop = (..._args: unknown[]) => {};

type CallableLog = ((...args: unknown[]) => void) & Record<string, (...args: unknown[]) => void>;
const log = noop as unknown as CallableLog;
log.info = noop;
log.warn = noop;
log.error = noop;
log.debug = noop;
log.trace = noop;

const device = {
  getPlatform: () => "ios",
  reverseTcpPort: async (_port: number) => {},
  unreverseTcpPort: async (_port: number) => {},
};

export { log, device };
export default { log, device };
