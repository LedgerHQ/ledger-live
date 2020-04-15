// @flow

// NB this is a tradeoff that for now, we maintain ourself the types interface AND the JS declaration of them.
// this allow to do wrapping on top of the different libcore interfaces

import { reflectSpecifics } from "../../generated/types";
import type {
  SpecificStatics,
  CoreAccountSpecifics,
  CoreOperationSpecifics,
  CoreCurrencySpecifics
} from "../../generated/types";

// This is an exception because Stellar is the only one who need a specific methods
// Need to talk about this in a PR with @gre

import type { CoreStellarLikeWallet } from "../../families/stellar/types";

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
  asStellarLikeWallet(): Promise<CoreStellarLikeWallet>;
}

export const TimePeriod = {
  HOUR: 0,
  DAY: 1,
  WEEK: 2,
  MONTH: 3
};

declare type CoreAccount = {
  getBalance(): Promise<CoreAmount>,
  getBalanceHistory(
    from: string,
    to: string,
    timePeriod: $Values<typeof TimePeriod>
  ): Promise<CoreAmount[]>,
  getLastBlock(): Promise<CoreBlock>,
  getFreshPublicAddresses(): Promise<CoreAddress[]>,
  getRestoreKey(): Promise<string>,
  synchronize(): Promise<CoreEventBus>,
  queryOperations(): Promise<CoreOperationQuery>
} & CoreAccountSpecifics;

declare type CoreOperation = {
  getDate(): Promise<string>,
  getOperationType(): Promise<OperationType>,
  getAmount(): Promise<CoreAmount>,
  getFees(): Promise<?CoreAmount>,
  getBlockHeight(): Promise<?number>,
  getRecipients(): Promise<string[]>,
  getSenders(): Promise<string[]>
} & CoreOperationSpecifics;

declare type CoreCurrency = {} & CoreCurrencySpecifics;

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
  static fromIntegerString(s: string, radix: number): Promise<CoreBigInt>;

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

export type OperationType = 0 | 1;

declare class CoreAddress {
  static isValid(recipient: string, currency: CoreCurrency): Promise<boolean>;
  toString(): Promise<string>;
  getDerivationPath(): Promise<?string>;
}

declare class CoreOperationQuery {
  offset(number): Promise<void>;
  limit(number): Promise<void>;
  partial(): Promise<void>;
  complete(): Promise<void>;
  addOrder(number, boolean): Promise<void>;
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
  putInt(string, number): Promise<void>;
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

export type CoreStatics = {
  Account: Class<CoreAccount>,
  AccountCreationInfo: Class<CoreAccountCreationInfo>,
  Address: Class<CoreAddress>,
  Amount: Class<CoreAmount>,
  BigInt: Class<CoreBigInt>,
  Block: Class<CoreBlock>,
  Currency: Class<CoreCurrency>,
  DatabaseBackend: Class<CoreDatabaseBackend>,
  DerivationPath: Class<CoreDerivationPath>,
  DynamicObject: Class<CoreDynamicObject>,
  EventBus: Class<CoreEventBus>,
  EventReceiver: Class<CoreEventReceiver>,
  ExtendedKeyAccountCreationInfo: Class<CoreExtendedKeyAccountCreationInfo>,
  HttpClient: Class<CoreHttpClient>,
  LedgerCore: Class<CoreLedgerCore>,
  LogPrinter: Class<CoreLogPrinter>,
  Operation: Class<CoreOperation>,
  OperationQuery: Class<CoreOperationQuery>,
  PathResolver: Class<CorePathResolver>,
  RandomNumberGenerator: Class<CoreRandomNumberGenerator>,
  SerialContext: Class<CoreSerialContext>,
  ThreadDispatcher: Class<CoreThreadDispatcher>,
  Wallet: Class<CoreWallet>,
  WalletPool: Class<CoreWalletPool>,
  WebSocketClient: Class<CoreWebSocketClient>
} & SpecificStatics;

export type Core = CoreStatics & {
  flush: () => Promise<void>,
  getPoolInstance: () => CoreWalletPool,
  getThreadDispatcher: () => CoreThreadDispatcher
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
  CoreWebSocketClient
};

type SpecMapF = {
  params?: Array<?string | string[]>,
  returns?: string | string[],
  njsField?: string,
  njsInstanciateClass?: Array<Object>,
  njsBuggyMethodIsNotStatic?: boolean | Function,
  nodejsNotAvailable?: boolean
};

export type Spec = {
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
  const { AccountMethods, OperationMethods, WalletMethods } = reflectSpecifics(
    declare
  ).reduce(
    (all, extra) => ({
      AccountMethods: {
        ...all.AccountMethods,
        ...(extra && extra.AccountMethods)
      },
      OperationMethods: {
        ...all.OperationMethods,
        ...(extra && extra.OperationMethods)
      },
      WalletMethods: {
        ...all.WalletMethods,
        ...(extra && extra.WalletMethods && extra.WalletMethods)
      }
    }),
    {}
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
          "DynamicObject"
        ],
        returns: "WalletPool"
      }
    },
    methods: {
      freshResetAll: {},
      changePassword: {},
      getName: {},
      updateWalletConfig: {
        params: [null, "DynamicObject"]
      },
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
      ...WalletMethods,
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
      ...AccountMethods,
      getBalance: {
        returns: "Amount"
      },
      getBalanceHistory: {
        returns: ["Amount"]
      },
      getLastBlock: {
        returns: "Block"
      },
      getFreshPublicAddresses: {
        returns: ["Address"]
      },
      getRestoreKey: {},
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
      ...OperationMethods,
      getDate: {},
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
    statics: {
      fromIntegerString: {
        njsBuggyMethodIsNotStatic: () => ["", 0, "."],
        returns: "BigInt"
      }
    },
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

  declare("OperationQuery", {
    methods: {
      limit: {},
      offset: {},
      partial: {},
      complete: {},
      addOrder: {},
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
      putString: {},
      putInt: {}
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
        nodejsNotAvailable: true,
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
