// @flow

import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type {
  CoreAmount,
  CoreBigInt,
  Spec,
  CoreAddress,
} from "../../libcore/types";

declare class CoreStellarLikeWallet {
  exists(string): Promise<boolean>;
}

declare class CoreStellarLikeOperationRecord {
  operationHash: string;
  transactionHash: string;
  getTransactionHash(): Promise<string>;
}

declare class CoreStellarLikeTransactionBuilder {
  addNativePayment(
    address: string,
    amount: CoreAmount
  ): Promise<CoreStellarLikeTransactionBuilder>;
  addCreateAccount(
    address: string,
    amount: CoreAmount
  ): Promise<CoreStellarLikeTransactionBuilder>;
  setBaseFee(fees: CoreAmount): Promise<CoreStellarLikeTransactionBuilder>;
  setSequence(sequence: CoreBigInt): Promise<CoreStellarLikeTransactionBuilder>;
  setTextMemo(memo: string): Promise<CoreStellarLikeTransactionBuilder>;
  setNumberMemo(memo: CoreBigInt): Promise<CoreStellarLikeTransactionBuilder>;
  setHashMemo(memo: string): Promise<CoreStellarLikeTransactionBuilder>;
  setReturnMemo(memo: string): Promise<CoreStellarLikeTransactionBuilder>;
  build(): Promise<CoreStellarLikeTransaction>;
}

declare class CoreStellarLikeTransaction {
  transactionHash: string;
  toRawTransaction(): string;
  toSignatureBase(): Promise<string>;
  putSignature(signature: string, address: CoreAddress): null;
  getSourceAccount(): Promise<CoreAddress>;
  getSourceAccountSequence(): Promise<CoreBigInt>;
  getFee(): Promise<CoreAmount>;
}

declare class CoreStellarLikeOperation {
  getRecord(): Promise<CoreStellarLikeOperationRecord>;
  getTransaction(): Promise<CoreStellarLikeTransaction>;
}

declare class CoreStellarLikeAccount {
  buildTransaction(): Promise<CoreStellarLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
  getBaseReserve(): Promise<CoreAmount>;
  getSequence(): Promise<CoreBigInt>;
  getFeeStats(): Promise<StellarLikeFeeStats>;
  getSigners(): Promise<Array<CoreStellarLikeAccountSigner>>;
}

declare class CoreStellarLikeAccountSigner {
  key: string;
  type: string;
}

declare class StellarLikeFeeStats {
  lastBaseFee: number;
  modeAcceptedFee: number;
  minAccepted: number;
  maxFee: number;
  getLastBaseFee(): Promise<number>;
  getModeAcceptedFee(): Promise<number>;
}

export type CoreStatics = {
  StellarLikeOperation: Class<CoreStellarLikeOperation>,
  StellarLikeTransaction: Class<CoreStellarLikeTransaction>,
  StellarLikeAddress: Class<CoreStellarLikeAccount>,
  StellerLikeWallet: Class<CoreStellarLikeWallet>,
};

export type {
  CoreStellarLikeOperation,
  CoreStellarLikeOperationRecord,
  CoreStellarLikeTransaction,
  CoreStellarLikeAccount,
  CoreStellarLikeTransactionBuilder,
  CoreStellarLikeWallet,
};

export type CoreAccountSpecifics = {
  asStellarLikeAccount(): Promise<CoreStellarLikeAccount>,
};

export type CoreOperationSpecifics = {
  asStellarLikeOperation(): Promise<CoreStellarLikeOperation>,
};

export type CoreCurrencySpecifics = {};

export type NetworkInfo = {|
  family: "stellar",
  fees: BigNumber,
  baseReserve: BigNumber,
|};

export type NetworkInfoRaw = {|
  family: "stellar",
  fees: string,
  baseReserve: string,
|};

export const StellarMemoType = [
  "NO_MEMO",
  "MEMO_TEXT",
  "MEMO_ID",
  "MEMO_HASH",
  "MEMO_RETURN",
];

export type Transaction = {|
  ...TransactionCommon,
  family: "stellar",
  networkInfo: ?NetworkInfo,
  fees: ?BigNumber,
  baseReserve: ?BigNumber,
  memoType: ?string,
  memoValue: ?string,
  memoTypeRecommended: ?boolean,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "stellar",
  networkInfo: ?NetworkInfoRaw,
  fees: ?string,
  baseReserve: ?string,
  memoType: ?string,
  memoValue: ?string,
  memoTypeRecommended: ?boolean,
|};

export const reflect = (declare: (string, Spec) => void) => {
  declare("StellarLikeTransactionBuilder", {
    methods: {
      setHashMemo: {
        params: ["hex"],
      },
      setReturnMemo: {
        params: ["hex"],
      },
      setSequence: {
        params: ["BigInt"],
      },
      setBaseFee: {
        params: ["Amount"],
      },
      addCreateAccount: {
        params: ["String", "Amount"],
      },
      addNativePayment: {
        params: ["String", "Amount"],
      },
      setTextMemo: {},
      setNumberMemo: {
        params: ["BigInt"],
      },
      build: {
        returns: "StellarLikeTransaction",
      },
    },
  });

  declare("StellarLikeWallet", {
    methods: {
      exists: {},
    },
  });

  declare("StellarLikeFeeStats", {
    njsUsesPlainObject: true,
    methods: {
      getLastBaseFee: {
        njsField: "lastBaseFee",
      },
      getModeAcceptedFee: {
        njsField: "modeAcceptedFee",
      },
    },
  });

  declare("StellarLikeAccountSigner", {
    njsUsesPlainObject: true,
    methods: {
      getType: {
        njsField: "type",
      },
      getKey: {
        njsField: "key",
      },
    },
  });

  declare("StellarLikeOperationRecord", {
    njsUsesPlainObject: true,
    methods: {
      getTransactionHash: {
        njsField: "transactionHash",
      },
    },
  });

  declare("StellarLikeOperation", {
    methods: {
      getRecord: {
        returns: "StellarLikeOperationRecord",
      },
      getTransaction: {
        returns: "StellarLikeTransaction",
      },
    },
  });

  declare("StellarLikeTransaction", {
    methods: {
      putSignature: {
        params: ["hex", "Address"],
      },
      toRawTransaction: {
        returns: "hex",
      },
      getSourceAccount: {
        returns: "Address",
      },
      getFee: {
        returns: "Amount",
      },
      getSourceAccountSequence: {
        returns: "BigInt",
      },
      toSignatureBase: {
        returns: "hex",
      },
    },
  });

  declare("StellarLikeAccount", {
    methods: {
      buildTransaction: {
        returns: "StellarLikeTransactionBuilder",
      },
      broadcastRawTransaction: {
        params: ["hex"],
      },
      getBaseReserve: {
        returns: "Amount",
      },
      getFeeStats: {
        returns: "StellarLikeFeeStats",
      },
      getSequence: {
        returns: "BigInt",
      },
      getSigners: {
        returns: ["StellarLikeAccountSigner"],
      },
    },
  });

  return {
    OperationMethods: {
      asStellarLikeOperation: {
        returns: "StellarLikeOperation",
      },
    },
    AccountMethods: {
      asStellarLikeAccount: {
        returns: "StellarLikeAccount",
      },
    },
    WalletMethods: {
      asStellarLikeWallet: {
        returns: "StellarLikeWallet",
      },
    },
  };
};
