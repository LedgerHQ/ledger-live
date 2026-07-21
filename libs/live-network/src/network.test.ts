import axios, { AxiosHeaders } from "axios";
import { getNetworkState } from "./state";
import network, { requestInterceptor, responseInterceptor, setNetworkState } from "./network";
import * as logs from "@ledgerhq/logs";

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

describe("network", () => {
  const DEFAULT_STATE = {
    enableNetworkLogs: getNetworkState().enableNetworkLogs,
    debugHttpResponse: getNetworkState().debugHttpResponse,
    ledgerClientVersion: getNetworkState().ledgerClientVersion,
    getCallsTimeout: getNetworkState().getCallsTimeout,
    getCallsRetry: getNetworkState().getCallsRetry,
  };

  afterEach(() => {
    jest.clearAllMocks();
    setNetworkState(DEFAULT_STATE);
  });

  describe("requestInterceptor", () => {
    test("should return provided request unchanged when network logs are disabled", () => {
      const request = {
        baseURL: "baseURL",
        url: "url",
        data: "data",
        headers: new AxiosHeaders(),
      };
      const req = requestInterceptor(request);
      expect(req).toEqual(request);
    });

    test("should attach request metadata when network logs are enabled", () => {
      setNetworkState({ enableNetworkLogs: true });

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

    test("should call log when network logs are enabled", () => {
      const spy = jest.spyOn(logs, "log");

      setNetworkState({ enableNetworkLogs: true });

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
    test("should return provided response unchanged when network logs are disabled", () => {
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

    test("should return provided response when network logs are enabled", () => {
      setNetworkState({ enableNetworkLogs: true });

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

    test("should call log when network logs are enabled", () => {
      const spy = jest.spyOn(logs, "log");

      setNetworkState({ enableNetworkLogs: true });

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
      expect(mockedAxios).toHaveBeenCalledTimes(DEFAULT_STATE.getCallsRetry + 1);
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

  describe("ledger client version headers", () => {
    test("should set ledger client version as axios client headers", () => {
      setNetworkState({ ledgerClientVersion: "wallet-cli/0.1.1" });

      expect(axios.defaults.headers.common["X-Ledger-Client-Version"]).toBe("wallet-cli/0.1.1");
      expect(axios.defaults.headers.common["User-Agent"]).toBe("wallet-cli/0.1.1");
    });

    test("should clear ledger client version headers when ledgerClientVersion is empty", () => {
      setNetworkState({ ledgerClientVersion: "wallet-cli/0.1.1" });
      setNetworkState({ ledgerClientVersion: "" });

      expect(axios.defaults.headers.common["X-Ledger-Client-Version"]).toBeUndefined();
      expect(axios.defaults.headers.common["User-Agent"]).toBeUndefined();
    });
  });
});
