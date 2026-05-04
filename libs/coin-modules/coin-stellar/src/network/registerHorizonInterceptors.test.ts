/**
 * Unit tests for registerHorizonInterceptors.
 *
 * Each test uses jest.isolateModules so that:
 *  - the `interceptorsRegistered` flag inside horizon.ts starts at `false`
 *  - `coinConfig` and `Horizon.AxiosClient` are fresh instances shared consistently
 *    within the isolated module registry (stellar-sdk is re-resolved but cached for
 *    all requires inside the same isolateModules block)
 */
import type { StellarCoinConfig } from "../config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type IsolatedHorizon = typeof import("@stellar/stellar-sdk");
type IsolatedHorizonModule = typeof import("./horizon");
type IsolatedConfigModule = typeof import("../config");

function isolatedRequire(): {
  Horizon: IsolatedHorizon["Horizon"];
  registerHorizonInterceptors: IsolatedHorizonModule["registerHorizonInterceptors"];
  coinConfig: IsolatedConfigModule["default"];
} {
  // `require` here runs inside the jest.isolateModules callback supplied by each test
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { Horizon } = require("@stellar/stellar-sdk") as IsolatedHorizon;
  const { registerHorizonInterceptors } = require("./horizon") as IsolatedHorizonModule;
  const coinConfig = (require("../config") as IsolatedConfigModule).default;
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { Horizon, registerHorizonInterceptors, coinConfig };
}

/** Returns the last element of an array without relying on Array.prototype.at (es2022). */
function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

/** Builds a minimal HttpClientResponse-compatible mock object. */
function makeResponse(overrides: { status?: number; config?: object; data?: unknown } = {}) {
  return {
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
    data: {},
    ...overrides,
  };
}

function makeConfig(overrides: Partial<StellarCoinConfig> = {}): StellarCoinConfig {
  return {
    status: { type: "active" },
    explorer: { url: "https://horizon.test.invalid" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("registerHorizonInterceptors", () => {
  describe("idempotency", () => {
    it("registers each interceptor exactly once even when called multiple times", () => {
      jest.isolateModules(() => {
        const { Horizon, registerHorizonInterceptors } = isolatedRequire();

        const reqSpy = jest.spyOn(Horizon.AxiosClient.interceptors.request, "use");
        const resSpy = jest.spyOn(Horizon.AxiosClient.interceptors.response, "use");

        registerHorizonInterceptors();
        registerHorizonInterceptors();
        registerHorizonInterceptors();

        expect(reqSpy).toHaveBeenCalledTimes(1);
        expect(resSpy).toHaveBeenCalledTimes(1);

        reqSpy.mockRestore();
        resSpy.mockRestore();
      });
    });

    it("does not throw when called multiple times", () => {
      jest.isolateModules(() => {
        const { registerHorizonInterceptors } = isolatedRequire();
        expect(() => {
          registerHorizonInterceptors();
          registerHorizonInterceptors();
        }).not.toThrow();
      });
    });
  });

  describe("resilience when coinConfig is not initialised", () => {
    it("registerHorizonInterceptors itself does not throw without coinConfig", () => {
      jest.isolateModules(() => {
        const { registerHorizonInterceptors } = isolatedRequire();
        expect(() => registerHorizonInterceptors()).not.toThrow();
      });
    });

    it("request interceptor returns config unchanged and does not throw", () => {
      jest.isolateModules(() => {
        const { Horizon, registerHorizonInterceptors } = isolatedRequire();
        registerHorizonInterceptors();

        const handler = last(Horizon.AxiosClient.interceptors.request.handlers);
        expect(handler).toBeDefined();

        const mockConfig = {
          url: "/accounts/G123",
          method: "GET",
          baseURL: "https://horizon.test.invalid",
        };
        expect(() => handler!.fulfilled(mockConfig)).not.toThrow();
        expect(handler!.fulfilled(mockConfig)).toBe(mockConfig);
      });
    });

    it("response interceptor returns response unchanged and does not throw", () => {
      jest.isolateModules(() => {
        const { Horizon, registerHorizonInterceptors } = isolatedRequire();
        registerHorizonInterceptors();

        const handler = last(Horizon.AxiosClient.interceptors.response.handlers);
        expect(handler).toBeDefined();

        const mockResponse = makeResponse();
        expect(() => handler!.fulfilled(mockResponse)).not.toThrow();
        expect(handler!.fulfilled(mockResponse)).toBe(mockResponse);
      });
    });
  });

  describe("URL rewriting (always active, independent of logging)", () => {
    it("rewrites _links.next.href to use the configured host", () => {
      jest.isolateModules(() => {
        const { Horizon, registerHorizonInterceptors, coinConfig } = isolatedRequire();
        coinConfig.setCoinConfig(() => makeConfig());
        registerHorizonInterceptors();

        const handler = last(Horizon.AxiosClient.interceptors.response.handlers);

        const data = {
          _links: {
            next: { href: "https://some-internal-node.stellar.org/operations?cursor=123" },
          },
        };

        handler!.fulfilled(makeResponse({ data }));

        expect(data._links.next.href).toBe("https://horizon.test.invalid/operations?cursor=123");
      });
    });

    it("rewrites _embedded.records[].transaction._links.ledger.href to use the configured host", () => {
      jest.isolateModules(() => {
        const { Horizon, registerHorizonInterceptors, coinConfig } = isolatedRequire();
        coinConfig.setCoinConfig(() => makeConfig());
        registerHorizonInterceptors();

        const handler = last(Horizon.AxiosClient.interceptors.response.handlers);

        const data = {
          _embedded: {
            records: [
              {
                transaction: {
                  _links: { ledger: { href: "https://some-internal-node.stellar.org/ledgers/55" } },
                },
              },
              {
                transaction: {
                  _links: { ledger: { href: "https://some-internal-node.stellar.org/ledgers/56" } },
                },
              },
            ],
          },
        };

        handler!.fulfilled(makeResponse({ data }));

        expect(data._embedded.records[0].transaction._links.ledger.href).toBe(
          "https://horizon.test.invalid/ledgers/55",
        );
        expect(data._embedded.records[1].transaction._links.ledger.href).toBe(
          "https://horizon.test.invalid/ledgers/56",
        );
      });
    });
  });

  describe("network logging (gated on enableNetworkLogs)", () => {
    it("emits network log for requests when enableNetworkLogs is true", () => {
      jest.isolateModules(() => {
        const logMock = jest.fn();
        jest.mock("@ledgerhq/logs", () => ({ log: logMock }));

        const { Horizon, registerHorizonInterceptors, coinConfig } = isolatedRequire();
        coinConfig.setCoinConfig(() => makeConfig({ enableNetworkLogs: true }));
        registerHorizonInterceptors();

        const handler = last(Horizon.AxiosClient.interceptors.request.handlers);
        handler!.fulfilled({
          url: "/accounts/G123",
          method: "GET",
          baseURL: "https://horizon.test.invalid",
        });

        expect(logMock).toHaveBeenCalledWith(
          "network",
          expect.stringContaining("/accounts/G123"),
          expect.anything(),
        );
      });
    });

    it("emits network-success log for responses with elapsed time when enableNetworkLogs is true", () => {
      jest.isolateModules(() => {
        const logMock = jest.fn();
        jest.mock("@ledgerhq/logs", () => ({ log: logMock }));

        const { Horizon, registerHorizonInterceptors, coinConfig } = isolatedRequire();
        coinConfig.setCoinConfig(() => makeConfig({ enableNetworkLogs: true }));
        registerHorizonInterceptors();

        const reqHandler = last(Horizon.AxiosClient.interceptors.request.handlers);
        const resHandler = last(Horizon.AxiosClient.interceptors.response.handlers);

        const config = {
          url: "/accounts/G123",
          method: "GET",
          baseURL: "https://horizon.test.invalid",
        };
        reqHandler!.fulfilled(config);

        const mockResponse = makeResponse({ status: 200, config });
        resHandler!.fulfilled(mockResponse);

        expect(logMock).toHaveBeenCalledWith(
          "network-success",
          expect.stringMatching(/200 GET.*\/accounts\/G123.*\d+ms/),
          expect.anything(),
        );
      });
    });

    it("does not emit any log when enableNetworkLogs is false", () => {
      jest.isolateModules(() => {
        const logMock = jest.fn();
        jest.mock("@ledgerhq/logs", () => ({ log: logMock }));

        const { Horizon, registerHorizonInterceptors, coinConfig } = isolatedRequire();
        coinConfig.setCoinConfig(() => makeConfig({ enableNetworkLogs: false }));
        registerHorizonInterceptors();

        const reqHandler = last(Horizon.AxiosClient.interceptors.request.handlers);
        const resHandler = last(Horizon.AxiosClient.interceptors.response.handlers);

        const config = {
          url: "/accounts/G123",
          method: "GET",
          baseURL: "https://horizon.test.invalid",
        };
        reqHandler!.fulfilled(config);
        resHandler!.fulfilled(makeResponse({ config }));

        expect(logMock).not.toHaveBeenCalled();
      });
    });
  });
});
