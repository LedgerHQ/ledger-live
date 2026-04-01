import { createProxyServer, resetProxyStats } from "../proxy/proxy-server";
import {
  applyLatency,
  shouldDropResponse,
  shouldInjectError,
  NO_FAULTS,
} from "../proxy/fault-injector";
import type { FaultConfig } from "../proxy/fault-injector";

describe("fault-injector helpers", () => {
  describe("applyLatency", () => {
    it("resolves immediately when latencyMs=0", async () => {
      const start = Date.now();
      await applyLatency(NO_FAULTS);
      expect(Date.now() - start).toBeLessThan(50);
    });

    it("waits approximately the specified delay", async () => {
      const start = Date.now();
      await applyLatency({ ...NO_FAULTS, latencyMs: 100 });
      expect(Date.now() - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe("shouldDropResponse", () => {
    it("always returns false when dropResponses=false", () => {
      const config: FaultConfig = { ...NO_FAULTS, dropResponses: false };
      for (let i = 0; i < 100; i++) {
        expect(shouldDropResponse(config)).toBe(false);
      }
    });
  });

  describe("shouldInjectError", () => {
    it("always returns false when errorRate=0", () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldInjectError({ ...NO_FAULTS, errorRate: 0 })).toBe(false);
      }
    });

    it("always returns true when errorRate=1", () => {
      for (let i = 0; i < 20; i++) {
        expect(shouldInjectError({ ...NO_FAULTS, errorRate: 1 })).toBe(true);
      }
    });
  });
});

describe("createProxyServer", () => {
  afterEach(() => {
    resetProxyStats();
  });

  it("creates server and getStats without throwing", () => {
    const { server, port, getStats } = createProxyServer("https://example.com");
    expect(server).toBeDefined();
    expect(port).toBeInstanceOf(Promise);
    expect(typeof getStats).toBe("function");
    const s = getStats();
    expect(s.totalRequests).toBe(0);
    server.close();
  });

  it("creates server with fault config", () => {
    const faultConfig: FaultConfig = {
      latencyMs: 50,
      errorRate: 0.1,
      dropResponses: false,
    };
    const { server } = createProxyServer("https://example.com", faultConfig);
    expect(server).toBeDefined();
    server.close();
  });
});
