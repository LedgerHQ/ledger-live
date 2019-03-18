// @flow

declare class CoreWalletPool {
  static newInstance(
    name: string,
    pwd: string,
    httpClient: CoreHttpClient,
    webSocket: CoreWebSocketClient,
    pathResolver: CorePathResolver,
    logPrinter: CoreLogPrinter,
    threadDispatcher: CoreThreadDispatcher,
    rng: CoreRandomNumberGenerator,
    backend: CoreDatabaseBackend,
    walletDynObject: CoreDynamicObject,
  ): Promise<CoreWalletPool>;
  getWallet(name: string): Promise<CoreWallet>;
  getCurrency(id: string): Promise<CoreCurrency>;
  createWallet(
    walletName: string,
    currency: CoreCurrency,
    config: CoreDynamicObject,
  ): Promise<CoreWallet>;
}

declare class CoreWallet {
  getAccountCreationInfo(
    accountIndex: number,
  ): Promise<CoreAccountCreationInfo>;
  getNextAccountCreationInfo(): Promise<CoreAccountCreationInfo>;
  newAccountWithInfo(info: CoreAccountCreationInfo): Promise<CoreAccount>;
  getCurrency(): Promise<CoreCurrency>;
  getAccount(index: number): Promise<CoreAccount>;
  getExtendedKeyAccountCreationInfo(
    index: number,
  ): Promise<CoreExtendedKeyAccountCreationInfo>;
  newAccountWithExtendedKeyInfo(
    keys: CoreExtendedKeyAccountCreationInfo,
  ): Promise<CoreAccount>;
}

declare class CoreAccount {
  getBalance(): Promise<CoreAmount>;
  getLastBlock(): Promise<CoreBlock>;
  getFreshPublicAddresses(): Promise<CoreAddress[]>;
  getRestoreKey(): Promise<string>;
  asBitcoinLikeAccount(): Promise<CoreBitcoinLikeAccount>;
  synchronize(): Promise<CoreEventBus>;
  queryOperations(): Promise<CoreOperationQuery>;
}

declare class CoreOperation {
  getDate(): Promise<string>;
  asBitcoinLikeOperation(): Promise<CoreBitcoinLikeOperation>;
  getOperationType(): Promise<OperationType>;
  getAmount(): Promise<CoreAmount>;
  getFees(): Promise<?CoreAmount>;
  getBlockHeight(): Promise<?number>;
  getRecipients(): Promise<string[]>;
  getSenders(): Promise<string[]>;
}

declare class CoreCurrency {
  // prettier-ignore
  getBitcoinLikeNetworkParameters (): Promise<CoreBitcoinLikeNetworkParameters>
}

declare class CoreDatabaseBackend {
  static getSqlite3Backend(): Promise<CoreDatabaseBackend>;
  static flush(): Promise<void>;
}

declare class CoreHttpClient {
  static newInstance(): Promise<CoreHttpClient>;
  static flush(): Promise<void>;
}

declare class CoreWebSocketClient {
  static newInstance(): Promise<CoreWebSocketClient>;
  static flush(): Promise<void>;
}

declare class CorePathResolver {
  static newInstance(): Promise<CorePathResolver>;
  static flush(): Promise<void>;
}

declare class CoreLogPrinter {
  static newInstance(): Promise<CoreLogPrinter>;
  static flush(): Promise<void>;
}

declare class CoreRandomNumberGenerator {
  static newInstance(): Promise<CoreRandomNumberGenerator>;
  static flush(): Promise<void>;
}

declare class CoreBigInt {
  toString(base: number): Promise<string>;
}

declare class CoreAmount {
  static fromHex(CoreCurrency, string): Promise<CoreAmount>;

  toBigInt(): Promise<CoreBigInt>;
}

declare class CoreBlock {
  getHeight(): Promise<number>;
}

declare class CoreDerivationPath {
  toString(): Promise<string>;
  isNull(): Promise<boolean>;
}

declare class CoreBitcoinLikeInput {
  getPreviousTransaction(): Promise<string>;
  getPreviousOutputIndex(): Promise<number>;
  getSequence(): Promise<number>;
  getDerivationPath(): Promise<CoreDerivationPath[]>;
  getAddress(): Promise<?string>;
}

declare class CoreBitcoinLikeOutput {
  getDerivationPath(): Promise<?CoreDerivationPath>;
  getAddress(): Promise<?string>;
}

declare class CoreBitcoinLikeTransaction {
  getHash(): Promise<string>;
  getFees(): Promise<?CoreAmount>;
  getInputs(): Promise<CoreBitcoinLikeInput[]>;
  getOutputs(): Promise<CoreBitcoinLikeOutput[]>;
  serializeOutputs(): Promise<string>;
  getTimestamp(): Promise<?number>;
}

declare class CoreBitcoinLikeOperation {
  getTransaction(): Promise<CoreBitcoinLikeTransaction>;
}

export type OperationType = 0 | 1;

declare class CoreAddress {
  static isValid(recipient: string, currency: CoreCurrency): Promise<boolean>;
  toString(): Promise<string>;
  getDerivationPath(): Promise<?string>;
}

declare class CoreBitcoinLikeTransactionBuilder {
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  pickInputs(number, number): Promise<void>;
  setFeesPerByte(feesPerByte: CoreAmount): Promise<void>;
  build(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreBitcoinLikeAccount {
  buildTransaction(
    isPartial: boolean,
  ): Promise<CoreBitcoinLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
}

declare class CoreOperationQuery {
  complete(): Promise<CoreOperationQuery>;
  addOrder(number, boolean): Promise<CoreOperationQuery>;
  execute(): Promise<CoreOperation[]>;
}

declare class CoreAccountCreationInfo {
  static init(
    index: number,
    owners: string[],
    derivations: string[],
    publicKeys: string[],
    chainCodes: string[],
  ): Promise<CoreAccountCreationInfo>;
  getDerivations(): Promise<string[]>;
  getChainCodes(): Promise<string[]>;
  getPublicKeys(): Promise<string[]>;
  getOwners(): Promise<string[]>;
  getIndex(): Promise<number>;
}

declare class CoreBitcoinLikeNetworkParameters {
  getSigHash(): Promise<string>;
  getUsesTimestampedTransaction(): Promise<boolean>;
}

declare class CoreExtendedKeyAccountCreationInfo {
  static init(
    index: number,
    owners: string[],
    derivations: string[],
    extendedKeys: string[],
  ): Promise<CoreExtendedKeyAccountCreationInfo>;
  getIndex(): Promise<number>;
  getExtendedKeys(): Promise<string[]>;
  getOwners(): Promise<string[]>;
  getDerivations(): Promise<string[]>;
}

declare class CoreDynamicObject {
  static newInstance(): Promise<CoreDynamicObject>;
  static flush(): Promise<void>;
  putString(string, string): Promise<void>;
}

declare class CoreSerialContext {}

declare class CoreThreadDispatcher {
  static newInstance(): Promise<CoreThreadDispatcher>;
  getMainExecutionContext(): Promise<CoreSerialContext>;
}

declare class CoreEventBus {
  subscribe(
    serialContext: CoreSerialContext,
    eventReceiver: CoreEventReceiver,
  ): Promise<void>;
}

declare class CoreEventReceiver {
  static newInstance(): Promise<CoreEventReceiver>;
}

export interface Core extends CoreStatics {
  flush: () => Promise<void>;
  getPoolInstance: () => CoreWalletPool;
  getThreadDispatcher: () => CoreThreadDispatcher;
}

export interface CoreStatics {
  Account: Class<CoreAccount>;
  AccountCreationInfo: Class<CoreAccountCreationInfo>;
  Address: Class<CoreAddress>;
  Amount: Class<CoreAmount>;
  BigInt: Class<CoreBigInt>;
  BitcoinLikeAccount: Class<CoreBitcoinLikeAccount>;
  BitcoinLikeInput: Class<CoreBitcoinLikeInput>;
  BitcoinLikeNetworkParameters: Class<CoreBitcoinLikeNetworkParameters>;
  BitcoinLikeOperation: Class<CoreBitcoinLikeOperation>;
  BitcoinLikeOutput: Class<CoreBitcoinLikeOutput>;
  BitcoinLikeTransaction: Class<CoreBitcoinLikeTransaction>;
  BitcoinLikeTransactionBuilder: Class<CoreBitcoinLikeTransactionBuilder>;
  Block: Class<CoreBlock>;
  Currency: Class<CoreCurrency>;
  DatabaseBackend: Class<CoreDatabaseBackend>;
  DerivationPath: Class<CoreDerivationPath>;
  DynamicObject: Class<CoreDynamicObject>;
  EventBus: Class<CoreEventBus>;
  EventReceiver: Class<CoreEventReceiver>;
  ExtendedKeyAccountCreationInfo: Class<CoreExtendedKeyAccountCreationInfo>;
  HttpClient: Class<CoreHttpClient>;
  LogPrinter: Class<CoreLogPrinter>;
  Operation: Class<CoreOperation>;
  OperationQuery: Class<CoreOperationQuery>;
  PathResolver: Class<CorePathResolver>;
  RandomNumberGenerator: Class<CoreRandomNumberGenerator>;
  SerialContext: Class<CoreSerialContext>;
  ThreadDispatcher: Class<CoreThreadDispatcher>;
  Wallet: Class<CoreWallet>;
  WalletPool: Class<CoreWalletPool>;
  WebSocketClient: Class<CoreWebSocketClient>;
}

export type {
  CoreAccount,
  CoreAccountCreationInfo,
  CoreAddress,
  CoreAmount,
  CoreBigInt,
  CoreBitcoinLikeAccount,
  CoreBitcoinLikeInput,
  CoreBitcoinLikeNetworkParameters,
  CoreBitcoinLikeOperation,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeTransactionBuilder,
  CoreBlock,
  CoreCurrency,
  CoreDatabaseBackend,
  CoreDerivationPath,
  CoreDynamicObject,
  CoreEventBus,
  CoreEventReceiver,
  CoreExtendedKeyAccountCreationInfo,
  CoreHttpClient,
  CoreLogPrinter,
  CoreOperation,
  CoreOperationQuery,
  CorePathResolver,
  CoreRandomNumberGenerator,
  CoreSerialContext,
  CoreThreadDispatcher,
  CoreWallet,
  CoreWalletPool,
  CoreWebSocketClient,
};
