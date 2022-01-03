import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type { Operation, OperationRaw } from "../../types/operation";
import type { CoreAmount, Spec } from "../../libcore/types";
export const AlgorandOperationTypeEnum = {
  PAYMENT: 0,
  ASSET_OPT_IN: 7,
  ASSET_OPT_OUT: 8,
  ASSET_TRANSFER: 9,
};
export type CoreStatics = {
  AlgorandPaymentInfo: AlgorandPaymentInfo;
  AlgorandAssetTransferInfo: AlgorandAssetTransferInfo;
  AlgorandAddress: AlgorandAddress;
};
export type CoreAccountSpecifics = {
  asAlgorandAccount(): Promise<CoreAlgorandAccount>;
};
export type CoreOperationSpecifics = {
  asAlgorandOperation(): Promise<CoreAlgorandOperation>;
};

declare class AlgorandAddress {
  fromPublicKey(pubkey: string): Promise<string>;
}

declare class AlgorandPaymentInfo {
  init(
    amount: string,
    recipientAddress: string,
    closeAddress: string | null | undefined,
    closeAmount: string | null | undefined
  ): Promise<AlgorandPaymentInfo>;
}

declare class AlgorandAssetTransferInfo {
  init(
    assetId: string,
    amount: string,
    recipientAddress: string,
    closeAddress: string | null | undefined,
    clawedBackAddress: string | null | undefined,
    closeAmount: string | null | undefined
  ): Promise<AlgorandAssetTransferInfo>;
  getAmount(): Promise<string>;
  getAssetId(): Promise<string>;
  getRecipientAddress(): Promise<string>;
  getCloseAddress(): Promise<string>;
  getCloseAmount(): Promise<string>;
}

declare class CoreAlgorandTransaction {
  getId(): Promise<string>;
  getType(): Promise<string>;
  getSender(): Promise<string>;
  getFee(): Promise<string>;
  getNote(): Promise<string>;
  getRound(): Promise<string>;
  setSender(sender: string): void;
  setFee(fee: string): void;
  setNote(note: string): void;
  setPaymentInfo(info: AlgorandPaymentInfo): void;
  setAssetTransferInfo(info: AlgorandAssetTransferInfo): void;
  serialize(): Promise<string>;
  setSignature(signature: string): void;
  getAssetTransferInfo(): Promise<AlgorandAssetTransferInfo>;
}

declare class AlgorandAssetAmount {
  init(amount: string, assetId: string): Promise<AlgorandAssetAmount>;
  getAmount(): Promise<string>;
  getAssetId(): Promise<string>;
}

declare class CoreAlgorandAccount {
  getAssetsBalances(): Promise<AlgorandAssetAmount[]>;
  createTransaction(): Promise<CoreAlgorandTransaction>;
  getFeeEstimate(transaction: CoreAlgorandTransaction): Promise<CoreAmount>;
  getPendingRewards(): Promise<CoreAmount>;
  getTotalRewards(): Promise<CoreAmount>;
  broadcastRawTransaction(transaction: string): Promise<string>;
  getSpendableBalance(operationType: number): Promise<CoreAmount>;
  hasAsset(address: string, assetId: string): Promise<boolean>;
  isAmountValid(address: string, amount: string): Promise<boolean>;
}

declare class CoreAlgorandOperation {
  getTransaction(): Promise<CoreAlgorandTransaction>;
  getAlgorandOperationType(): Promise<number>;
  getAssetAmount(): Promise<string>;
  getRewards(): Promise<string>;
}

export type CoreCurrencySpecifics = Record<string, never>;

export type AlgorandResources = {
  rewards: BigNumber;
  // Ledger Live only supports a limited list of ASA (defined here https://github.com/LedgerHQ/ledgerjs/blob/master/packages/cryptoassets/data/asa.js)
  // This is the actual number of ASA opted-in for the Algo account
  nbAssets: number;
};
export type AlgorandResourcesRaw = {
  rewards: string;
  nbAssets: number;
};
export type AlgorandOperationMode = "send" | "optIn" | "claimReward";
export type {
  CoreAlgorandOperation,
  CoreAlgorandAccount,
  CoreAlgorandTransaction,
};
export type AlgorandTransaction = TransactionCommon & {
  family: "algorand";
  mode: AlgorandOperationMode;
  fees: BigNumber | null | undefined;
  assetId: string | null | undefined;
  memo: string | null | undefined;
};
export type AlgorandTransactionRaw = TransactionCommonRaw & {
  family: "algorand";
  mode: AlgorandOperationMode;
  fees: string | null | undefined;
  assetId: string | null | undefined;
  memo: string | null | undefined;
};
export type Transaction = AlgorandTransaction;
export type TransactionRaw = AlgorandTransactionRaw;
export type AlgorandOperation = Operation & {
  extra: AlgorandExtraTxInfo;
};
export type AlgorandOperationRaw = OperationRaw & {
  extra: AlgorandExtraTxInfo;
};
export type AlgorandExtraTxInfo = {
  rewards?: BigNumber;
  memo?: string;
  assetId?: string;
};
export const reflect = (
  declare: (arg0: string, arg1: Spec) => void
): {
  OperationMethods: {
    asAlgorandOperation: {
      returns: "AlgorandOperation";
    };
  };
  AccountMethods: {
    asAlgorandAccount: {
      returns: "AlgorandAccount";
    };
  };
} => {
  declare("AlgorandAccount", {
    methods: {
      createTransaction: {
        returns: "AlgorandTransaction",
      },
      broadcastRawTransaction: {
        params: ["hex"],
      },
      getFeeEstimate: {
        params: ["AlgorandTransaction"],
        returns: "Amount",
      },
      getAssetsBalances: {
        returns: ["AlgorandAssetAmount"],
      },
      getPendingRewards: {
        returns: "Amount",
      },
      getTotalRewards: {
        returns: "Amount",
      },
      getSpendableBalance: {
        returns: "Amount",
      },
      isAmountValid: {},
      hasAsset: {},
    },
  });
  declare("AlgorandAssetAmount", {
    njsUsesPlainObject: true,
    methods: {
      getAssetId: {
        njsField: "assetId",
      },
      getAmount: {
        njsField: "amount",
      },
    },
  });
  declare("AlgorandOperation", {
    methods: {
      getTransaction: {
        returns: "AlgorandTransaction",
      },
      getAlgorandOperationType: {},
      getAssetAmount: {},
      getRewards: {},
    },
  });
  declare("AlgorandTransaction", {
    methods: {
      getId: {},
      setSender: {},
      setFee: {},
      setNote: {},
      getType: {},
      setPaymentInfo: {
        params: ["AlgorandPaymentInfo"],
      },
      setAssetTransferInfo: {
        params: ["AlgorandAssetTransferInfo"],
      },
      serialize: {
        returns: "hex",
      },
      setSignature: {
        params: ["hex"],
      },
      getFee: {},
      getRound: {},
      getSender: {},
      getAssetTransferInfo: {
        returns: "AlgorandAssetTransferInfo",
      },
      getNote: {},
    },
  });
  declare("AlgorandPaymentInfo", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, null, null],
        returns: "AlgorandPaymentInfo",
        njsInstanciateClass: [
          {
            recipientAddress: 0,
            amount: 1,
            closeAddress: 2,
            closeAmount: 3,
          },
        ],
      },
    },
  });
  declare("AlgorandAddress", {
    statics: {
      fromPublicKey: {
        params: ["hex"],
        njsBuggyMethodIsNotStatic: true,
      },
    },
  });
  declare("AlgorandAssetTransferInfo", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, null, null, null, null],
        returns: "AlgorandAssetTransferInfo",
        njsInstanciateClass: [
          {
            assetId: 0,
            amount: 1,
            recipientAddress: 2,
            closeAddress: 3,
            clawedBackAddress: 4,
            closeAmount: 5,
          },
        ],
      },
    },
    methods: {
      getAssetId: {
        njsField: "assetId",
      },
      getAmount: {
        njsField: "amount",
      },
      getRecipientAddress: {
        njsField: "recipientAddress",
      },
      getCloseAddress: {
        njsField: "closeAddress",
      },
      getCloseAmount: {
        njsField: "closeAmount",
      },
    },
  });
  return {
    OperationMethods: {
      asAlgorandOperation: {
        returns: "AlgorandOperation",
      },
    },
    AccountMethods: {
      asAlgorandAccount: {
        returns: "AlgorandAccount",
      },
    },
  };
};
