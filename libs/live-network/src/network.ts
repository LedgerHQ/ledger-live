import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import { changes, getEnv } from "@ledgerhq/live-env";
import { retry } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import type { AxiosError, AxiosRequestConfig, Method } from "axios";
import axios, { AxiosPromise, AxiosResponse } from "axios";
import invariant from "invariant";

type Metadata = { startTime: number };
type ExtendedXHRConfig = AxiosRequestConfig & { metadata?: Metadata };

export const requestInterceptor = (request: AxiosRequestConfig): ExtendedXHRConfig => {
  if (!getEnv("ENABLE_NETWORK_LOGS")) {
    return request;
  }

  const { baseURL, url, method = "", data } = request;
  log("network", `${method} ${baseURL || ""}${url}`, { data });

  const req: ExtendedXHRConfig = request;

  req.metadata = {
    startTime: Date.now(),
  };

  return req;
};

type InterceptedResponse = {
  config: ExtendedXHRConfig;
} & AxiosResponse<any>;

export const responseInterceptor = (response: InterceptedResponse): InterceptedResponse => {
  if (!getEnv("ENABLE_NETWORK_LOGS")) {
    return response;
  }

  const { baseURL, url, method = "", metadata } = response.config;
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

type InterceptedError = {
  response?: InterceptedResponse;
} & AxiosError<any>;

export const errorInterceptor = (error: InterceptedError): InterceptedError => {
  const config = error?.response?.config;
  if (!config) throw error;
  const { baseURL, url, method = "", metadata } = config;
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
      errorToThrow = makeError(`API HTTP ${status}`, status, url, method);
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

const userAgent = navigator.userAgent.toLowerCase();
if (userAgent.includes(" electron/")) {
  // the keepAlive is necessary when we make a lot of request in in parallel, especially for bitcoin sync. Otherwise, it may raise "connect ETIMEDOUT" error
  // refer to https://stackoverflow.com/questions/63064393/getting-axios-error-connect-etimedout-when-making-high-volume-of-calls
  // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
  const https = require("https");
  axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });
}

const makeError = (msg: string, status: number, url: string | undefined, method: Method | "") => {
  const obj = {
    status,
    url,
    method,
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

const implementation = <T = any>(arg: AxiosRequestConfig): AxiosPromise<T> => {
  invariant(typeof arg === "object", "network takes an object as parameter");
  let promise: AxiosPromise;

  if (arg.method === "GET") {
    if (!arg.timeout) {
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
