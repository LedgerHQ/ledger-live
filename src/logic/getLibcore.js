import { Platform, NativeModules } from "react-native";

let core;
let corePromise;

let walletPoolInstance;
let threadDispatcher;

console.log(NativeModules);

export default async () => {
  if (core) {
    return core;
  }
  if (!corePromise) {
    corePromise = loadCore();
  }
  core = await corePromise;
  return core;
};

async function loadCore() {
  let core = {
    getPoolInstance: () => walletPoolInstance,
    getThreadDispatcher: () => threadDispatcher,
    flush: async () => {
      await core.coreHttpClient.flush();
      await core.coreWebSocketClient.flush();
      await core.corePathResolver.flush();
      await core.coreLogPrinter.flush();
      await core.coreRandomNumberGenerator.flush();
      await core.coreDynamicObject.flush();
      await core.coreDatabaseBackend.flush();
    },
  };

  const modules = [
    "Account",
    "AccountCreationInfo",
    "Address",
    "Amount",
    "BitcoinLikeOperation",
    "BitcoinLikeTransaction",
    "Block",
    "DatabaseBackend",
    "DynamicObject",
    "EventBus",
    "EventReceiver",
    "ExtendedKeyAccountCreationInfo",
    "HttpClient",
    "LogPrinter",
    "Operation",
    "OperationQuery",
    "PathResolver",
    "RandomNumberGenerator",
    "ThreadDispatcher",
    "Wallet",
    "WalletPool",
    "WebSocketClient",
  ];

  const createInstance = (factory, ...params) => {
    let newInstance = factory.newInstance;
    if (!newInstance) {
      // cc khalil!
      console.log("no newInstance method for", factory); // eslint-disable-line no-console
      newInstance = factory.new;
    }
    return newInstance.call(factory, ...params);
  };

  if (Platform.OS === "ios") {
    modules.forEach(m => {
      core[`core${m}`] = NativeModules[`CoreLG${m}`];
    });
  } else {
    modules.forEach(m => {
      core[`core${m}`] = NativeModules[`Core${m}`];
    });
  }

  const httpClient = await createInstance(core.coreHttpClient);
  const webSocket = await createInstance(core.coreWebSocketClient);
  const pathResolver = await createInstance(core.corePathResolver);
  const logPrinter = await createInstance(core.coreLogPrinter);
  threadDispatcher = await createInstance(core.coreThreadDispatcher);
  const rng = await createInstance(core.coreRandomNumberGenerator);
  const backend = await core.coreDatabaseBackend.getSqlite3Backend();
  const dynamicObject = await createInstance(core.coreDynamicObject);

  walletPoolInstance = await createInstance(
    core.coreWalletPool,
    "ledger_live_desktop",
    "",
    httpClient,
    webSocket,
    pathResolver,
    logPrinter,
    threadDispatcher,
    rng,
    backend,
    dynamicObject,
  );

  return core;
}
