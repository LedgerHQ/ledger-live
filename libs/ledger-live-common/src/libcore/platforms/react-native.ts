import { NotEnoughBalance, NetworkDown } from "@ledgerhq/errors";
import type { Core, CoreStatics, Spec } from "../types";
import { reflect } from "../types";
import { setLoadCoreImplementation } from "../access";
import { setRemapLibcoreErrorsImplementation } from "../errors";

export default (arg: { getNativeModule: (id: string) => any }): void => {
  const { getNativeModule } = arg;

  async function loadCore(): Promise<Core> {
    // Abstract out the libcore interface into a higher level API.
    const mappings: CoreStatics | Record<string, any> = {};
    const wrappers = {
      // FIXME need to fix it in RN bindings
      hex: (value) => value.replace(/[< >]/g, ""),
    };

    function wrap(id, ref) {
      if (!ref) return ref;

      if (Array.isArray(id)) {
        const [actualId] = id;
        return ref.map((r) => wrap(actualId, r));
      }

      if (id in wrappers) {
        return wrappers[id](ref);
      }

      const Clz = mappings[id];

      if (!Clz) {
        console.warn(`Unknown wrapping '${id}'`);
        return ref;
      }

      return new Clz(ref);
    }

    function unwrap(id, instance, ctx) {
      if (!instance) return instance;

      if (Array.isArray(id)) {
        const [actualId] = id;
        return instance.map((inst) => unwrap(actualId, inst, undefined));
      }

      const Clz = mappings[id];

      if (!Clz) {
        return instance;
      }

      if (!(instance instanceof Clz)) {
        throw new Error(`Expected '${String(id)}' instance in ${String(ctx)}`);
      }

      return instance.ref;
    }

    const flushes: any[] = [];
    const blacklistFlushes = [
      "ThreadDispatcher",
      "HttpClient",
      "WebSocketClient",
      "PathResolver",
      "LogPrinter",
      "RandomNumberGenerator",
      "DatabaseBackend",
      "DynamicObject",
      "WalletPool",
      "SerialContext",
      "",
    ];

    function declare(id: string, { methods, statics }: Spec) {
      const native = getNativeModule(id);

      if (!blacklistFlushes.includes(id)) {
        flushes.push(() => {
          try {
            return native.flush();
          } catch (e) {
            console.warn("no flush for " + id);
          }
        });
      }

      // There are lot of decoration done to abstract out libcore api.
      // The plan is to make it converge to this API in the future
      // so we have less runtime wrapping.
      const unwrapArgs = (args, params, ctx) =>
        params
          ? [...args].map((value, i) => {
              const spec = params[i];
              return spec ? unwrap(spec, value, ctx) : value;
            })
          : args;

      const wrapResult = (r, returns) => {
        let res = r;

        if (res && typeof res === "object") {
          if (res.then) {
            return res.then((re) => wrapResult(re, returns));
          }

          if ("value" in res) {
            res = res.value;
          }
        }

        if (!returns) return res;
        return wrap(returns, res);
      };

      const proto = {};

      if (methods) {
        Object.keys(methods).forEach((method) => {
          const { returns, params } = methods[method];
          const f = native && native[method];

          if (!f) {
            console.warn(
              `LibCore: module '${id}' method '${method}' is missing in native side`
            );
          }

          const ctx = `${id}#${method}`;

          proto[method] = function fn(...args) {
            const unwrapped = unwrapArgs(args, params, ctx);
            const r = f.call(native, unwrap(id, this, ctx), ...unwrapped);
            return wrapResult(r, returns);
          };
        });
      }

      function constructor(ref) {
        this.ref = ref;
      }

      constructor.prototype = proto;

      if (statics) {
        Object.keys(statics).forEach((method) => {
          const { returns, params } = statics[method];
          const f = native && native[method];

          if (!f) {
            console.warn(
              `LibCore: module '${id}' static method '${method}' is missing in native side`
            );
          }

          const ctx = `${id}.${method}`;

          constructor[method] = (...args) => {
            const unwrapped = unwrapArgs(args, params, ctx);
            const r = f.call(native, ...unwrapped);
            return wrapResult(r, returns);
          };
        });
      }

      if (id in mappings) {
        console.warn("LibCore: Already declared " + id);
      }

      mappings[id] = constructor;
    }

    reflect(declare);
    const cs: CoreStatics = <CoreStatics>mappings;
    const threadDispatcher = await cs.ThreadDispatcher.newInstance();
    const httpClient = await cs.HttpClient.newInstance();
    const webSocket = await cs.WebSocketClient.newInstance();
    const pathResolver = await cs.PathResolver.newInstance();
    const logPrinter = await cs.LogPrinter.newInstance();
    const rng = await cs.RandomNumberGenerator.newInstance();
    const backend = await cs.DatabaseBackend.getSqlite3Backend();
    const walletDynObject = await cs.DynamicObject.newInstance();
    const walletPoolInstance = await cs.WalletPool.newInstance(
      "ledgerlive",
      "",
      httpClient,
      webSocket,
      pathResolver,
      logPrinter,
      threadDispatcher,
      rng,
      backend,
      walletDynObject
    );
    const core = {
      ...cs,
      flush: () => Promise.all(flushes.map((f) => f())).then(() => undefined),
      getPoolInstance: () => walletPoolInstance,
      getThreadDispatcher: () => threadDispatcher,
    } as Core;
    return core;
  }

  function remapLibcoreErrors(error: unknown): Error {
    if (!(error && error instanceof Error)) {
      return new Error(String(error));
    }

    if (!error || !error.message) return error;
    const msg = error.message;

    if (
      msg.includes("Cannot gather enough funds") ||
      msg.includes("There is no UTXO on this account.")
    ) {
      return new NotEnoughBalance();
    }

    if (
      msg.includes("The Internet connection appears to be offline") ||
      msg.includes(
        '"explorers.api.live.ledger.com": No address associated with hostname'
      )
    ) {
      return new NetworkDown();
    }

    // Attempt to recover the human readable error from a verbose iOS trace
    const pattern = /NS[\w]+Error.+Code.+"([\w .]+)"/;
    const match = pattern.exec(msg);

    if (match && match[1] !== "(null)") {
      return new Error(match[1]);
    }

    return error;
  }

  setLoadCoreImplementation(loadCore);
  setRemapLibcoreErrorsImplementation(remapLibcoreErrors);
};
