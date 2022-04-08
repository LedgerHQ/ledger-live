import type { BigNumber } from "bignumber.js";
import type { Unit } from "../../types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type { CoreAmount, CoreBigInt, Spec } from "../../libcore/types";

declare class CoreRippleLikeAddress {
  toBase58(): Promise<string>;
}

declare class CoreRippleLikeTransaction {
  getHash(): Promise<string>;
  getFees(): Promise<CoreAmount>;
  getReceiver(): Promise<CoreRippleLikeAddress>;
  getSender(): Promise<CoreRippleLikeAddress>;
  serialize(): Promise<string>;
  setSignature(arg0: string, arg1: string): Promise<void>;
  setDERSignature(arg0: string): Promise<void>;
  getDestinationTag(): Promise<number | null | undefined>;
  getSequence(): Promise<CoreBigInt>;
}

declare class CoreRippleLikeOperation {
  getTransaction(): Promise<CoreRippleLikeTransaction>;
}

declare class CoreRippleLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  setDestinationTag(tag: number): Promise<void>;
  setFees(fees: CoreAmount): Promise<void>;
  build(): Promise<CoreRippleLikeTransaction>;
}

declare class CoreRippleLikeAccount {
  buildTransaction(): Promise<CoreRippleLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
  getFees(): Promise<CoreAmount>;
  getBaseReserve(): Promise<CoreAmount>;
  isAddressActivated(address: string): Promise<boolean>;
}

export type CoreStatics = {
  RippleLikeOperation: CoreRippleLikeOperation;
  RippleLikeAddress: CoreRippleLikeAddress;
  RippleLikeTransaction: CoreRippleLikeTransaction;
  RippleLikeAccount: CoreRippleLikeAccount;
  RippleLikeTransactionBuilder: CoreRippleLikeTransactionBuilder;
};
export type {
  CoreRippleLikeAccount,
  CoreRippleLikeAddress,
  CoreRippleLikeOperation,
  CoreRippleLikeTransaction,
  CoreRippleLikeTransactionBuilder,
};
export type CoreAccountSpecifics = {
  asRippleLikeAccount(): Promise<CoreRippleLikeAccount>;
};
export type CoreOperationSpecifics = {
  asRippleLikeOperation(): Promise<CoreRippleLikeOperation>;
};
export type CoreCurrencySpecifics = Record<string, never>;
export type NetworkInfo = {
  family: "ripple";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};
export type NetworkInfoRaw = {
  family: "ripple";
  serverFee: string;
  baseReserve: string;
};
export type Transaction = TransactionCommon & {
  family: "ripple";
  fee: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "ripple";
  fee: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};
export const reflect = (declare: (arg0: string, arg1: Spec) => void) => {
  declare("RippleLikeAddress", {
    methods: {
      toBase58: {},
    },
  });
  declare("RippleLikeOperation", {
    methods: {
      getTransaction: {
        returns: "RippleLikeTransaction",
      },
    },
  });
  declare("RippleLikeTransaction", {
    methods: {
      getHash: {},
      getDestinationTag: {},
      getSequence: {
        returns: "BigInt",
      },
      getFees: {
        returns: "Amount",
      },
      getReceiver: {
        returns: "RippleLikeAddress",
      },
      getSender: {
        returns: "RippleLikeAddress",
      },
      serialize: {
        returns: "hex",
      },
      setSignature: {
        params: ["hex", "hex"],
      },
      setDERSignature: {
        params: ["hex"],
      },
    },
  });
  declare("RippleLikeTransactionBuilder", {
    methods: {
      wipeToAddress: {},
      sendToAddress: {
        params: ["Amount"],
      },
      setFees: {
        params: ["Amount"],
      },
      setDestinationTag: {},
      build: {
        returns: "RippleLikeTransaction",
      },
    },
  });
  declare("RippleLikeAccount", {
    methods: {
      buildTransaction: {
        returns: "RippleLikeTransactionBuilder",
      },
      broadcastRawTransaction: {
        params: ["hex"],
      },
      getFees: {
        returns: "Amount",
      },
      getBaseReserve: {
        returns: "Amount",
      },
      isAddressActivated: {},
    },
  });
  return {
    OperationMethods: {
      asRippleLikeOperation: {
        returns: "RippleLikeOperation",
      },
    },
    AccountMethods: {
      asRippleLikeAccount: {
        returns: "RippleLikeAccount",
      },
    },
  };
};
