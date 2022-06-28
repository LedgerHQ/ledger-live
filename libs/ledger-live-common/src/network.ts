import invariant from "invariant";
import axios, { AxiosResponse } from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { log } from "@ledgerhq/logs";
import { NetworkDown } from "@ledgerhq/errors";
import { retry } from "./promise";
import { getEnv } from "./env";

type Metadata = { startTime: number };
type ExtendedXHRConfig = AxiosRequestConfig & { metadata?: Metadata };

export const requestInterceptor = (
  request: AxiosRequestConfig
): ExtendedXHRConfig => {
  const { baseURL, url, method = "", data } = request;
  log("network", `${method} ${baseURL || ""}${url}`, { data });

  // $FlowFixMe (LLD side)
  const req: ExtendedXHRConfig = request;

  req.metadata = {
    startTime: Date.now(),
  };

  return req;
};

export const responseInterceptor = (
  response: {
    config: ExtendedXHRConfig;
  } & AxiosResponse<any>
) => {
  const { baseURL, url, method = "", metadata } = response.config;
  const { startTime = 0 } = metadata || {};

  log(
    "network-success",
    `${response.status} ${method} ${baseURL || ""}${url} (${(
      Date.now() - startTime
    ).toFixed(0)}ms)`,
    getEnv("DEBUG_HTTP_RESPONSE") ? { data: response.data } : undefined
  );

  return response;
};

export const errorInterceptor = (error: AxiosError<any>) => {
  const config = error?.response?.config as ExtendedXHRConfig | null;
  if (!config) throw error;
  const { baseURL, url, method = "", metadata } = config;
  const { startTime = 0 } = metadata || {};
  if (error.response) {
    const { data, status } = error.response;
    log(
      "network-error",
      `${status} ${method} ${baseURL || ""}${url} (${(
        Date.now() - startTime
      ).toFixed(0)}ms)`,
      getEnv("DEBUG_HTTP_RESPONSE") ? { data: data } : {}
    );
  } else if (error.request) {
    log(
      "network-down",
      `DOWN ${method} ${baseURL || ""}${url} (${(
        Date.now() - startTime
      ).toFixed(0)}ms)`
    );
    throw new NetworkDown();
  }
  throw error;
};

axios.interceptors.request.use(requestInterceptor);

// $FlowFixMe LLD raise issues here
axios.interceptors.response.use(responseInterceptor, errorInterceptor);

const implementation = (arg: any): Promise<any> => {
  invariant(typeof arg === "object", "network takes an object as parameter");
  let promise;

  if (arg.method === "GET") {
    if (!("timeout" in arg)) {
      arg.timeout = getEnv("GET_CALLS_TIMEOUT");
    }

    promise = retry(() => axios(arg), {
      maxRetry: getEnv("GET_CALLS_RETRY"),
    });
  } else {
    promise = axios(arg);
  }

  return promise;
};

export default implementation;
