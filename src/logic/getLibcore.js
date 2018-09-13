import { Platform, NativeModules } from "react-native";

let core;
let walletPoolInstance;
let threadDispatcher;

export default async () => {
  if (core) {
    return core;
  }

  if (Platform.OS === "android") {
    core = {
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

      // forwarding native functions
      coreAccount: NativeModules.CoreAccount,
      coreAccountCreationInfo: NativeModules.CoreAccountCreationInfo,
      coreAddress: NativeModules.CoreAddress,
      coreAmount: NativeModules.CoreAmount,
      coreBitcoinLikeOperation: NativeModules.CoreBitcoinLikeOperation,
      coreBitcoinLikeTransaction: NativeModules.CoreBitcoinLikeTransaction,
      coreBlock: NativeModules.CoreBlock,
      coreDatabaseBackend: NativeModules.CoreDatabaseBackend,
      coreDynamicObject: NativeModules.CoreDynamicObject,
      coreEventBus: NativeModules.CoreEventBus,
      coreEventReceiver: NativeModules.CoreEventReceiver,
      coreExtendedKeyAccountCreationInfo:
        NativeModules.CoreExtendedKeyAccountCreationInfo,
      coreHttpClient: NativeModules.CoreHttpClient,
      coreLogPrinter: NativeModules.CoreLogPrinter,
      coreOperation: NativeModules.CoreOperation,
      coreOperationQuery: NativeModules.CoreOperationQuery,
      corePathResolver: NativeModules.CorePathResolver,
      coreRandomNumberGenerator: NativeModules.CoreRandomNumberGenerator,
      coreThreadDispatcher: NativeModules.CoreThreadDispatcher,
      coreWallet: NativeModules.CoreWallet,
      coreWalletPool: NativeModules.CoreWalletPool,
      coreWebSocketClient: NativeModules.CoreWebSocketClient,
    };
  } else {
    // TODO: ios here
    throw new Error(`Unsupported platform: ${Platform.OS}`);
  }

  const httpClient = await core.coreHttpClient.newInstance();
  const webSocket = await core.coreWebSocketClient.newInstance();
  const pathResolver = await core.corePathResolver.newInstance();
  const logPrinter = await core.coreLogPrinter.newInstance();
  threadDispatcher = await core.coreThreadDispatcher.newInstance();
  const rng = await core.coreRandomNumberGenerator.newInstance();
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

  return core;
};
