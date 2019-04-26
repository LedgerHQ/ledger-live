// @flow

// NB this is a tradeoff that for now, we maintain ourself the types interface AND the JS declaration of them.
// this allow to do wrapping on top of the different libcore interfaces

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
    walletDynObject: CoreDynamicObject
  ): Promise<CoreWalletPool>;
  getWallet(name: string): Promise<CoreWallet>;
  getCurrency(id: string): Promise<CoreCurrency>;
  createWallet(
    walletName: string,
    currency: CoreCurrency,
    config: CoreDynamicObject
  ): Promise<CoreWallet>;
  freshResetAll(): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
}

declare class CoreWallet {
  getAccountCreationInfo(
    accountIndex: number
  ): Promise<CoreAccountCreationInfo>;
  getNextAccountCreationInfo(): Promise<CoreAccountCreationInfo>;
  newAccountWithInfo(info: CoreAccountCreationInfo): Promise<CoreAccount>;
  getCurrency(): Promise<CoreCurrency>;
  getAccount(index: number): Promise<CoreAccount>;
  getExtendedKeyAccountCreationInfo(
    index: number
  ): Promise<CoreExtendedKeyAccountCreationInfo>;
  newAccountWithExtendedKeyInfo(
    keys?: CoreExtendedKeyAccountCreationInfo
  ): Promise<CoreAccount>;
}

// TODO

declare class CoreAccount {
  getBalance(): Promise<CoreAmount>;
  getLastBlock(): Promise<CoreBlock>;
  getFreshPublicAddresses(): Promise<CoreAddress[]>;
  getRestoreKey(): Promise<string>;
  asEthereumLikeAccount(): Promise<CoreEthereumLikeAccount>;
  asBitcoinLikeAccount(): Promise<CoreBitcoinLikeAccount>;
  synchronize(): Promise<CoreEventBus>;
  queryOperations(): Promise<CoreOperationQuery>;
}

declare class CoreOperation {
  getDate(): Promise<string>;
  asBitcoinLikeOperation(): Promise<CoreBitcoinLikeOperation>;
  asEthereumLikeOperation(): Promise<CoreEthereumLikeOperation>;
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

declare class CoreLedgerCore {
  static getStringVersion(): Promise<string>;
  static getIntVersion(): Promise<number>;
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

declare class CoreEthereumLikeAddress {
  toEIP55(): Promise<string>;
}

declare class CoreEthereumLikeTransaction {
  getHash(): Promise<string>;
  getGasPrice(): Promise<CoreAmount>;
  getGasLimit(): Promise<CoreAmount>;
  getGasUsed(): Promise<CoreAmount>;
  getReceiver(): Promise<CoreEthereumLikeAddress>;
  getSender(): Promise<CoreEthereumLikeAddress>;
  serialize(): Promise<string>;
  setSignature(string, string, string): Promise<void>;
  getStatus(): Promise<number>;
}

declare class CoreBitcoinLikeOperation {
  getTransaction(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreEthereumLikeOperation {
  getTransaction(): Promise<CoreEthereumLikeTransaction>;
}

export type OperationType = 0 | 1;

declare class CoreAddress {
  static isValid(recipient: string, currency: CoreCurrency): Promise<boolean>;
  toString(): Promise<string>;
  getDerivationPath(): Promise<?string>;
}

declare class CoreBitcoinLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  pickInputs(number, number): Promise<void>;
  setFeesPerByte(feesPerByte: CoreAmount): Promise<void>;
  build(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreEthereumLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  setGasPrice(gasPrice: CoreAmount): Promise<void>;
  setGasLimit(gasLimit: CoreAmount): Promise<void>;
  setInputData(data: string): Promise<void>;
  build(): Promise<CoreEthereumLikeTransaction>;
}

declare class CoreBitcoinLikeAccount {
  buildTransaction(
    isPartial: boolean
  ): Promise<CoreBitcoinLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
}

declare class CoreEthereumLikeAccount {
  getERC20Accounts(): Promise<CoreERC20LikeAccount[]>;
  buildTransaction(): Promise<CoreEthereumLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
}

declare class CoreERC20Token {
  getContractAddress(): Promise<string>;
}

declare class CoreERC20LikeAccount {
  getBalance(): Promise<CoreBigInt>;
  getAddress(): Promise<string>;
  getToken(): Promise<CoreERC20Token>;
  getOperations(): Promise<CoreERC20LikeOperation[]>;
}

declare class CoreERC20LikeOperation {
  getHash(): Promise<string>;
  getGasPrice(): Promise<CoreBigInt>;
  getGasLimit(): Promise<CoreBigInt>;
  getUsedGas(): Promise<CoreBigInt>;
  getSender(): Promise<string>;
  getReceiver(): Promise<string>;
  getValue(): Promise<CoreBigInt>;
  getTime(): Promise<string>;
  getOperationType(): Promise<OperationType>;
  getStatus(): Promise<number>;
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
    chainCodes: string[]
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
    extendedKeys: string[]
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
    eventReceiver: CoreEventReceiver
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
  EthereumLikeOperation: Class<CoreEthereumLikeOperation>;
  BitcoinLikeOutput: Class<CoreBitcoinLikeOutput>;
  BitcoinLikeTransaction: Class<CoreBitcoinLikeTransaction>;
  EthereumLikeAddress: Class<CoreEthereumLikeAddress>;
  EthereumLikeTransaction: Class<CoreBitcoinLikeTransaction>;
  BitcoinLikeTransactionBuilder: Class<CoreBitcoinLikeTransactionBuilder>;
  EthereumLikeAccount: Class<CoreEthereumLikeAccount>;
  EthereumLikeTransactionBuilder: Class<CoreEthereumLikeTransactionBuilder>;
  EthereumLikeTransaction: Class<CoreEthereumLikeTransaction>;
  ERC20LikeAccount: Class<CoreERC20LikeAccount>;
  ERC20LikeOperation: Class<CoreERC20LikeOperation>;
  ERC20Token: Class<CoreERC20Token>;
  Block: Class<CoreBlock>;
  Currency: Class<CoreCurrency>;
  DatabaseBackend: Class<CoreDatabaseBackend>;
  DerivationPath: Class<CoreDerivationPath>;
  DynamicObject: Class<CoreDynamicObject>;
  EventBus: Class<CoreEventBus>;
  EventReceiver: Class<CoreEventReceiver>;
  ExtendedKeyAccountCreationInfo: Class<CoreExtendedKeyAccountCreationInfo>;
  HttpClient: Class<CoreHttpClient>;
  LedgerCore: Class<CoreLedgerCore>;
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
  CoreEthereumLikeOperation,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeTransactionBuilder,
  CoreEthereumLikeAccount,
  CoreEthereumLikeTransaction,
  CoreEthereumLikeTransactionBuilder,
  CoreERC20LikeAccount,
  CoreERC20LikeOperation,
  CoreERC20Token,
  CoreBlock,
  CoreCurrency,
  CoreDatabaseBackend,
  CoreDerivationPath,
  CoreDynamicObject,
  CoreEventBus,
  CoreEventReceiver,
  CoreExtendedKeyAccountCreationInfo,
  CoreHttpClient,
  CoreLedgerCore,
  CoreLogPrinter,
  CoreOperation,
  CoreOperationQuery,
  CorePathResolver,
  CoreRandomNumberGenerator,
  CoreSerialContext,
  CoreThreadDispatcher,
  CoreWallet,
  CoreWalletPool,
  CoreWebSocketClient
};

type SpecMapF = {
  params?: Array<?string | string[]>,
  returns?: string | string[],
  njsField?: string,
  njsInstanciateClass?: Array<Object>,
  njsBuggyMethodIsNotStatic?: boolean
};

type Spec = {
  njsUsesPlainObject?: boolean,
  statics?: {
    [_: string]: SpecMapF
  },
  methods?: {
    [_: string]: SpecMapF
  }
};

// To make the above contract possible with current libcore bindings,
// we need to define the code below and build-up abstraction wrappings on top of the lower level bindings.
// We do this at runtime but ideally in the future, it will be at build time (generated code).

export const reflect = (declare: (string, Spec) => void) => {
  declare("WalletPool", {
    statics: {
      freshResetAll: {},
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
          "DynamicObject"
        ],
        returns: "WalletPool"
      }
    },
    methods: {
      getWallet: {
        returns: "Wallet"
      },
      getCurrency: {
        returns: "Currency"
      },
      createWallet: {
        params: [null, "Currency", "DynamicObject"],
        returns: "Wallet"
      }
    }
  });

  declare("Wallet", {
    methods: {
      getAccountCreationInfo: {
        returns: "AccountCreationInfo"
      },
      getNextAccountCreationInfo: {
        returns: "AccountCreationInfo"
      },
      newAccountWithInfo: {
        params: ["AccountCreationInfo"],
        returns: "Account"
      },
      getCurrency: {
        returns: "Currency"
      },
      getAccount: {
        returns: "Account"
      },
      getExtendedKeyAccountCreationInfo: {
        returns: "ExtendedKeyAccountCreationInfo"
      },
      newAccountWithExtendedKeyInfo: {
        params: ["ExtendedKeyAccountCreationInfo"],
        returns: "Account"
      }
    }
  });

  declare("Account", {
    methods: {
      getBalance: {
        returns: "Amount"
      },
      getLastBlock: {
        returns: "Block"
      },
      getFreshPublicAddresses: {
        returns: ["Address"]
      },
      getRestoreKey: {},
      asBitcoinLikeAccount: {
        returns: "BitcoinLikeAccount"
      },
      asEthereumLikeAccount: {
        returns: "EthereumLikeAccount"
      },
      synchronize: {
        returns: "EventBus"
      },
      queryOperations: {
        returns: "OperationQuery"
      }
    }
  });

  declare("Operation", {
    methods: {
      getDate: {},
      asBitcoinLikeOperation: {
        returns: "BitcoinLikeOperation"
      },
      asEthereumLikeOperation: {
        returns: "EthereumLikeOperation"
      },
      getOperationType: {},
      getAmount: { returns: "Amount" },
      getFees: { returns: "Amount" },
      getBlockHeight: {},
      getRecipients: {},
      getSenders: {}
    }
  });

  declare("Currency", {
    njsUsesPlainObject: true,
    methods: {
      getBitcoinLikeNetworkParameters: {
        returns: "BitcoinLikeNetworkParameters",
        njsField: "bitcoinLikeNetworkParameters"
      }
    }
  });

  declare("BigInt", {
    methods: {
      toString: {}
    }
  });

  declare("Amount", {
    statics: {
      fromHex: {
        params: ["Currency"],
        returns: "Amount",
        njsBuggyMethodIsNotStatic: true
      }
    },
    methods: {
      toBigInt: {
        returns: "BigInt"
      }
    }
  });

  declare("Block", {
    njsUsesPlainObject: true,
    methods: {
      getHeight: {
        njsField: "height"
      }
    }
  });

  declare("DerivationPath", {
    methods: {
      toString: {},
      isNull: {}
    }
  });

  declare("BitcoinLikeInput", {
    methods: {
      getPreviousTransaction: {
        returns: "hex"
      },
      getPreviousOutputIndex: {},
      getSequence: {},
      getDerivationPath: { returns: ["DerivationPath"] },
      getAddress: {}
    }
  });

  declare("BitcoinLikeOutput", {
    methods: {
      getDerivationPath: {
        returns: "DerivationPath"
      },
      getAddress: {}
    }
  });

  declare("BitcoinLikeTransaction", {
    methods: {
      getHash: {},
      getFees: {
        returns: "Amount"
      },
      getInputs: {
        returns: ["BitcoinLikeInput"]
      },
      getOutputs: {
        returns: ["BitcoinLikeOutput"]
      },
      serializeOutputs: {
        returns: "hex"
      },
      getTimestamp: {}
    }
  });

  declare("BitcoinLikeOperation", {
    methods: {
      getTransaction: {
        returns: "BitcoinLikeTransaction"
      }
    }
  });

  declare("EthereumLikeOperation", {
    methods: {
      getTransaction: {
        returns: "EthereumLikeTransaction"
      }
    }
  });

  declare("EthereumLikeAddress", {
    methods: {
      toEIP55: {}
    }
  });

  declare("Address", {
    statics: {
      isValid: {
        params: [null, "Currency"],
        njsBuggyMethodIsNotStatic: true
      }
    },
    methods: {
      toString: {},
      getDerivationPath: {}
    }
  });

  declare("BitcoinLikeTransactionBuilder", {
    methods: {
      wipeToAddress: {},
      sendToAddress: {
        params: ["Amount"]
      },
      pickInputs: {},
      setFeesPerByte: {
        params: ["Amount"]
      },
      build: { returns: "BitcoinLikeTransaction" }
    }
  });

  declare("BitcoinLikeAccount", {
    methods: {
      buildTransaction: {
        returns: "BitcoinLikeTransactionBuilder"
      },
      broadcastRawTransaction: {
        params: ["hex"]
      }
    }
  });

  declare("EthereumLikeTransaction", {
    methods: {
      getHash: {},
      getGasPrice: { returns: "Amount" },
      getGasLimit: { returns: "Amount" },
      getGasUsed: { returns: "Amount" },
      getReceiver: { returns: "EthereumLikeAddress" },
      getSender: { returns: "EthereumLikeAddress" },
      serialize: { returns: "hex" },
      setSignature: {
        params: ["hex", "hex", "hex"]
      },
      getStatus: {}
    }
  });

  declare("EthereumLikeTransactionBuilder", {
    methods: {
      wipeToAddress: {},
      sendToAddress: {
        params: ["Amount"]
      },
      setGasPrice: {
        params: ["Amount"]
      },
      setGasLimit: {
        params: ["Amount"]
      },
      setInputData: {
        params: ["hex"]
      },
      build: {
        returns: "EthereumLikeTransaction"
      }
    }
  });

  declare("OperationQuery", {
    methods: {
      complete: { returns: "OperationQuery" },
      addOrder: { returns: "OperationQuery" },
      execute: { returns: ["Operation"] }
    }
  });

  declare("AccountCreationInfo", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, null, ["hex"], ["hex"]],
        returns: "AccountCreationInfo",
        njsInstanciateClass: [
          {
            index: 0,
            owners: 1,
            derivations: 2,
            publicKeys: 3,
            chainCodes: 4
          }
        ]
      }
    },
    methods: {
      getDerivations: { njsField: "derivations" },
      getChainCodes: { njsField: "chainCodes", returns: ["hex"] },
      getPublicKeys: { njsField: "publicKeys", returns: ["hex"] },
      getOwners: { njsField: "owners" },
      getIndex: { njsField: "index" }
    }
  });

  declare("BitcoinLikeNetworkParameters", {
    njsUsesPlainObject: true,
    methods: {
      getSigHash: {
        returns: "hex",
        njsField: "SigHash"
      },
      getUsesTimestampedTransaction: {
        njsField: "UsesTimestampedTransaction"
      }
    }
  });

  declare("ExtendedKeyAccountCreationInfo", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        returns: "ExtendedKeyAccountCreationInfo",
        njsInstanciateClass: [
          {
            index: 0,
            owners: 1,
            derivations: 2,
            extendedKeys: 3
          }
        ]
      }
    },
    methods: {
      getIndex: { njsField: "index" },
      getExtendedKeys: { njsField: "extendedKeys" },
      getOwners: { njsField: "owners" },
      getDerivations: { njsField: "derivations" }
    }
  });

  declare("DynamicObject", {
    statics: {
      flush: {},
      newInstance: {
        returns: "DynamicObject",
        njsInstanciateClass: []
      }
    },
    methods: {
      putString: {}
    }
  });

  declare("SerialContext", {});

  declare("ThreadDispatcher", {
    statics: {
      newInstance: {
        returns: "ThreadDispatcher"
      }
    },
    methods: {
      getMainExecutionContext: {
        returns: "SerialContext"
      }
    }
  });

  declare("EventBus", {
    methods: {
      subscribe: {
        params: ["SerialContext", "EventReceiver"]
      }
    }
  });

  declare("EventReceiver", {
    statics: {
      newInstance: {
        returns: "EventReceiver"
      }
    }
  });

  declare("HttpClient", {
    statics: {
      newInstance: {
        returns: "HttpClient"
      },
      flush: {}
    }
  });

  declare("WebSocketClient", {
    statics: {
      newInstance: {
        returns: "WebSocketClient"
      },
      flush: {}
    }
  });

  declare("PathResolver", {
    statics: {
      newInstance: {
        returns: "PathResolver"
      },
      flush: {}
    }
  });

  declare("LogPrinter", {
    statics: {
      newInstance: {
        returns: "LogPrinter"
      },
      flush: {}
    }
  });

  declare("RandomNumberGenerator", {
    statics: {
      newInstance: {
        returns: "RandomNumberGenerator"
      },
      flush: {}
    }
  });

  declare("DatabaseBackend", {
    statics: {
      flush: {},
      getSqlite3Backend: {
        returns: "DatabaseBackend"
      }
    }
  });

  declare("EthereumLikeAccount", {
    methods: {
      buildTransaction: {
        returns: "EthereumLikeTransactionBuilder"
      },
      broadcastRawTransaction: {
        params: ["hex"]
      },
      getERC20Accounts: {
        returns: ["ERC20LikeAccount"]
      }
    }
  });

  declare("ERC20LikeAccount", {
    methods: {
      getBalance: { returns: "BigInt" },
      getAddress: {},
      getToken: { returns: "ERC20Token" },
      getOperations: { returns: ["ERC20LikeOperation"] }
    }
  });

  declare("ERC20LikeOperation", {
    methods: {
      getHash: {},
      getGasPrice: { returns: "BigInt" },
      getGasLimit: { returns: "BigInt" },
      getUsedGas: { returns: "BigInt" },
      getSender: {},
      getReceiver: {},
      getValue: { returns: "BigInt" },
      getTime: {},
      getOperationType: { returns: "OperationType" },
      getStatus: {}
    }
  });

  declare("ERC20Token", {
    njsUsesPlainObject: true,
    methods: {
      getContractAddress: {
        njsField: "contractAddress"
      }
    }
  });

  declare("LedgerCore", {
    statics: {
      getStringVersion: {
        njsBuggyMethodIsNotStatic: true
      },
      getIntVersion: {
        njsBuggyMethodIsNotStatic: true
      }
    }
  });
};
