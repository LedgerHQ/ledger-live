// @flow
import { createInstance, getNativeModule } from "./specific";

let core;
let corePromise;

let walletPoolInstance;
let threadDispatcher;

let libcoreJobsCounter = 0;

const GC_DELAY = 1000;

let lastFlush = Promise.resolve();
let flushTimeout = null;

function flush(core) {
  lastFlush = Promise.all([
    core.coreHttpClient.flush(),
    core.coreWebSocketClient.flush(),
    core.corePathResolver.flush(),
    core.coreLogPrinter.flush(),
    core.coreRandomNumberGenerator.flush(),
    core.coreDynamicObject.flush(),
    core.coreDatabaseBackend.flush(),
  ]).catch(e => console.error("libcore-flush-fail", e));
}

export async function withLibcore<R>(job: (core: *) => Promise<R>): Promise<R> {
  libcoreJobsCounter++;
  let core;
  try {
    if (flushTimeout) {
      // there is a new job so we must not do the GC yet.
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    core = await load();
    await lastFlush; // wait previous flush before starting anything
    const res = await job(core);
    return res;
  } finally {
    libcoreJobsCounter--;
    if (core && libcoreJobsCounter === 0) {
      flushTimeout = setTimeout(flush.bind(null, core), GC_DELAY);
    }
  }
}

type Fn<A, R> = (...args: A) => Promise<R>;

export const withLibcoreF = <A: Array<any>, R>(
  job: (core: *) => Fn<A, R>,
): Fn<A, R> => (...args) => withLibcore(core => job(core)(...args));

async function load() {
  if (core) {
    return core;
  }
  if (!corePromise) {
    corePromise = loadCore();
  }
  core = await corePromise;
  return core;
}

async function loadCore() {
  const core: any = {
    getPoolInstance: () => walletPoolInstance,
    getThreadDispatcher: () => threadDispatcher,
  };

  const modules = [
    "Account",
    "AccountCreationInfo",
    "Address",
    "Amount",
    "BigInt",
    "BitcoinLikeAccount",
    "BitcoinLikeOperation",
    "BitcoinLikeOutput",
    "BitcoinLikeInput",
    "BitcoinLikeNetworkParameters",
    "BitcoinLikeTransaction",
    "BitcoinLikeTransactionBuilder",
    "Block",
    "Currency",
    "DatabaseBackend",
    "DerivationPath",
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

  modules.forEach(m => {
    core[`core${m}`] = getNativeModule(m);
  });

  const httpClient = await createInstance(core.coreHttpClient);
  const webSocket = await createInstance(core.coreWebSocketClient);
  const pathResolver = await createInstance(core.corePathResolver);
  const logPrinter = await createInstance(core.coreLogPrinter);
  threadDispatcher = await createInstance(core.coreThreadDispatcher);
  const rng = await createInstance(core.coreRandomNumberGenerator);
  const backend = await core.coreDatabaseBackend.getSqlite3Backend();

  const dynamicObject = await core.coreDynamicObject.newInstance();
  walletPoolInstance = await core.coreWalletPool.newInstance(
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

  if (__DEV__) {
    console.log({ core }); // eslint-disable-line
  }

  return core;
}
