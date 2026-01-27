import axios, {
  type AxiosPromise,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import { changes, getEnv } from "@ledgerhq/live-env";
import { retry } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";

type Metadata = { startTime: number };
type ExtendedAxiosRequestConfig = InternalAxiosRequestConfig & { metadata?: Metadata };

export const requestInterceptor = (
  request: ExtendedAxiosRequestConfig,
): ExtendedAxiosRequestConfig => {
  if (!getEnv("ENABLE_NETWORK_LOGS")) {
    return request;
  }

  const { baseURL, url, method = "", data } = request;
  log("network", `${method} ${baseURL || ""}${url}`, { data });

  request.metadata = {
    startTime: Date.now(),
  };

  return request;
};

type ExtendedAxiosResponse = AxiosResponse & { config: { metadata?: Metadata } };

export const responseInterceptor = (response: ExtendedAxiosResponse): ExtendedAxiosResponse => {
  if (!getEnv("ENABLE_NETWORK_LOGS")) {
    return response;
  }

  const { baseURL, url, method, metadata } = response.config;
  const { startTime = 0 } = metadata || {};

  log(
    "network-success",
    `${response.status} ${method} ${baseURL || ""}${url} (${(Date.now() - startTime).toFixed(
      0,
    )}ms)`,
    { data: response.data },
  );

  return response;
};

type InterceptedResponse = AxiosResponse & {
  config: ExtendedAxiosRequestConfig;
};
type InterceptedError = AxiosError & {
  response?: InterceptedResponse;
};

export const errorInterceptor = (error: InterceptedError): InterceptedError => {
  const config = error?.response?.config;
  if (!config) throw error;
  const { baseURL, url, method = "", metadata } = config as ExtendedAxiosRequestConfig;
  const { startTime = 0 } = metadata || {};

  const duration = `${(Date.now() - startTime).toFixed(0)}ms`;

  let errorToThrow: Error;
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
      errorToThrow = makeError(`API HTTP ${status} ${url}`, status, url, method);
    }

    log(
      "network-error",
      `${status} ${method} ${baseURL || ""}${url} (${duration}): ${errorToThrow.message}`,
      getEnv("DEBUG_HTTP_RESPONSE") ? { data: data } : {},
    );
    throw errorToThrow;
  } else if (error.request) {
    log("network-down", `DOWN ${method} ${baseURL || ""}${url} (${duration})`);
    throw new NetworkDown();
  }
  throw error;
};

axios.interceptors.request.use(requestInterceptor);
axios.interceptors.response.use(responseInterceptor, errorInterceptor);

/**
 * We only allow HTTPS agent on platforms other than LLM because
 * https library is not compatible with react native
 */
const NETWORK_USE_HTTPS_KEEP_ALIVE = !getEnv("LEDGER_CLIENT_VERSION")?.startsWith("llm-");
if (NETWORK_USE_HTTPS_KEEP_ALIVE) {
  // the keepAlive is necessary when we make a lot of request in in parallel, especially for bitcoin sync. Otherwise, it may raise "connect ETIMEDOUT" error
  // this should only be needed in Windows as UNIX systems reuse TCP packets by default
  // refer to https://stackoverflow.com/questions/63064393/getting-axios-error-connect-etimedout-when-making-high-volume-of-calls
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const https = require("https");
  axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });
}

const makeError = (msg: string, status: number, url: string | undefined, method: string) => {
  const obj = {
    status,
    url,
    method,
    msg,
  };
  return (status || "").toString().startsWith("4")
    ? new LedgerAPI4xx(msg, obj)
    : new LedgerAPI5xx(msg, obj);
};

const getErrorMessage = (data: Record<string, any>): string | null | undefined => {
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

export type LiveNetworkRequest<T> = {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string | number | boolean>;
  baseURL?: string;
  params?: unknown;
  data?: T;
  timeout?: number;
};
export type LiveNetworkResponse<T> = {
  headers?: AxiosResponse<T>["headers"];
  data: T;
  status: number;
};

// inspired by https://github.com/sindresorhus/got/blob/main/documentation/7-retry.md#retry
const retryableHttpStatusCodes = [408, 413, 429, 500, 502, 503, 504, 521, 522, 524];

/**
 * Network call
 * @param request
 * @returns
 */
export const newImplementation = async <T = unknown, U = unknown>(
  request: LiveNetworkRequest<U>,
): Promise<LiveNetworkResponse<T>> => {
  let response: AxiosResponse<T>;

  if (!("method" in request)) {
    request.method = "GET";
  }

  if (request.method === "GET") {
    if (!("timeout" in request)) {
      request.timeout = getEnv("GET_CALLS_TIMEOUT");
    }

    response = await retry(() => axios(request), {
      maxRetry: getEnv("GET_CALLS_RETRY"),
      retryCondition: error => {
        if (error && error.status) {
          // not all status codes are retryable
          return retryableHttpStatusCodes.includes(error.status);
        }
        return true;
      },
    });
  } else {
    response = await axios(request);
  }

  const { data, status, headers } = response;
  return { data, status, headers };
};

/**
 * Network call
 * @deprecated Use new method by updating your import: `@ledgerhq/live-network`
 * @param arg Axios request type
 * @returns Axios response type
 */
const implementation = <T = any>(arg: AxiosRequestConfig): AxiosPromise<T> => {
  let promise: AxiosPromise;

  if (arg.method === "GET") {
    if (!("timeout" in arg)) {
      arg.timeout = getEnv("GET_CALLS_TIMEOUT");
    }

    promise = retry(() => axios(arg), {
      maxRetry: getEnv("GET_CALLS_RETRY"),
      retryCondition: error => {
        if (error && error.status) {
          // A 422 shouldn't be retried without change as explained in this documentation
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
          return error.status !== 422;
        }
        return true;
      },
    });
  } else {
    promise = axios(arg);
  }

  return promise;
};

// attach the env "LEDGER_CLIENT_VERSION" to set the header globally for axios
function setAxiosLedgerClientVersionHeader(value: string) {
  if (value) {
    axios.defaults.headers.common["X-Ledger-Client-Version"] = value;
  } else {
    delete axios.defaults.headers.common["X-Ledger-Client-Version"];
  }
}
setAxiosLedgerClientVersionHeader(getEnv("LEDGER_CLIENT_VERSION"));
changes.subscribe(e => {
  if (e.name === "LEDGER_CLIENT_VERSION") {
    setAxiosLedgerClientVersionHeader(e.value);
  }
});

export default implementation;
