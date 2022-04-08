/* eslint-disable new-cap */
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { deserializeError, serializeError } from "@ledgerhq/errors";
import { CoreWalletPool, reflect } from "../types";
import type { Core, CoreStatics } from "../types";
import { setLoadCoreImplementation } from "../access";
import { setRemapLibcoreErrorsImplementation } from "../errors";
import { getEnv } from "../../env";
import network from "../../network";

import crypto from "crypto";

import path from "path";

import fs from "fs";

const prefixHex0x = (str) => (str.startsWith("0x") ? str : "0x" + str);

const unprefixHex0x = (str) => (str.startsWith("0x") ? str.slice(2) : str);

const hexToBytes = (str) => Array.from(Buffer.from(unprefixHex0x(str), "hex"));

const bytesToHex = (buf) => Buffer.from(buf).toString("hex");

const bytesArrayToString = (bytesArray: string[] = []) =>
  Buffer.from(bytesArray as any).toString();

const stringToBytesArray = (str) => Array.from(Buffer.from(str));

export default (arg: {
  // the actual @ledgerhq/ledger-core lib or a function that returns it
  lib: any;
  dbPath: string;
  dbPassword?: string;
}): void => {
  let lib;

  const lazyLoad = () => {
    if (lib) return;

    if (typeof arg.lib === "function") {
      lib = arg.lib();
    } else {
      lib = arg.lib;
    }
  };

  const { dbPath } = arg;
  const dbPassword =
    typeof arg.dbPassword === "undefined"
      ? getEnv("LIBCORE_PASSWORD")
      : arg.dbPassword;

  const loadCore = (): Promise<Core> => {
    lazyLoad();
    // feature detect if the bindings uses hex or array bytes
    const isUsingArrayOfBytes =
      "object" === typeof new lib.NJSDynamicArray().serialize();
    log("libcore", "using array of bytes = " + String(isUsingArrayOfBytes));
    const wrappers = {
      hex: isUsingArrayOfBytes ? hexToBytes : prefixHex0x,
    };
    const unwrappers = {
      hex: isUsingArrayOfBytes ? bytesToHex : unprefixHex0x,
    };
    const MAX_RANDOM = 2684869021;
    const lcore = new lib.NJSLedgerCore();
    const stringVersion = lcore.getStringVersion();
    const sqlitePrefix = `v${stringVersion.split(".")[0]}`;
    const NJSExecutionContextImpl = {
      execute: (runnable) => {
        try {
          const runFunction = () => runnable.run();

          setImmediate(runFunction);
        } catch (e) {
          log("libcore-Error", String(e));
        }
      },
      delay: (runnable, ms) => setTimeout(() => runnable.run(), ms),
    };
    const ThreadContexts = {};

    const getSerialExecutionContext = (name) => {
      let currentContext = ThreadContexts[name];

      if (!currentContext) {
        currentContext = new lib.NJSExecutionContext(NJSExecutionContextImpl);
        ThreadContexts[name] = currentContext;
      }

      return currentContext;
    };

    const getMainExecutionContext = () => getSerialExecutionContext("main");

    const NJSThreadDispatcher = new lib.NJSThreadDispatcher({
      contexts: ThreadContexts,
      getThreadPoolExecutionContext: (name) => getSerialExecutionContext(name),
      getMainExecutionContext,
      getSerialExecutionContext,
      newLock: () => {
        log(
          "libcore-Warn",
          "libcore NJSThreadDispatcher: newLock: Not implemented"
        );
      },
    });
    NJSThreadDispatcher.getMainExecutionContext = getMainExecutionContext;

    function createHttpConnection(res, libcoreError) {
      if (!res) {
        return null;
      }

      const headersMap = new Map();
      Object.keys(res.headers).forEach((key) => {
        if (typeof res.headers[key] === "string") {
          headersMap.set(key, res.headers[key]);
        }
      });
      const NJSHttpUrlConnectionImpl = {
        getStatusCode: () => Number(res.status),
        getStatusText: () => res.statusText,
        getHeaders: () => headersMap,
        readBody: () => ({
          error: libcoreError,
          data: isUsingArrayOfBytes ? stringToBytesArray(res.data) : res.data,
        }),
      };
      return new lib.NJSHttpUrlConnection(NJSHttpUrlConnectionImpl);
    }

    const NJSHttpClient = new lib.NJSHttpClient({
      execute: async (r) => {
        const method = r.getMethod();
        const headersMap = r.getHeaders();
        const url = r.getUrl();
        let data = r.getBody();
        const headers = {};
        headersMap.forEach((v, k) => {
          headers[k] = v;
        });
        let res;
        const param: Record<string, any> = {
          method: lib.METHODS[method],
          url,
          headers,
          validateStatus: (
            status // FIXME in future, everything should passthrough libcore
          ) =>
            // for now as we need to have the server error we will only pass-in 2xx and 404
            // FIXME for the FIXME: Stargate nodes return 500 when an account has no delegations
            // or no unbondings or no redelegations. So for cosmos, status 500 need to go to libcore for proper handling
            {
              const isCosmosRequest =
                url.includes("/cosmos/") || url.includes("cosmos.coin");
              return (
                (status >= 200 && status < 300) ||
                status === 404 ||
                (isCosmosRequest && status === 500)
              );
            },
          // the default would parse the request, we want to preserve the string
          transformResponse: (data) => data,
        };

        if (isUsingArrayOfBytes) {
          if (Array.isArray(data)) {
            if (data.length === 0) {
              data = null;
            } else {
              // we transform back to a string
              data = bytesArrayToString(data);
            }
          }
        } else if (
          headers["Content-Type"] &&
          headers["Content-Type"] === "application/x-binary"
        ) {
          data = Buffer.from(unprefixHex0x(data), "hex");
        } else {
          if (typeof data === "string" && data) {
            data = Buffer.from(unprefixHex0x(data), "hex").toString();
          }
        }

        if (data) {
          param.data = data;

          if (!headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
          }
        }

        try {
          res = await network(param);
          const urlConnection = createHttpConnection(res, null);
          r.complete(urlConnection, null);
        } catch (err: any) {
          const libcoreError = {
            code: lib.ERROR_CODE.HTTP_ERROR,
            message: JSON.stringify(
              serializeError({
                message: err.message,
                name: err.name,
              })
            ),
            stack: err.stack,
          };
          const urlConnection = createHttpConnection(res, libcoreError);
          r.complete(urlConnection, libcoreError);
        }
      },
    });
    const NJSWebSocketClient = new lib.NJSWebSocketClient({
      connect: (url, connection) => {
        connection.OnConnect();
      },
      send: (connection, data) => {
        connection.OnMessage(data);
      },
      disconnect: (connection) => {
        connection.OnClose();
      },
    });
    const NJSLogPrinter = new lib.NJSLogPrinter({
      context: {},
      printError: (message) => log("libcore-Error", message),
      printInfo: (message) => log("libcore-Info", message),
      printDebug: (message) => log("libcore-Debug", message),
      printWarning: (message) => log("libcore-Warning", message),
      printApdu: (message) => log("libcore-Apdu", message),
      printCriticalError: (message) => log("libcore-CriticalError", message),
      getContext: () => new lib.NJSExecutionContext(NJSExecutionContextImpl),
    });
    const NJSRandomNumberGenerator = new lib.NJSRandomNumberGenerator({
      getRandomBytes: isUsingArrayOfBytes
        ? (size) =>
            // @ts-expect-error Buffer lib ts definition missmatch
            Array.from(Buffer.from(crypto.randomBytes(size), "hex"))
        : (size) => "0x" + crypto.randomBytes(size).toString("hex"),
      getRandomInt: () => Math.random() * MAX_RANDOM,
      getRandomLong: () => Math.random() * MAX_RANDOM * MAX_RANDOM,
    });
    const NJSDatabaseBackend = new lib.NJSDatabaseBackend();
    const config = new lib.NJSDynamicObject();
    // We handle logs ourself with the logger
    // still overridable by env
    config.putBoolean(
      "ENABLE_INTERNAL_LOGGING",
      !!process.env.LIBCORE_ENABLE_INTERNAL_LOGGING
    );
    let walletPoolInstance: CoreWalletPool | null = null;

    const instanciateWalletPool = (): CoreWalletPool => {
      try {
        fs.mkdirSync(dbPath);
      } catch (err: any) {
        if (err.code !== "EEXIST") {
          throw err;
        }
      }

      const NJSPathResolver = new lib.NJSPathResolver({
        resolveLogFilePath: (pathToResolve) => {
          const hash = pathToResolve.replace(/\//g, "__");
          return path.resolve(dbPath, `./log_file_${sqlitePrefix}_${hash}`);
        },
        resolvePreferencesPath: (pathToResolve) => {
          const hash = pathToResolve.replace(/\//g, "__");
          return path.resolve(dbPath, `./preferences_${sqlitePrefix}_${hash}`);
        },
        resolveDatabasePath: (pathToResolve) => {
          const hash = pathToResolve.replace(/\//g, "__");
          return path.resolve(dbPath, `./database_${sqlitePrefix}_${hash}`);
        },
      });
      walletPoolInstance = new lib.NJSWalletPool(
        "ledgerlive",
        dbPassword,
        NJSHttpClient,
        NJSWebSocketClient,
        NJSPathResolver,
        NJSLogPrinter,
        NJSThreadDispatcher,
        NJSRandomNumberGenerator,
        NJSDatabaseBackend,
        config
      );
      return <CoreWalletPool>walletPoolInstance;
    };

    const getPoolInstance = (): CoreWalletPool => {
      if (!walletPoolInstance) {
        instanciateWalletPool();
      }

      invariant(walletPoolInstance, "can't initialize walletPoolInstance");
      return <CoreWalletPool>walletPoolInstance;
    };

    const mappings: Record<string, any> | CoreStatics = {};
    Object.keys(lib).forEach((k) => {
      if (k.startsWith("NJS")) {
        mappings[k.slice(3)] = lib[k];
      }
    });

    function wrapResult(id, value) {
      if (!value || !id) return value;

      if (Array.isArray(id)) {
        const [actualId] = id;
        return value.map((a) => wrapResult(actualId, a));
      }

      if (id in unwrappers) {
        return unwrappers[id](value);
      }

      const Clz = mappings[id];

      if (!Clz) {
        return value;
      }

      if (value instanceof Clz) return value;
      return new Clz(value);
    }

    function unwrapArg(id, value) {
      if (!value || !id) return value;

      if (Array.isArray(id)) {
        const [actualId] = id;
        return value.map((v) => unwrapArg(actualId, v));
      }

      if (id in wrappers) {
        return wrappers[id](value);
      }

      return value;
    }

    reflect((id, spec) => {
      const { methods, statics } = spec;
      let m;

      if (spec.njsUsesPlainObject) {
        // In that case we need to create a class and abstract out the methods
        m = function constructor(data) {
          Object.assign(this, data);
        };

        mappings[id] = m;
      } else {
        m = mappings[id];

        if (!m) {
          return;
        }
      }

      if (statics) {
        Object.keys(statics).forEach((method) => {
          const {
            njsInstanciateClass,
            njsBuggyMethodIsNotStatic,
            params,
            returns,
          } = statics[method];

          if (njsInstanciateClass) {
            m[method] = function met(...vargs) {
              if (process.env.VERBOSE) {
                log("libcore-call", id + "." + method, vargs);
              }

              const args = njsInstanciateClass.map((arg) => {
                if (typeof arg === "object") {
                  const o = {};

                  for (const k in arg) {
                    const index = arg[k];
                    o[k] = unwrapArg(params && params[index], vargs[index]);
                  }

                  return o;
                }

                return arg;
              });
              // @ts-expect-error ts must target es5 or higher
              const value = new m(...args);

              if (process.env.VERBOSE) {
                log("libcore-result", id + "." + method, {
                  value,
                });
              }

              return value;
            };
          } else if (njsBuggyMethodIsNotStatic) {
            // There is a bug in the node bindings that don't expose the static functions
            m[method] = (...args) => {
              if (process.env.VERBOSE) {
                log("libcore-call", id + "." + method, args);
              }

              let value;

              if (params) {
                // it's seems statics method until now doesn't need to be unwrap
                const hexArgs = unwrapArg(params, args);
                // @ts-expect-error ts must target es5 or higher
                value = new m(...hexArgs)[method](...hexArgs);
              } else {
                const constructorArgs =
                  typeof njsBuggyMethodIsNotStatic === "function"
                    ? njsBuggyMethodIsNotStatic(args)
                    : args;
                // @ts-expect-error ts must target es5 or higher
                value = new m(...constructorArgs)[method](...args);
              }

              if (process.env.VERBOSE) {
                log("libcore-result", id + "." + method, {
                  value,
                });
              }

              if (returns) {
                return wrapResult(returns, value);
              }

              return value;
            };
          }
        });
      }

      if (methods) {
        Object.keys(methods).forEach((method) => {
          const { njsField, params, returns, nodejsNotAvailable } =
            methods[method];
          if (nodejsNotAvailable) return;

          if (njsField) {
            m.prototype[method] = function met() {
              if (process.env.VERBOSE) {
                log("libcore-call", id + "#" + method);
              }

              const value = this[njsField];

              if (process.env.VERBOSE) {
                log("libcore-result", id + "#" + method, {
                  value,
                });
              }

              const Cls =
                typeof returns === "string" && returns in mappings
                  ? mappings[returns]
                  : null;

              if (Cls && !(value instanceof Cls)) {
                const inst = new Cls(value);
                return inst;
              }

              return wrapResult(returns, value);
            };
          } else {
            const f = m.prototype[method];

            if (!f) {
              console.warn(`no such method '${method}' in ${id}`);
              return;
            }

            m.prototype[method] = async function met(...a) {
              if (process.env.VERBOSE) {
                log("libcore-call", id + "#" + method, a);
              }

              const args = params
                ? a.map((value, i) => unwrapArg(params[i], value))
                : a;
              const value = await f.apply(this, args);

              if (process.env.VERBOSE) {
                log("libcore-result", id + "#" + method, {
                  value,
                });
              }

              return wrapResult(returns, value);
            };
          }
        });
      }
    });
    // other NodeJS bindings specific code
    const eventBusSubscribe = mappings.EventBus.prototype.subscribe;

    mappings.EventBus.prototype.subscribe = function subscribe(
      executionContext,
      receiver_
    ) {
      const receiver = receiver_;
      return new Promise((resolve, reject) => {
        receiver._resolve = resolve;
        receiver._reject = reject;
        eventBusSubscribe.call(this, executionContext, receiver);
      });
    };

    mappings.EventReceiver.newInstance = () => {
      const receiver = new mappings.EventReceiver({
        onEvent: (e) => {
          const code = e.getCode();

          if (
            code === lib.EVENT_CODE.UNDEFINED ||
            code === lib.EVENT_CODE.SYNCHRONIZATION_FAILED
          ) {
            const payload = e.getPayload();
            const message = (
              (payload && payload.getString("EV_SYNC_ERROR_MESSAGE")) ||
              "Sync failed"
            ).replace(" (EC_PRIV_KEY_INVALID_FORMAT)", "");

            try {
              receiver._reject(deserializeError(JSON.parse(message)));
            } catch (_e) {
              receiver._reject(message);
            }

            return;
          }

          if (
            code === lib.EVENT_CODE.SYNCHRONIZATION_SUCCEED ||
            code ===
              lib.EVENT_CODE.SYNCHRONIZATION_SUCCEED_ON_PREVIOUSLY_EMPTY_ACCOUNT
          ) {
            receiver._resolve();
          }
        },
      });
      return receiver;
    };

    const cs: CoreStatics = <CoreStatics>mappings;
    // @ts-expect-error i tried...
    const core: Core = {
      ...cs,
      flush: () => Promise.resolve(),
      getPoolInstance,
      getThreadDispatcher: () => NJSThreadDispatcher,
    };
    return Promise.resolve(core);
  };

  function parseError(error: string): Error {
    const m = error.match(/[^{]*({.*}).*/);

    if (m) {
      const json = JSON.parse(m[1]);

      if (json.name) {
        return deserializeError(json);
      }
    }

    return new Error(String(error));
  }

  const remapLibcoreErrors = (e: unknown): Error => {
    lazyLoad();

    if (typeof e === "string") {
      try {
        return parseError(e);
      } catch (e2: any) {
        return e2;
      }
    }

    if (e && typeof e === "object") {
      if (
        typeof (<{ code?: number }>e).code === "number" &&
        (<{ code: number }>e).code === lib.ERROR_CODE.NOT_ENOUGH_FUNDS
      ) {
        return new NotEnoughBalance();
      } else {
        // re-deserialize error if it was a serialized error
        if ((<{ message?: string }>e).message === "string") {
          try {
            return parseError((<{ message: string }>e).message);
          } catch (_e2) {
            console.error(_e2);
          }
        }
      }
    }

    if (e instanceof Error) {
      return e;
    }

    if (e && typeof (<{ message?: string }>e).message === "string") {
      return new Error((<{ message: string }>e).message);
    }

    return new Error(String(e));
  };

  setLoadCoreImplementation(loadCore);
  setRemapLibcoreErrorsImplementation(remapLibcoreErrors);
};
