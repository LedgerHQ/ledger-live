// @flow
import { getNativeModule } from "./specific";
import type { Core, CoreStatics } from "../types";

export async function loadCore(): Promise<Core> {
  // Abstract out the libcore interface into a higher level API.

  const mappings: Object = {};

  const wrappers = {
    // FIXME need to fix it in RN bindings
    hex: value => value.replace(/[< >]/g, ""),
  };

  function wrap(id, ref) {
    if (!ref) return ref;
    if (Array.isArray(id)) {
      const [actualId] = id;
      return ref.map(ref => wrap(actualId, ref));
    }
    if (id in wrappers) {
      return wrappers[id](ref);
    }
    const Clz = mappings[id];
    if (!Clz) {
      console.warn(`Unkown wrapping '${id}'`);
      return ref;
    }
    return new Clz(ref);
  }

  function unwrap(id, instance, ctx) {
    if (!instance) return instance;
    if (Array.isArray(id)) {
      const [actualId] = id;
      return instance.map(instance => unwrap(actualId, instance));
    }
    if (__DEV__) {
      const Clz = mappings[id];
      if (!Clz) {
        throw new Error(`Unknown class '${String(id)}' in ${String(ctx)}`);
      }
      if (!(instance instanceof Clz)) {
        throw new Error(`Expected '${String(id)}' instance in ${String(ctx)}`);
      }
    }
    return instance.ref;
  }

  type SpecMapF = {
    params?: Array<?string | string[]>,
    returns?: string | string[],
  };
  type Spec = {
    statics?: {
      [_: string]: SpecMapF,
    },
    methods?: {
      [_: string]: SpecMapF,
    },
  };

  function declare(id: string, { methods, statics }: Spec) {
    const native = getNativeModule(id);

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
          return res.then(r => wrapResult(r, returns));
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
      Object.keys(methods).forEach(method => {
        const { returns, params } = methods[method];
        const f = native && native[method];
        if (!f) {
          console.warn(
            `LibCore: module '${id}' method '${method}' is missing in native side`,
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
      // $FlowFixMe
      this.ref = ref;
    }

    constructor.name = id;
    constructor.prototype = proto;

    if (statics) {
      Object.keys(statics).forEach(method => {
        const { returns, params } = statics[method];
        const f = native && native[method];
        if (!f) {
          console.warn(
            `LibCore: module '${id}' static method '${method}' is missing in native side`,
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

  declare("WalletPool", {
    statics: {
      newInstance: {
        params: [
          null,
          null,
          "HttpClient",
          "WebSocketClient",
          "PathResolver",
          "LogPrinter",
          "ThreadDispatcher",
          "RandomNumberGenerator",
          "DatabaseBackend",
          "DynamicObject",
        ],
        returns: "WalletPool",
      },
    },
    methods: {
      getWallet: {
        returns: "Wallet",
      },
      getCurrency: {
        returns: "Currency",
      },
      createWallet: {
        params: [null, "Currency", "DynamicObject"],
        returns: "Wallet",
      },
    },
  });

  declare("Wallet", {
    methods: {
      getAccountCreationInfo: {
        returns: "AccountCreationInfo",
      },
      getNextAccountCreationInfo: {
        returns: "AccountCreationInfo",
      },
      newAccountWithInfo: {
        params: ["AccountCreationInfo"],
        returns: "Account",
      },
      getCurrency: {
        returns: "Currency",
      },
      getAccount: {
        returns: "Account",
      },
      getExtendedKeyAccountCreationInfo: {
        returns: "ExtendedKeyAccountCreationInfo",
      },
      newAccountWithExtendedKeyInfo: {
        params: ["ExtendedKeyAccountCreationInfo"],
        returns: "Account",
      },
    },
  });

  declare("Account", {
    methods: {
      getBalance: {
        returns: "Amount",
      },
      getLastBlock: {
        returns: "Block",
      },
      getFreshPublicAddresses: {
        returns: ["Address"],
      },
      getRestoreKey: {},
      asBitcoinLikeAccount: {
        returns: "BitcoinLikeAccount",
      },
      synchronize: {
        returns: "EventBus",
      },
      queryOperations: {
        returns: "OperationQuery",
      },
    },
  });

  declare("Operation", {
    methods: {
      getDate: {},
      asBitcoinLikeOperation: {
        returns: "BitcoinLikeOperation",
      },
      getOperationType: {},
      getAmount: { returns: "Amount" },
      getFees: { returns: "Amount" },
      getBlockHeight: {},
      getRecipients: {},
      getSenders: {},
    },
  });

  declare("Currency", {
    methods: {
      getBitcoinLikeNetworkParameters: {
        returns: "BitcoinLikeNetworkParameters",
      },
    },
  });

  declare("BigInt", {
    methods: {
      toString: {},
    },
  });

  declare("Amount", {
    statics: {
      fromHex: {
        params: ["Currency"],
        returns: "Amount",
      },
    },
    methods: {
      toBigInt: {
        returns: "BigInt",
      },
    },
  });

  declare("Block", {
    methods: {
      getHeight: {},
    },
  });

  declare("DerivationPath", {
    methods: {
      toString: {},
      isNull: {},
    },
  });

  declare("BitcoinLikeInput", {
    methods: {
      getPreviousTransaction: {
        returns: "hex",
      },
      getPreviousOutputIndex: {},
      getSequence: {},
      getDerivationPath: { returns: ["DerivationPath"] },
      getAddress: {},
    },
  });

  declare("BitcoinLikeOutput", {
    methods: {
      getDerivationPath: {
        returns: "DerivationPath",
      },
      getAddress: {},
    },
  });

  declare("BitcoinLikeTransaction", {
    methods: {
      getHash: {},
      getFees: {
        returns: "Amount",
      },
      getInputs: {
        returns: ["BitcoinLikeInput"],
      },
      getOutputs: {
        returns: ["BitcoinLikeOutput"],
      },
      serializeOutputs: {
        returns: "hex",
      },
      getTimestamp: {},
    },
  });

  declare("BitcoinLikeOperation", {
    methods: {
      getTransaction: {
        returns: "BitcoinLikeTransaction",
      },
    },
  });

  declare("Address", {
    statics: {
      isValid: {
        params: [null, "Currency"],
      },
    },
    methods: {
      toString: {},
      getDerivationPath: {},
    },
  });

  declare("BitcoinLikeTransactionBuilder", {
    methods: {
      sendToAddress: {
        params: ["Amount"],
      },
      pickInputs: {},
      setFeesPerByte: {
        params: ["Amount"],
      },
      build: { returns: "BitcoinLikeTransaction" },
    },
  });

  declare("BitcoinLikeAccount", {
    methods: {
      buildTransaction: {
        returns: "BitcoinLikeTransactionBuilder",
      },
      broadcastRawTransaction: {},
    },
  });

  declare("OperationQuery", {
    methods: {
      complete: { returns: "OperationQuery" },
      addOrder: { returns: "OperationQuery" },
      execute: { returns: ["Operation"] },
    },
  });

  declare("AccountCreationInfo", {
    statics: {
      init: {
        returns: "AccountCreationInfo",
      },
    },
    methods: {
      getDerivations: {},
      getChainCodes: {},
      getPublicKeys: {},
      getOwners: {},
      getIndex: {},
    },
  });

  declare("BitcoinLikeNetworkParameters", {
    methods: {
      getSigHash: {
        returns: "hex",
      },
      getUsesTimestampedTransaction: {},
    },
  });

  declare("ExtendedKeyAccountCreationInfo", {
    statics: {
      init: {
        returns: "ExtendedKeyAccountCreationInfo",
      },
    },
    methods: {
      getIndex: {
        returns: "ExtendedKeyAccountCreationInfo",
      },
      getExtendedKeys: {},
      getOwners: {},
      getDerivations: {},
    },
  });

  declare("DynamicObject", {
    statics: {
      flush: {},
      newInstance: {
        returns: "DynamicObject",
      },
    },
    methods: {
      putString: {},
    },
  });

  declare("SerialContext", {});

  declare("ThreadDispatcher", {
    statics: {
      newInstance: {
        returns: "ThreadDispatcher",
      },
    },
    methods: {
      getMainExecutionContext: {
        returns: "SerialContext",
      },
    },
  });

  declare("EventBus", {
    methods: {
      subscribe: {
        params: ["SerialContext", "EventReceiver"],
      },
    },
  });

  declare("EventReceiver", {
    statics: {
      newInstance: {
        returns: "EventReceiver",
      },
    },
  });

  declare("HttpClient", {
    statics: {
      newInstance: {
        returns: "HttpClient",
      },
      flush: {},
    },
  });

  declare("WebSocketClient", {
    statics: {
      newInstance: {
        returns: "WebSocketClient",
      },
      flush: {},
    },
  });

  declare("PathResolver", {
    statics: {
      newInstance: {
        returns: "PathResolver",
      },
      flush: {},
    },
  });

  declare("LogPrinter", {
    statics: {
      newInstance: {
        returns: "LogPrinter",
      },
      flush: {},
    },
  });

  declare("RandomNumberGenerator", {
    statics: {
      newInstance: {
        returns: "RandomNumberGenerator",
      },
      flush: {},
    },
  });

  declare("DatabaseBackend", {
    statics: {
      flush: {},
      getSqlite3Backend: {
        returns: "DatabaseBackend",
      },
    },
  });

  const cs: CoreStatics = mappings;

  const threadDispatcher = await cs.ThreadDispatcher.newInstance();
  const httpClient = await cs.HttpClient.newInstance();
  const webSocket = await cs.WebSocketClient.newInstance();
  const pathResolver = await cs.PathResolver.newInstance();
  const logPrinter = await cs.LogPrinter.newInstance();
  const rng = await cs.RandomNumberGenerator.newInstance();
  const backend = await cs.DatabaseBackend.getSqlite3Backend();
  const walletDynObject = await cs.DynamicObject.newInstance();
  const walletPoolInstance = await cs.WalletPool.newInstance(
    "ledger_live_mobile",
    "",
    httpClient,
    webSocket,
    pathResolver,
    logPrinter,
    threadDispatcher,
    rng,
    backend,
    walletDynObject,
  );

  const core: Core = {
    ...cs,

    flush: () =>
      Promise.all([
        cs.HttpClient.flush(),
        cs.WebSocketClient.flush(),
        cs.PathResolver.flush(),
        cs.LogPrinter.flush(),
        cs.RandomNumberGenerator.flush(),
        cs.DynamicObject.flush(),
        cs.DatabaseBackend.flush(),
      ]).then(() => undefined),

    getPoolInstance: () => walletPoolInstance,

    getThreadDispatcher: () => threadDispatcher,
  };

  return core;
}
