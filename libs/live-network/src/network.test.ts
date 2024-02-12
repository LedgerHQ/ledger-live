import { getEnv, setEnv } from "@ledgerhq/live-env";
import { requestInterceptor, responseInterceptor } from "./network";
import * as logs from "@ledgerhq/logs";

describe("network", () => {
  const DEFAULT_ENABLE_NETWORK_LOGS = getEnv("ENABLE_NETWORK_LOGS");

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();

    // Restore DEFAULT_ENABLE_NETWORK_LOGS
    setEnv("ENABLE_NETWORK_LOGS", DEFAULT_ENABLE_NETWORK_LOGS);
  });

  describe("requestInterceptor", () => {
    test("should return provided request when ENABLE_NETWORK_LOGS is false", () => {
      const request = {
        baseURL: "baseURL",
        url: "url",
        data: "data",
      };
      const req = requestInterceptor(request);
      expect(req).toEqual(request);
    });

    test("should return provided request with metadata when ENABLE_NETWORK_LOGS is true", () => {
      setEnv("ENABLE_NETWORK_LOGS", true);

      const request = {
        baseURL: "baseURL",
        url: "url",
        data: "data",
      };
      const req = requestInterceptor(request);
      expect(req).toEqual({
        ...request,
        metadata: { startTime: expect.any(Number) },
      });
    });

    test("should call log when ENABLE_NETWORK_LOGS is true", () => {
      const spy = jest.spyOn(logs, "log");

      setEnv("ENABLE_NETWORK_LOGS", true);

      const request = {
        baseURL: "baseURL",
        url: "url",
        data: "data",
      };
      requestInterceptor(request);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("responseInterceptor", () => {
    test("should return provided response when ENABLE_NETWORK_LOGS is false", () => {
      const response = {
        config: {
          baseURL: "baseURL",
          url: "url",
          data: "data",
        },
        data: "data",
        status: 200,
        statusText: "OK",
        headers: {},
      };
      const res = responseInterceptor(response);
      expect(res).toEqual(response);
    });

    test("should return provided response when ENABLE_NETWORK_LOGS is true", () => {
      setEnv("ENABLE_NETWORK_LOGS", true);

      const response = {
        config: {
          baseURL: "baseURL",
          url: "url",
          data: "data",
        },
        data: "data",
        status: 200,
        statusText: "OK",
        headers: {},
      };
      const res = responseInterceptor(response);
      expect(res).toEqual(response);
    });

    test("should call log when ENABLE_NETWORK_LOGS is true", () => {
      const spy = jest.spyOn(logs, "log");

      setEnv("ENABLE_NETWORK_LOGS", true);

      const response = {
        config: {
          baseURL: "baseURL",
          url: "url",
          data: "data",
        },
        data: "data",
        status: 200,
        statusText: "OK",
        headers: {},
      };
      responseInterceptor(response);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
