import { BOOTSTRAP_VERSION, BRIDGE_VERSION, type LedgerBridge } from "~/bridge/contract";

// Relative: jest maps "~/renderer/bridge" to a test double.
const BRIDGE_MODULE = "../bridge";

const validBridge = (overrides: Partial<LedgerBridge> = {}) =>
  ({
    version: BRIDGE_VERSION,
    bootstrap: { version: BOOTSTRAP_VERSION, env: {}, os: {}, paths: {}, store: {} },
    ...overrides,
  }) as unknown as LedgerBridge;

describe("renderer bridge", () => {
  const globals = globalThis as unknown as { lld?: LedgerBridge };

  afterEach(() => {
    delete globals.lld;
    jest.resetModules();
  });

  it("exposes the bootstrap snapshot published by the preload", () => {
    globals.lld = validBridge();
    jest.isolateModules(() => {
      const { bootstrap } = require(BRIDGE_MODULE);
      expect(bootstrap.version).toBe(BOOTSTRAP_VERSION);
    });
  });

  it("throws a diagnosable error when the preload did not run", () => {
    jest.isolateModules(() => {
      expect(() => require(BRIDGE_MODULE)).toThrow(/preload script did not run/);
    });
  });

  it("throws on a preload/renderer version mismatch rather than misreading the snapshot", () => {
    globals.lld = validBridge({ version: 99 as unknown as LedgerBridge["version"] });
    jest.isolateModules(() => {
      expect(() => require(BRIDGE_MODULE)).toThrow(/version mismatch/);
    });
  });

  it("throws on a stale bootstrap snapshot from main", () => {
    globals.lld = validBridge({
      bootstrap: { version: 99 } as unknown as LedgerBridge["bootstrap"],
    });
    jest.isolateModules(() => {
      expect(() => require(BRIDGE_MODULE)).toThrow(/Main\/renderer version mismatch/);
    });
  });
});
