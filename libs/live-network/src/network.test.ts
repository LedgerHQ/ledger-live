import axios, { AxiosHeaders } from "axios";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import network, { requestInterceptor, responseInterceptor } from "./network";
import * as logs from "@ledgerhq/logs";

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

describe("network", () => {
  const DEFAULT_ENABLE_NETWORK_LOGS = getEnv("ENABLE_NETWORK_LOGS");
  const DEFAULT_GET_CALLS_RETRY = getEnv("GET_CALLS_RETRY");

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Restore DEFAULT_ENABLE_NETWORK_LOGS
    setEnv("ENABLE_NETWORK_LOGS", DEFAULT_ENABLE_NETWORK_LOGS);
  });

  describe("requestInterceptor", () => {
    test("should return provided request when ENABLE_NETWORK_LOGS is false", () => {
      const request = {
        baseURL: "baseURL",
        url: "url",
        data: "data",
        headers: new AxiosHeaders(),
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
        headers: new AxiosHeaders(),
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
        headers: new AxiosHeaders(),
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
          headers: new AxiosHeaders(),
        },
        data: "data",
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
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
          headers: new AxiosHeaders(),
        },
        headers: new AxiosHeaders(),
        data: "data",
        status: 200,
        statusText: "OK",
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
          headers: new AxiosHeaders(),
        },
        headers: new AxiosHeaders(),
        data: "data",
        status: 200,
        statusText: "OK",
      };
      responseInterceptor(response);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should retry request when unsuccessful and response status is not 422", async () => {
      const response = {
        config: {
          baseURL: "baseURL",
          url: "url",
          data: "data",
          headers: new AxiosHeaders(),
        },
        data: "data",
        status: 500,
        statusText: "Error",
        headers: new AxiosHeaders(),
      };

      try {
        mockedAxios.mockImplementation(() => Promise.reject(response));
        await network({
          method: "GET",
          url: "https://google.com",
        });
        // eslint-disable-next-line no-empty
      } catch {}
      expect(mockedAxios).toHaveBeenCalledTimes(DEFAULT_GET_CALLS_RETRY + 1);
    });

    test("should not retry request when response status is 422", async () => {
      const response = {
        config: {
          baseURL: "baseURL",
          url: "url",
          data: "data",
        },
        data: "data",
        status: 422,
        statusText: "Error",
        headers: {},
      };
      mockedAxios.mockImplementation(() => Promise.reject(response));

      try {
        await network({
          method: "GET",
          url: "https://google.com",
        });
        // eslint-disable-next-line no-empty
      } catch {}
      expect(mockedAxios).toHaveBeenCalledTimes(1);
    });
  });
});
