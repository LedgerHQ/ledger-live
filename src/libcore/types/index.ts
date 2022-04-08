// NB this is a tradeoff that for now, we maintain ourself the types interface AND the JS declaration of them.
// this allow to do wrapping on top of the different libcore interfaces
import { reflectSpecifics } from "../../generated/types";
import type {
  SpecificStatics,
  CoreAccountSpecifics,
  CoreOperationSpecifics,
  CoreCurrencySpecifics,
} from "../../generated/types";

declare class CoreWalletPool {
  newInstance(
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
  updateWalletConfig(
    walletName: string,
    config: CoreDynamicObject
  ): Promise<void>;
  createWallet(
    walletName: string,
    currency: CoreCurrency,
    config: CoreDynamicObject
  ): Promise<CoreWallet>;
  freshResetAll(): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  getName(): Promise<string>;
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

export const TimePeriod = {
  HOUR: 0,
  DAY: 1,
  WEEK: 2,
  MONTH: 3,
};
declare type CoreAccount = {
  getBalance(): Promise<CoreAmount>;
  getBalanceHistory(
    from: string,
    to: string,
    timePeriod: typeof TimePeriod[keyof typeof TimePeriod]
  ): Promise<CoreAmount[]>;
  getLastBlock(): Promise<CoreBlock>;
  getFreshPublicAddresses(): Promise<CoreAddress[]>;
  getRestoreKey(): Promise<string>;
  synchronize(): Promise<CoreEventBus>;
  queryOperations(): Promise<CoreOperationQuery>;
} & CoreAccountSpecifics;
declare type CoreOperation = {
  getDate(): Promise<string>;
  getOperationType(): Promise<OperationType>;
  getAmount(): Promise<CoreAmount>;
  getFees(): Promise<CoreAmount | null | undefined>;
  getBlockHeight(): Promise<number | null | undefined>;
  getRecipients(): Promise<string[]>;
  getSelfRecipients(): Promise<string[]>;
  getSenders(): Promise<string[]>;
} & CoreOperationSpecifics;
declare type CoreCurrency = Record<string, never> & CoreCurrencySpecifics;

declare class CoreLedgerCore {
  getStringVersion(): Promise<string>;
  getIntVersion(): Promise<number>;
}

declare class CoreDatabaseBackend {
  getSqlite3Backend(): Promise<CoreDatabaseBackend>;
  flush(): Promise<void>;
}

declare class CoreHttpClient {
  newInstance(): Promise<CoreHttpClient>;
  flush(): Promise<void>;
}

declare class CoreWebSocketClient {
  newInstance(): Promise<CoreWebSocketClient>;
  flush(): Promise<void>;
}

declare class CorePathResolver {
  newInstance(): Promise<CorePathResolver>;
  flush(): Promise<void>;
}

declare class CoreLogPrinter {
  newInstance(): Promise<CoreLogPrinter>;
  flush(): Promise<void>;
}

declare class CoreRandomNumberGenerator {
  newInstance(): Promise<CoreRandomNumberGenerator>;
  flush(): Promise<void>;
}

declare class CoreBigInt {
  fromIntegerString(s: string, radix: number): Promise<CoreBigInt>;
  toString(base: number): Promise<string>;
}

declare class CoreAmount {
  fromHex(arg0: CoreCurrency, arg1: string): Promise<CoreAmount>;
  toBigInt(): Promise<CoreBigInt>;
}

declare class CoreBlock {
  getHeight(): Promise<number>;
}

declare class CoreDerivationPath {
  toString(): Promise<string>;
  isNull(): Promise<boolean>;
}

export type OperationType = 0 | 1;

declare class CoreAddress {
  isValid(recipient: string, currency: CoreCurrency): Promise<boolean>;
  toString(): Promise<string>;
  getDerivationPath(): Promise<string | null | undefined>;
}

declare class CoreOperationQuery {
  offset(arg0: number): Promise<void>;
  limit(arg0: number): Promise<void>;
  partial(): Promise<void>;
  complete(): Promise<void>;
  addOrder(arg0: number, arg1: boolean): Promise<void>;
  execute(): Promise<CoreOperation[]>;
}

declare class CoreAccountCreationInfo {
  init(
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

declare class CoreExtendedKeyAccountCreationInfo {
  init(
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
  newInstance(): Promise<CoreDynamicObject>;
  flush(): Promise<void>;
  putBoolean(arg0: string, arg1: boolean): Promise<void>;
  putString(arg0: string, arg1: string): Promise<void>;
  putInt(arg0: string, arg1: number): Promise<void>;
}

declare class CoreSerialContext {}

declare class CoreThreadDispatcher {
  newInstance(): Promise<CoreThreadDispatcher>;
  getMainExecutionContext(): Promise<CoreSerialContext>;
}

declare class CoreEventBus {
  subscribe(
    serialContext: CoreSerialContext,
    eventReceiver: CoreEventReceiver
  ): Promise<void>;
}

declare class CoreEventReceiver {
  newInstance(): Promise<CoreEventReceiver>;
}

export type CoreStatics = {
  Account: CoreAccount;
  AccountCreationInfo: CoreAccountCreationInfo;
  Address: CoreAddress;
  Amount: CoreAmount;
  BigInt: CoreBigInt;
  Block: CoreBlock;
  Currency: CoreCurrency;
  DatabaseBackend: CoreDatabaseBackend;
  DerivationPath: CoreDerivationPath;
  DynamicObject: CoreDynamicObject;
  EventBus: CoreEventBus;
  EventReceiver: CoreEventReceiver;
  ExtendedKeyAccountCreationInfo: CoreExtendedKeyAccountCreationInfo;
  HttpClient: CoreHttpClient;
  LedgerCore: CoreLedgerCore;
  LogPrinter: CoreLogPrinter;
  Operation: CoreOperation;
  OperationQuery: CoreOperationQuery;
  PathResolver: CorePathResolver;
  RandomNumberGenerator: CoreRandomNumberGenerator;
  SerialContext: CoreSerialContext;
  ThreadDispatcher: CoreThreadDispatcher;
  Wallet: CoreWallet;
  WalletPool: CoreWalletPool;
  WebSocketClient: CoreWebSocketClient;
} & SpecificStatics;
export type Core = CoreStatics & {
  flush: () => Promise<void>;
  getPoolInstance: () => CoreWalletPool;
  getThreadDispatcher: () => CoreThreadDispatcher;
};
export type {
  CoreAccount,
  CoreAccountCreationInfo,
  CoreAddress,
  CoreAmount,
  CoreBigInt,
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
  CoreWebSocketClient,
};
type SpecMapF = {
  params?: Array<(string | null | undefined) | string[]>;
  returns?: string | string[];
  njsField?: string;
  njsInstanciateClass?: Array<Record<string, any>>;
  njsBuggyMethodIsNotStatic?: boolean | ((...args: Array<any>) => any);
  nodejsNotAvailable?: boolean;
};
export type Spec = {
  njsUsesPlainObject?: boolean;
  statics?: Record<string, SpecMapF>;
  methods?: Record<string, SpecMapF>;
};
// To make the above contract possible with current libcore bindings,
// we need to define the code below and build-up abstraction wrappings on top of the lower level bindings.
// We do this at runtime but ideally in the future, it will be at build time (generated code).
export const reflect = (declare: (arg0: string, arg1: Spec) => void): void => {
  const { AccountMethods, OperationMethods } = reflectSpecifics(declare).reduce(
    (all, extra) => ({
      AccountMethods: {
        ...all.AccountMethods,
        ...(extra && extra.AccountMethods),
      },
      OperationMethods: {
        ...all.OperationMethods,
        ...(extra && extra.OperationMethods),
      },
    }),
    { AccountMethods: {}, OperationMethods: {} }
  );
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
      freshResetAll: {},
      changePassword: {},
      getName: {},
      updateWalletConfig: {
        params: [null, "DynamicObject"],
      },
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
      ...AccountMethods,
      getBalance: {
        returns: "Amount",
      },
      getBalanceHistory: {
        returns: ["Amount"],
      },
      getLastBlock: {
        returns: "Block",
      },
      getFreshPublicAddresses: {
        returns: ["Address"],
      },
      getRestoreKey: {},
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
      ...OperationMethods,
      getDate: {},
      getOperationType: {},
      getAmount: {
        returns: "Amount",
      },
      getFees: {
        returns: "Amount",
      },
      getBlockHeight: {},
      getRecipients: {},
      getSelfRecipients: {},
      getSenders: {},
    },
  });
  declare("Currency", {
    njsUsesPlainObject: true,
    methods: {
      getBitcoinLikeNetworkParameters: {
        returns: "BitcoinLikeNetworkParameters",
        njsField: "bitcoinLikeNetworkParameters",
      },
    },
  });
  declare("BigInt", {
    statics: {
      fromIntegerString: {
        njsBuggyMethodIsNotStatic: () => ["", 0, "."],
        returns: "BigInt",
      },
    },
    methods: {
      toString: {},
    },
  });
  declare("Amount", {
    statics: {
      fromHex: {
        params: ["Currency"],
        returns: "Amount",
        njsBuggyMethodIsNotStatic: true,
      },
    },
    methods: {
      toBigInt: {
        returns: "BigInt",
      },
    },
  });
  declare("Block", {
    njsUsesPlainObject: true,
    methods: {
      getHeight: {
        njsField: "height",
      },
    },
  });
  declare("DerivationPath", {
    methods: {
      toString: {},
      isNull: {},
    },
  });
  declare("Address", {
    statics: {
      isValid: {
        params: [null, "Currency"],
        njsBuggyMethodIsNotStatic: true,
      },
    },
    methods: {
      toString: {},
      getDerivationPath: {},
    },
  });
  declare("OperationQuery", {
    methods: {
      limit: {},
      offset: {},
      partial: {},
      complete: {},
      addOrder: {},
      execute: {
        returns: ["Operation"],
      },
    },
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
            chainCodes: 4,
          },
        ],
      },
    },
    methods: {
      getDerivations: {
        njsField: "derivations",
      },
      getChainCodes: {
        njsField: "chainCodes",
        returns: ["hex"],
      },
      getPublicKeys: {
        njsField: "publicKeys",
        returns: ["hex"],
      },
      getOwners: {
        njsField: "owners",
      },
      getIndex: {
        njsField: "index",
      },
    },
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
            extendedKeys: 3,
          },
        ],
      },
    },
    methods: {
      getIndex: {
        njsField: "index",
      },
      getExtendedKeys: {
        njsField: "extendedKeys",
      },
      getOwners: {
        njsField: "owners",
      },
      getDerivations: {
        njsField: "derivations",
      },
    },
  });
  declare("DynamicObject", {
    statics: {
      flush: {},
      newInstance: {
        returns: "DynamicObject",
        njsInstanciateClass: [],
      },
    },
    methods: {
      putBoolean: {},
      putString: {},
      putInt: {},
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
        nodejsNotAvailable: true,
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
  declare("LedgerCore", {
    statics: {
      getStringVersion: {
        njsBuggyMethodIsNotStatic: true,
      },
      getIntVersion: {
        njsBuggyMethodIsNotStatic: true,
      },
    },
  });
};
