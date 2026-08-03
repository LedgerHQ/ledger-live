import type { LedgerBridge } from "~/bridge/contract";

// Relative path on purpose: jest maps "~/renderer/bridge" to a test double, and these cases
// exercise the real module's guards.
const BRIDGE_MODULE = "../bridge";

const validBridge = (overrides: Partial<LedgerBridge> = {}) =>
  ({
    version: 1,
    bootstrap: { version: 1, env: {}, os: {}, paths: {}, store: {} },
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
      expect(bootstrap.version).toBe(1);
    });
  });

  it("throws a diagnosable error when the preload did not run", () => {
    jest.isolateModules(() => {
      expect(() => require(BRIDGE_MODULE)).toThrow(/preload script did not run/);
    });
  });

  it("throws on a preload/renderer version mismatch rather than misreading the snapshot", () => {
    globals.lld = validBridge({ version: 2 as unknown as 1 });
    jest.isolateModules(() => {
      expect(() => require(BRIDGE_MODULE)).toThrow(/version mismatch/);
    });
  });
});
