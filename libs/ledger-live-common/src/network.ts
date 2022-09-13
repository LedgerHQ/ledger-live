import invariant from "invariant";
import axios, { AxiosResponse } from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { log } from "@ledgerhq/logs";
import { NetworkDown, LedgerAPI5xx, LedgerAPI4xx } from "@ledgerhq/errors";
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

  let errorToThrow;
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, status } = error.response;
    let msg;
    try {
      if (data && typeof data === "string") {
        msg = extractErrorMessage(data);
      } else if (data && typeof data === "object") {
        msg = getErrorMessage(data);
      }
    } catch (e) {
      log("warn", "can't parse server result " + String(e));
    }

    if (msg) {
      errorToThrow = makeError(msg, status, url, method);
    } else {
      errorToThrow = makeError(`API HTTP ${status}`, status, url, method);
    }
    log(
      "network-error",
      `${status} ${method} ${baseURL || ""}${url} (${(
        Date.now() - startTime
      ).toFixed(0)}ms): ${errorToThrow.message}`,
      getEnv("DEBUG_HTTP_RESPONSE") ? { data: data } : {}
    );
    throw errorToThrow;
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

const makeError = (msg, status, url, method) => {
  const obj = {
    status,
    url,
    method,
  };
  return (status || "").toString().startsWith("4")
    ? new LedgerAPI4xx(msg, obj)
    : new LedgerAPI5xx(msg, obj);
};

const getErrorMessage = (
  data: Record<string, any>
): string | null | undefined => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.errors) {
    return getErrorMessage(data.errors[0]);
  }
  return data.message || data.error_message || data.error || data.msg;
};

const extractErrorMessage = (raw: string): string | undefined => {
  let data = JSON.parse(raw);
  if (data && Array.isArray(data)) data = data[0];
  let msg = getErrorMessage(data);

  if (typeof msg === "string") {
    const m = msg.match(/^JsDefined\((.*)\)$/);
    const innerPart = m ? m[1] : msg;

    const r = JSON.parse(innerPart);
    let message = r.message;
    if (typeof message === "object") {
      message = message.message;
    }
    if (typeof message === "string") {
      msg = message;
    }

    return msg ? String(msg) : undefined;
  }

  return;
};

const implementation = (arg: AxiosRequestConfig): Promise<any> => {
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
