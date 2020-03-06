// @flow
import axios from "axios";
import { log } from "@ledgerhq/logs";
import { NetworkDown, LedgerAPI5xx, LedgerAPI4xx } from "@ledgerhq/errors";
import { retry } from "./promise";
import { getEnv } from "./env";

const makeError = (msg, status, url, method) => {
  const obj = {
    status,
    url,
    method
  };
  return (status || "").toString().startsWith("4")
    ? new LedgerAPI4xx(msg, obj)
    : new LedgerAPI5xx(msg, obj);
};

const extractErrorMessage = (raw: string): ?string => {
  try {
    let data = JSON.parse(raw);
    if (data && Array.isArray(data)) data = data[0];
    let msg = data.error || data.message || data.error_message || data.msg;
    if (typeof msg === "string") {
      const m = msg.match(/^JsDefined\((.*)\)$/);
      const innerPart = m ? m[1] : msg;
      try {
        const r = JSON.parse(innerPart);
        let message = r.message;
        if (typeof message === "object") {
          message = message.message;
        }
        if (typeof message === "string") {
          msg = message;
        }
      } catch (e) {
        log("warn", "can't parse server result " + String(e));
      }
      return msg ? String(msg) : null;
    }
  } catch (e) {
    log("warn", "can't parse server result " + String(e));
  }
  return null;
};

const userFriendlyError = <A>(p: Promise<A>, meta): Promise<A> =>
  p.catch(error => {
    const { url, method, startTime } = meta;
    let errorToThrow;
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { data, status } = error.response;
      let msg;
      if (data && typeof data === "string") {
        msg = extractErrorMessage(data);
      }
      if (msg) {
        errorToThrow = makeError(msg, status, url, method);
      } else {
        errorToThrow = makeError(`API HTTP ${status}`, status, url, method);
      }
      log(
        "network-error",
        `${status} ${method} ${url} (${(Date.now() - startTime).toFixed(
          0
        )}ms): ${errorToThrow.message}`,
        getEnv("DEBUG_HTTP_RESPONSE") ? { data } : {}
      );
      throw errorToThrow;
    } else if (error.request) {
      log(
        "network-down",
        `DOWN ${method} ${url} (${(Date.now() - startTime).toFixed(0)}ms)`
      );
      throw new NetworkDown();
    }
    throw error;
  });

const implementation = (arg: Object): Promise<*> => {
  let promise;
  if (arg.method === "GET") {
    if (!("timeout" in arg)) {
      arg.timeout = getEnv("GET_CALLS_TIMEOUT");
    }
    // $FlowFixMe
    promise = retry(() => axios(arg), {
      maxRetry: getEnv("GET_CALLS_RETRY")
    });
  } else {
    // $FlowFixMe
    promise = axios(arg);
  }
  const meta = {
    url: arg.url,
    method: arg.method,
    data: arg.data,
    startTime: Date.now()
  };

  log("network", `${meta.method} ${meta.url}`, { data: arg.data });

  return userFriendlyError(
    promise.then(response => {
      log(
        "network-success",
        `${response.status} ${meta.method} ${meta.url} (${(
          Date.now() - meta.startTime
        ).toFixed(0)}ms)`,
        getEnv("DEBUG_HTTP_RESPONSE") ? { data: response.data } : {}
      );
      return response;
    }),
    meta
  );
};

function SyncTokenDisabled(response) {
  this.response = response;
}

const Header = "X-LedgerWallet-SyncToken";
axios.interceptors.request.use(config => {
  if (getEnv("DISABLE_SYNC_TOKEN")) {
    if (config.url.endsWith("/syncToken")) {
      throw new SyncTokenDisabled({
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json; charset=utf-8"
        },
        config,
        data: '{"token":""}'
      });
    }
    if (config.headers && Header in config.headers) {
      delete config.headers[Header];
      const prop = config.url.includes("v2") ? "noToken=true" : "no_token=true";
      config.url = config.url + (config.url.includes("?") ? "&" : "?") + prop;
    }
  }
  return config;
});

axios.interceptors.response.use(
  r => {
    return r;
  },
  e => {
    if (e instanceof SyncTokenDisabled) {
      return e.response;
    }
    return Promise.reject(e);
  }
);

export default implementation;
