import wretch from "wretch";
import AbortAddon from "wretch/addons/abort";
import QueryStringAddon from "wretch/addons/queryString";

// FIXME how to do without breaking the user land running on the web?
/*
if (typeof fetch === "undefined") {
  wretch.polyfills({
    fetch: require("node-fetch"),
  });
}
*/

const wretchImplementation = wretch()
  .addon(AbortAddon())
  .addon(QueryStringAddon);

// TODO what if we have global ENV that changes and we need to change some of the wretch defaults then?
// for now, that means we need to getNetwork() again each time :thinking_face:

export function getNetwork(): typeof wretchImplementation {
  // if we listen to global env changes we could update the wretchImplementation

  return wretchImplementation;
  /*
  .middlewares([
    retry({
      maxAttempts: getEnv("GET_CALLS_RETRY"),
      retryOnNetworkError: true,
    }),
  ]);
  */

  // TODO getEnv("GET_CALLS_TIMEOUT") is it possible to set a default mecanism for the setStatus on get calls? – otherwise maybe we don't timeout anymore
}

// TODO ideally this should be an "env" that this code would "listen" to changes?
// because other implementation of networking (eg in underlying coin intés) would need to access this too
export const setGlobalLedgerHeader = (_value: string): void => {
  /*
  wretchImplementation = wretchImplementation.headers({
    ["X-Ledger-Client-Version"]: value,
  });
  */
};

// TODO i didn't recreated this in wretch yet. we may want to rethink this as a whole?

/*
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
*/

/**
 * reimplement the old previous interface! the goal would be to kill this function
 * @deprecated
 */
export default async function (arg: {
  method?: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  paramsSerializer?: (params: Record<string, any>) => string;
  transformResponse?: (text: string) => any;
  data?: any;
  auth?: { username: string; password: string };
}): Promise<{ data: any; status: number }> {
  const {
    method,
    url,
    headers,
    params,
    paramsSerializer,
    transformResponse,
    data,
    auth,
  } = arg;

  let n = getNetwork();

  if (params) {
    n = n.query(paramsSerializer ? paramsSerializer(params) : params);
  }

  n = n.url(url);

  if (auth) {
    // TODO
  }

  if (data) {
    n = n
      .headers({
        "Content-Type": "application/json",
      })
      .body(JSON.stringify(data));
  }

  if (headers) {
    n = n.headers(headers);
  }

  const r = method === "POST" ? await n.post() : await n.get();

  const response = await r.res();

  const json = transformResponse
    ? await response.text().then(transformResponse)
    : await r.json();

  return { data: json, status: response.status };
}
