import type { BigNumber } from "bignumber.js";
import type {
  CoreAmount,
  CoreBigInt,
  Spec,
  CoreOperationQuery,
} from "../../libcore/types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type TezosResources = {
  revealed: boolean;
  counter: number;
};

export type TezosResourcesRaw = {
  revealed: boolean;
  counter: number;
};

// WILL BE DROPPED =>

export const tezosOperationTag = {
  OPERATION_TAG_NONE: 0,
  OPERATION_TAG_NONE1: 1,
  OPERATION_TAG_NONE2: 2,
  OPERATION_TAG_GENERIC: 3,
  OPERATION_TAG_NONE4: 4,
  OPERATION_TAG_PROPOSAL: 5,
  OPERATION_TAG_BALLOT: 6,
  OPERATION_TAG_REVEAL: 7,
  OPERATION_TAG_TRANSACTION: 8,
  OPERATION_TAG_ORIGINATION: 9,
  OPERATION_TAG_DELEGATION: 10,
};

export type TezosOperationMode = "send" | "delegate" | "undelegate";

export type TezosOperationTag =
  typeof tezosOperationTag[keyof typeof tezosOperationTag];

declare class CoreTezosLikeAddress {
  toBase58(): Promise<string>;
}

declare class CoreTezosLikeTransaction {
  getType(): Promise<TezosOperationTag>;
  getHash(): Promise<string>;
  getFees(): Promise<CoreAmount>;
  getValue(): Promise<CoreAmount>;
  getReceiver(): Promise<CoreTezosLikeAddress>;
  getSender(): Promise<CoreTezosLikeAddress>;
  getGasLimit(): Promise<CoreAmount>;
  serialize(): Promise<string>;
  setSignature(arg0: string): Promise<void>;
  getStatus(): Promise<number>;
}

declare class CoreTezosLikeOperation {
  getTransaction(): Promise<CoreTezosLikeTransaction>;
}

declare class CoreTezosLikeTransactionBuilder {
  setType(type: TezosOperationTag): Promise<CoreTezosLikeTransactionBuilder>;
  sendToAddress(
    amount: CoreAmount,
    address: string
  ): Promise<CoreTezosLikeTransactionBuilder>;
  wipeToAddress(address: string): Promise<CoreTezosLikeTransactionBuilder>;
  setFees(fees: CoreAmount): Promise<CoreTezosLikeTransactionBuilder>;
  setGasLimit(gasLimit: CoreAmount): Promise<CoreTezosLikeTransactionBuilder>;
  build(): Promise<CoreTezosLikeTransaction>;
  setStorageLimit(
    storageLimit: CoreBigInt
  ): Promise<CoreTezosLikeTransactionBuilder>;
}

declare class CoreTezosLikeAccount {
  broadcastRawTransaction(signed: string): Promise<string>;
  buildTransaction(): Promise<CoreTezosLikeTransactionBuilder>;
  getStorage(address: string): Promise<CoreBigInt>;
  getEstimatedGasLimit(address: string): Promise<CoreBigInt>;
  getFees(): Promise<CoreBigInt>;
  getOriginatedAccounts(): Promise<CoreTezosLikeOriginatedAccount[]>;
}

declare class CoreTezosLikeOriginatedAccount {
  getAddress(): Promise<string>;
  getPublicKey(): Promise<string>;
  getBalance(): Promise<CoreAmount>;
  isSpendable(): Promise<boolean>;
  isDelegatable(): Promise<boolean>;
  buildTransaction(): Promise<CoreTezosLikeTransactionBuilder>;
  queryOperations(): Promise<CoreOperationQuery>;
}

export type CoreStatics = {
  TezosLikeOperation: CoreTezosLikeOperation;
  TezosLikeAddress: CoreTezosLikeAddress;
  TezosLikeAccount: CoreTezosLikeAccount;
  TezosLikeTransaction: CoreTezosLikeTransaction;
  TezosLikeTransactionBuilder: CoreTezosLikeTransactionBuilder;
};
export type {
  CoreTezosLikeOperation,
  CoreTezosLikeAddress,
  CoreTezosLikeAccount,
  CoreTezosLikeOriginatedAccount,
  CoreTezosLikeTransaction,
  CoreTezosLikeTransactionBuilder,
};
export type CoreAccountSpecifics = {
  asTezosLikeAccount(): Promise<CoreTezosLikeAccount>;
};
export type CoreOperationSpecifics = {
  asTezosLikeOperation(): Promise<CoreTezosLikeOperation>;
};
export type CoreCurrencySpecifics = Record<string, never>;
export type NetworkInfo = {
  family: "tezos";
  fees: BigNumber;
};
export type NetworkInfoRaw = {
  family: "tezos";
  fees: string;
};
// TODO add a field for indicating if staking
export type Transaction = TransactionCommon & {
  family: "tezos";
  mode: TezosOperationMode;
  networkInfo: NetworkInfo | null | undefined;
  fees: BigNumber | null | undefined;
  gasLimit: BigNumber | null | undefined;
  storageLimit: BigNumber | null | undefined;
  estimatedFees: BigNumber | null | undefined;
  taquitoError: string | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "tezos";
  mode: TezosOperationMode;
  networkInfo: NetworkInfoRaw | null | undefined;
  fees: string | null | undefined;
  gasLimit: string | null | undefined;
  storageLimit: string | null | undefined;
  estimatedFees: string | null | undefined;
  taquitoError: string | null | undefined;
};
export const reflect = (declare: (arg0: string, arg1: Spec) => void) => {
  declare("TezosLikeAddress", {
    methods: {
      toBase58: {},
    },
  });
  declare("TezosLikeTransaction", {
    methods: {
      getType: {},
      getHash: {},
      getStatus: {},
      getFees: {
        returns: "Amount",
      },
      getValue: {
        returns: "Amount",
      },
      getGasLimit: {
        returns: "Amount",
      },
      getReceiver: {
        returns: "TezosLikeAddress",
      },
      getSender: {
        returns: "TezosLikeAddress",
      },
      serialize: {
        returns: "hex",
      },
      setSignature: {
        params: ["hex"],
      },
    },
  });
  declare("TezosLikeOperation", {
    methods: {
      getTransaction: {
        returns: "TezosLikeTransaction",
      },
    },
  });
  declare("TezosLikeTransactionBuilder", {
    methods: {
      setType: {
        returns: "TezosLikeTransactionBuilder",
      },
      sendToAddress: {
        params: ["Amount"],
        returns: "TezosLikeTransactionBuilder",
      },
      wipeToAddress: {
        returns: "TezosLikeTransactionBuilder",
      },
      setFees: {
        params: ["Amount"],
        returns: "TezosLikeTransactionBuilder",
      },
      setGasLimit: {
        params: ["Amount"],
        returns: "TezosLikeTransactionBuilder",
      },
      setStorageLimit: {
        params: ["BigInt"],
        returns: "TezosLikeTransactionBuilder",
      },
      build: {
        returns: "TezosLikeTransaction",
      },
    },
  });
  declare("TezosLikeAccount", {
    methods: {
      broadcastRawTransaction: {
        params: ["hex"],
      },
      buildTransaction: {
        returns: "TezosLikeTransactionBuilder",
      },
      getStorage: {
        returns: "BigInt",
      },
      getEstimatedGasLimit: {
        returns: "BigInt",
      },
      getFees: {
        returns: "BigInt",
      },
      getOriginatedAccounts: {
        returns: ["TezosLikeOriginatedAccount"],
      },
    },
  });
  declare("TezosLikeOriginatedAccount", {
    methods: {
      getAddress: {},
      getPublicKey: {},
      getBalance: {
        returns: "Amount",
      },
      isSpendable: {},
      isDelegatable: {},
      buildTransaction: {
        returns: "TezosLikeTransactionBuilder",
      },
      queryOperations: {
        returns: "OperationQuery",
      },
    },
  });
  return {
    OperationMethods: {
      asTezosLikeOperation: {
        returns: "TezosLikeOperation",
      },
    },
    AccountMethods: {
      asTezosLikeAccount: {
        returns: "TezosLikeAccount",
      },
    },
  };
};
