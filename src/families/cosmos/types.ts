import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type { Operation, OperationRaw } from "../../types/operation";
import type { CoreAmount, CoreBigInt, Spec } from "../../libcore/types";
export type CoreStatics = {
  CosmosLikeOperation: CoreCosmosLikeOperation;
  CosmosLikeAddress: CoreCosmosLikeAddress;
  CosmosLikeTransactionBuilder: CoreCosmosLikeTransactionBuilder;
  CosmosLikeTransaction: CoreCosmosLikeTransaction;
  CosmosLikeMessage: CoreCosmosLikeMessage;
  CosmosLikeMsgWithdrawDelegationReward: CosmosMsgWithdrawDelegationReward;
  CosmosLikeAmount: CoreCosmosLikeAmount;
  CosmosLikeMsgSend: CosmosMsgSend;
  CosmosLikeMsgDelegate: CosmosMsgDelegate;
  CosmosLikeMsgUndelegate: CosmosMsgUndelegate;
  CosmosLikeMsgBeginRedelegate: CosmosMsgRedelegate;
  CosmosGasLimitRequest: CoreCosmosGasLimitRequest;
};
export type CoreAccountSpecifics = {
  asCosmosLikeAccount(): Promise<CoreCosmosLikeAccount>;
};
export type CoreOperationSpecifics = {
  asCosmosLikeOperation(): Promise<CoreCosmosLikeOperation>;
};
export type CoreCurrencySpecifics = Record<string, never>;
export type CosmosDelegationStatus =
  | "bonded" //  in the active set that generates rewards
  | "unbonding" // doesn't generate rewards. means the validator has been removed from the active set, but has its voting power "frozen" in case they misbehaved (just like a delegator undelegating). This last 21 days
  | "unbonded";
// doesn't generate rewards. means the validator has been removed from the active set for more than 21 days basically
export type CosmosDelegation = {
  validatorAddress: string;
  amount: BigNumber;
  pendingRewards: BigNumber;
  status: CosmosDelegationStatus;
};
export type CosmosRedelegation = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: BigNumber;
  completionDate: Date;
};
export type CosmosUnbonding = {
  validatorAddress: string;
  amount: BigNumber;
  completionDate: Date;
};
export type CosmosResources = {
  delegations: CosmosDelegation[];
  redelegations: CosmosRedelegation[];
  unbondings: CosmosUnbonding[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
  withdrawAddress: string;
};
export type CosmosDelegationRaw = {
  validatorAddress: string;
  amount: string;
  pendingRewards: string;
  status: CosmosDelegationStatus;
};
export type CosmosUnbondingRaw = {
  validatorAddress: string;
  amount: string;
  completionDate: string;
};
export type CosmosRedelegationRaw = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: string;
  completionDate: string;
};
export type CosmosResourcesRaw = {
  delegations: CosmosDelegationRaw[];
  redelegations: CosmosRedelegationRaw[];
  unbondings: CosmosUnbondingRaw[];
  delegatedBalance: string;
  pendingRewardsBalance: string;
  unbondingBalance: string;
  withdrawAddress: string;
};
// NB this must be serializable (no Date, no BigNumber)
export type CosmosValidatorItem = {
  validatorAddress: string;
  name: string;
  votingPower: number;
  // value from 0.0 to 1.0 (normalized percentage)
  commission: number;
  // value from 0.0 to 1.0 (normalized percentage)
  estimatedYearlyRewardsRate: number; // value from 0.0 to 1.0 (normalized percentage)
};
export type CosmosRewardsState = {
  targetBondedRatio: number;
  communityPoolCommission: number;
  assumedTimePerBlock: number;
  inflationRateChange: number;
  inflationMaxRate: number;
  inflationMinRate: number;
  actualBondedRatio: number;
  averageTimePerBlock: number;
  totalSupply: number;
  averageDailyFees: number;
  currentValueInflation: number;
};
// by convention preload would return a Promise of CosmosPreloadData
export type CosmosPreloadData = {
  validators: CosmosValidatorItem[];
};
export type CosmosOperationMode =
  | "send"
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "claimRewardCompound";
export type NetworkInfo = {
  family: "cosmos";
  fees: BigNumber;
};
export type NetworkInfoRaw = {
  family: "cosmos";
  fees: string;
};
export type CosmosOperation = Operation & {
  extra: CosmosExtraTxInfo;
};
export type CosmosOperationRaw = OperationRaw & {
  extra: CosmosExtraTxInfo;
};
export type CosmosExtraTxInfo = {
  validators?: CosmosDelegationInfo[];
  cosmosSourceValidator?: string | null | undefined;
  validator?: CosmosDelegationInfo;
};

export type CosmosDelegateTxInfo = {
  validators: CosmosDelegationInfo[];
};
export type CosmosUndelegateTxInfo = {
  validators: CosmosDelegationInfo[];
};
export type CosmosRedelegateTxInfo = {
  validators: CosmosDelegationInfo[];
  cosmosSourceValidator: string | null | undefined;
};
export type CosmosClaimRewardsTxInfo = {
  validator: CosmosDelegationInfo;
};
export type CosmosDelegationInfo = {
  address: string;
  amount: BigNumber;
};
export type CosmosDelegationInfoRaw = {
  address: string;
  amount: string;
};
export type CosmosMessage = CoreCosmosLikeMessage;

declare class CosmosMsgSend {
  init(
    fromAddress: string,
    toAddress: string,
    amount: CoreCosmosLikeAmount[]
  ): Promise<CosmosMsgSend>;
  fromAddress: string;
  toAddress: string;
  amount: Array<CoreCosmosLikeAmount>;
}

declare class CosmosMsgDelegate {
  init(
    delegatorAddress: string,
    validatorAddress: string,
    amount: CoreCosmosLikeAmount
  ): Promise<CosmosMsgDelegate>;
  getValidatorAddress(): Promise<string>;
  getAmount(): Promise<CosmosAmount>;
  delegatorAddress: string;
  validatorAddress: string;
  amount: CoreCosmosLikeAmount;
}

export type CosmosMsgUndelegate = CosmosMsgDelegate;
type CosmosAmount = {
  getAmount(): Promise<string>;
  amount: string;
  denom: string;
};

declare class CoreCosmosGasLimitRequest {
  init(
    memo: string,
    messages: CoreCosmosLikeMessage[],
    amplifier: string
  ): Promise<CoreCosmosGasLimitRequest>;
}

declare class CosmosMsgRedelegate {
  init(
    delegatorAddress: string,
    validatorSourceAddress: string,
    validatorDestinationAddress: string,
    amount: CoreCosmosLikeAmount
  ): Promise<CosmosMsgRedelegate>;
  getValidatorDestinationAddress(): Promise<string>;
  getValidatorSourceAddress(): Promise<string>;
  getAmount(): Promise<CosmosAmount>;
  delegatorAddress: string;
  validatorSourceAddress: string;
  validatorDestinationAddress: string;
  amount: CoreCosmosLikeAmount;
}

declare class CoreCosmosLikeAmount {
  init(amount: string, denom: string): Promise<CoreCosmosLikeAmount>;
  getAmount(): Promise<string>;
  amount: string;
  denom: string;
}

declare class CosmosMsgWithdrawDelegationReward {
  init(
    delegatorAddress: string,
    validatorAddress: string
  ): Promise<CosmosMsgWithdrawDelegationReward>;
  getValidatorAddress(): Promise<string>;
  delegatorAddress: string;
  validatorAddress: string;
}

type CosmosLikeEntry = {
  // Block height of the begin redelegate request
  getCreationHeight(): Promise<CoreBigInt>;
  // Timestamp of the redelegation completion
  getCompletionTime(): Date;
  // Balance requested to redelegate
  getInitialBalance(): Promise<CoreBigInt>;
  // Current amount being redelegated (i.e. less than initialBalance if slashed)
  getBalance(): Promise<CoreBigInt>;
};
export type CosmosLikeRedelegation = {
  getDelegatorAddress(): string;
  getSrcValidatorAddress(): string;
  getDstValidatorAddress(): string;
  getEntries(): CosmosLikeEntry[];
};
export type CosmosLikeUnbonding = {
  getDelegatorAddress(): string;
  getValidatorAddress(): string;
  getEntries(): CosmosLikeEntry[];
};
export type CosmosLikeDelegation = {
  getDelegatorAddress(): string;
  getValidatorAddress(): string;
  getDelegatedAmount(): CoreAmount;
};

declare class CoreCosmosLikeAddress {
  toBech32(): Promise<string>;
}

declare class CoreCosmosLikeOperation {
  getTransaction(): Promise<CoreCosmosLikeTransaction>;
  getMessage(): Promise<CoreCosmosLikeMessage>;
}

declare class CoreCosmosLikeMsgType {}

declare class CoreCosmosLikeMessage {
  getIndex(): Promise<string>;
  getMessageType(): Promise<CoreCosmosLikeMsgType>;
  getRawMessageType(): Promise<string>;
  wrapMsgSend(message: CosmosMsgSend): Promise<CoreCosmosLikeMessage>;
  wrapMsgDelegate(message: CosmosMsgDelegate): Promise<CoreCosmosLikeMessage>;
  wrapMsgUndelegate(
    message: CosmosMsgUndelegate
  ): Promise<CoreCosmosLikeMessage>;
  wrapMsgBeginRedelegate(
    message: CosmosMsgRedelegate
  ): Promise<CoreCosmosLikeMessage>;
  wrapMsgWithdrawDelegationReward(
    message: CosmosMsgWithdrawDelegationReward
  ): Promise<CoreCosmosLikeMessage>;
  unwrapMsgDelegate(msg: CosmosMessage): Promise<CosmosMsgDelegate>;
  unwrapMsgBeginRedelegate(msg: CosmosMessage): Promise<CosmosMsgRedelegate>;
  unwrapMsgUndelegate(msg: CosmosMessage): Promise<CosmosMsgUndelegate>;
  unwrapMsgWithdrawDelegationReward(
    msg: CosmosMessage
  ): Promise<CosmosMsgWithdrawDelegationReward>;
}

declare class CoreCosmosLikeTransactionBuilder {
  setMemo(memo: string): Promise<CoreCosmosLikeTransactionBuilder>;
  setSequence(sequence: string): Promise<CoreCosmosLikeTransactionBuilder>;
  setAccountNumber(
    accountNumber: string
  ): Promise<CoreCosmosLikeTransactionBuilder>;
  addMessage(
    message: CoreCosmosLikeMessage
  ): Promise<CoreCosmosLikeTransactionBuilder>;
  setFee(fees: CoreAmount): Promise<CoreCosmosLikeTransactionBuilder>;
  setGas(gas: CoreAmount): Promise<CoreCosmosLikeTransactionBuilder>;
  build(): Promise<CoreCosmosLikeTransaction>;
}

declare class CoreCosmosLikeTransaction {
  toRawTransaction(): string;
  toSignatureBase(): Promise<string>;
  getHash(): Promise<string>;
  getMemo(): Promise<string>;
  getFee(): Promise<CoreAmount>;
  getGas(): Promise<CoreAmount>;
  serializeForSignature(): Promise<string>;
  serializeForBroadcast(type: "block" | "async" | "sync"): Promise<string>;
  setSignature(arg0: string, arg1: string): Promise<void>;
  setDERSignature(arg0: string): Promise<void>;
}

declare class CosmosLikeReward {
  getDelegatorAddress(): string;
  getValidatorAddress(): string;
  getRewardAmount(): CoreAmount;
}

export type CosmosLikeValidator = {
  activeStatus: string;
  getActiveStatus(): Promise<string>;
};
export type CosmosBroadcastResponse = {
  code: number;
  raw_log: string;
  txhash: string;
};

declare class CoreCosmosLikeAccount {
  buildTransaction(): Promise<CoreCosmosLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
  broadcastTransaction(signed: string): Promise<string>;
  getEstimatedGasLimit(
    transaction: CoreCosmosLikeTransaction
  ): Promise<CoreBigInt>;
  estimateGas(request: CoreCosmosGasLimitRequest): Promise<CoreBigInt>;
  getBaseReserve(): Promise<CoreAmount>;
  isAddressActivated(address: string): Promise<boolean>;
  getSequence(): Promise<string>;
  getAccountNumber(): Promise<string>;
  getPendingRewards(): Promise<CosmosLikeReward[]>;
  getRedelegations(): Promise<CosmosLikeRedelegation[]>;
  getUnbondings(): Promise<CosmosLikeUnbonding[]>;
  getDelegations(): Promise<CosmosLikeDelegation[]>;
  getValidatorInfo(validatorAddress: string): Promise<CosmosLikeValidator>;
}

export type {
  CoreCosmosLikeAccount,
  CoreCosmosLikeAddress,
  CoreCosmosLikeOperation,
  CoreCosmosLikeTransaction,
  CoreCosmosLikeTransactionBuilder,
};
export type Transaction = TransactionCommon & {
  family: "cosmos";
  mode: CosmosOperationMode;
  networkInfo: NetworkInfo | null | undefined;
  fees: BigNumber | null | undefined;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
  cosmosSourceValidator: string | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "cosmos";
  mode: CosmosOperationMode;
  networkInfo: NetworkInfoRaw | null | undefined;
  fees: string | null | undefined;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
  cosmosSourceValidator: string | null | undefined;
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  validators?: Error;
  delegate?: Error;
  redelegation?: Error;
  unbonding?: Error;
  claimReward?: Error;
  feeTooHigh?: Error;
};

export type TransactionStatus = {
  errors: StatusErrorMap;
  warnings: StatusErrorMap;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
};

export type CosmosMappedDelegation = CosmosDelegation & {
  formattedAmount: string;
  formattedPendingRewards: string;
  rank: number;
  validator: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedUnbonding = CosmosUnbonding & {
  formattedAmount: string;
  validator: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedRedelegation = CosmosRedelegation & {
  formattedAmount: string;
  validatorSrc: CosmosValidatorItem | null | undefined;
  validatorDst: CosmosValidatorItem | null | undefined;
};
export type CosmosMappedDelegationInfo = CosmosDelegationInfo & {
  validator: CosmosValidatorItem | null | undefined;
  formattedAmount: string;
};
export type CosmosMappedValidator = {
  rank: number;
  validator: CosmosValidatorItem;
};
export type CosmosSearchFilter = (
  query: string
) => (delegation: CosmosMappedDelegation | CosmosMappedValidator) => boolean;
export const reflect = (
  declare: (arg0: string, arg1: Spec) => void
): {
  OperationMethods: {
    asCosmosLikeOperation: {
      returns: "CosmosLikeOperation";
    };
  };
  AccountMethods: {
    asCosmosLikeAccount: {
      returns: "CosmosLikeAccount";
    };
  };
} => {
  declare("CosmosLikeTransactionBuilder", {
    methods: {
      addMessage: {
        params: ["CosmosLikeMessage"],
      },
      build: {
        returns: "CosmosLikeTransaction",
      },
      setMemo: {},
      setSequence: {},
      setAccountNumber: {},
      setFee: {
        params: ["Amount"],
      },
      setGas: {
        params: ["Amount"],
      },
    },
  });
  declare("CosmosGasLimitRequest", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, ["CosmosLikeMessage"], null],
        returns: "CosmosGasLimitRequest",
        njsInstanciateClass: [
          {
            memo: 0,
            messages: 1,
            amplifier: 2,
          },
        ],
      },
    },
  });
  declare("CosmosLikeAccount", {
    methods: {
      estimateGas: {
        params: ["CosmosGasLimitRequest"],
        returns: "BigInt",
      },
      buildTransaction: {
        returns: "CosmosLikeTransactionBuilder",
      },
      broadcastRawTransaction: {},
      broadcastTransaction: {},
      getEstimatedGasLimit: {
        params: ["CosmosLikeTransaction"],
      },
      getSequence: {},
      getAccountNumber: {},
      getPendingRewards: {
        returns: ["CosmosLikeReward"],
      },
      getRedelegations: {
        returns: ["CosmosLikeRedelegation"],
      },
      getUnbondings: {
        returns: ["CosmosLikeUnbonding"],
      },
      getDelegations: {
        returns: ["CosmosLikeDelegation"],
      },
      getValidatorInfo: {
        returns: "CosmosLikeValidator",
      },
    },
  });
  declare("CosmosLikeValidator", {
    njsUsesPlainObject: true,
    methods: {
      getActiveStatus: {
        njsField: "activeStatus",
      },
    },
  });
  declare("CosmosLikeReward", {
    methods: {
      getDelegatorAddress: {},
      getValidatorAddress: {},
      getRewardAmount: {
        returns: "Amount",
      },
    },
  });
  declare("CosmosLikeUnbonding", {
    methods: {
      getDelegatorAddress: {},
      getValidatorAddress: {},
      getEntries: {
        returns: ["CosmosLikeUnbondingEntry"],
      },
    },
  });
  declare("CosmosLikeTransaction", {
    methods: {
      getHash: {},
      getMemo: {},
      setDERSignature: {
        params: ["hex"],
      },
      getFee: {
        returns: "Amount",
      },
      getGas: {
        returns: "Amount",
      },
      serializeForSignature: {},
      serializeForBroadcast: {},
    },
  });
  declare("CosmosLikeOperation", {
    methods: {
      getTransaction: {
        returns: "CosmosLikeTransaction",
      },
      getMessage: {
        returns: "CosmosLikeMessage",
      },
    },
  });
  declare("CosmosLikeRedelegationEntry", {
    methods: {
      getInitialBalance: {
        returns: "BigInt",
      },
      getCompletionTime: {},
    },
  });
  declare("CosmosLikeUnbondingEntry", {
    methods: {
      getInitialBalance: {
        returns: "BigInt",
      },
      getCompletionTime: {},
    },
  });
  declare("CosmosLikeRedelegation", {
    methods: {
      getDelegatorAddress: {
        returns: "string",
      },
      getSrcValidatorAddress: {
        returns: "string",
      },
      getDstValidatorAddress: {
        returns: "string",
      },
      getEntries: {
        returns: ["CosmosLikeRedelegationEntry"],
      },
    },
  });
  declare("CosmosLikeDelegation", {
    methods: {
      getDelegatorAddress: {},
      getValidatorAddress: {},
      getDelegatedAmount: {
        returns: "Amount",
      },
    },
  });
  declare("CosmosLikeMessage", {
    statics: {
      wrapMsgSend: {
        params: ["CosmosLikeMsgSend"],
        returns: "CosmosLikeMessage",
        njsBuggyMethodIsNotStatic: true,
      },
      wrapMsgDelegate: {
        params: ["CosmosLikeMsgDelegate"],
        returns: "CosmosLikeMessage",
        njsBuggyMethodIsNotStatic: true,
      },
      wrapMsgUndelegate: {
        params: ["CosmosLikeMsgUndelegate"],
        returns: "CosmosLikeMessage",
        njsBuggyMethodIsNotStatic: true,
      },
      wrapMsgBeginRedelegate: {
        params: ["CosmosLikeMsgBeginRedelegate"],
        returns: "CosmosLikeMessage",
        njsBuggyMethodIsNotStatic: true,
      },
      wrapMsgWithdrawDelegationReward: {
        params: ["CosmosLikeMsgWithdrawDelegationReward"],
        returns: "CosmosLikeMessage",
        njsBuggyMethodIsNotStatic: true,
      },
      unwrapMsgDelegate: {
        params: ["CosmosLikeMessage"],
        returns: "CosmosLikeMsgDelegate",
        njsBuggyMethodIsNotStatic: true,
      },
      unwrapMsgBeginRedelegate: {
        params: ["CosmosLikeMessage"],
        returns: "CosmosLikeMsgBeginRedelegate",
        njsBuggyMethodIsNotStatic: true,
      },
      unwrapMsgUndelegate: {
        params: ["CosmosLikeMessage"],
        returns: "CosmosLikeMsgUndelegate",
        njsBuggyMethodIsNotStatic: true,
      },
      unwrapMsgWithdrawDelegationReward: {
        params: ["CosmosLikeMessage"],
        returns: "CosmosLikeMsgWithdrawDelegationReward",
        njsBuggyMethodIsNotStatic: true,
      },
    },
    methods: {
      getMessageType: {},
      getRawMessageType: {},
      getIndex: {},
    },
  });
  declare("CosmosLikeAmount", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null],
        returns: "CosmosLikeAmount",
        njsInstanciateClass: [
          {
            amount: 0,
            denom: 1,
          },
        ],
      },
    },
    methods: {
      getAmount: {
        njsField: "amount",
      },
    },
  });
  declare("CosmosLikeMsgSend", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, ["CosmosLikeAmount"]],
        returns: "CosmosLikeMsgSend",
        njsInstanciateClass: [
          {
            fromAddress: 0,
            toAddress: 1,
            amount: 2,
          },
        ],
      },
    },
  });
  declare("CosmosLikeMsgDelegate", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, "CosmosLikeAmount"],
        returns: "CosmosLikeMsgDelegate",
        njsInstanciateClass: [
          {
            delegatorAddress: 0,
            validatorAddress: 1,
            amount: 2,
          },
        ],
      },
    },
    methods: {
      getValidatorAddress: {
        njsField: "validatorAddress",
      },
      getAmount: {
        njsField: "amount",
        returns: "CosmosLikeAmount",
      },
    },
  });
  declare("CosmosLikeMsgBeginRedelegate", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, null, "CosmosLikeAmount"],
        returns: "CosmosLikeMsgBeginRedelegate",
        njsInstanciateClass: [
          {
            delegatorAddress: 0,
            validatorSourceAddress: 1,
            validatorDestinationAddress: 2,
            amount: 3,
          },
        ],
      },
    },
    methods: {
      getValidatorDestinationAddress: {
        njsField: "validatorDestinationAddress",
      },
      getValidatorSourceAddress: {
        njsField: "validatorSourceAddress",
      },
      getAmount: {
        njsField: "amount",
        returns: "CosmosLikeAmount",
      },
    },
  });
  declare("CosmosLikeMsgUndelegate", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null, "CosmosLikeAmount"],
        returns: "CosmosLikeMsgUndelegate",
        njsInstanciateClass: [
          {
            delegatorAddress: 0,
            validatorAddress: 1,
            amount: 2,
          },
        ],
      },
    },
    methods: {
      getValidatorAddress: {
        njsField: "validatorAddress",
      },
      getAmount: {
        njsField: "amount",
        returns: "CosmosLikeAmount",
      },
    },
  });
  declare("CosmosLikeMsgWithdrawDelegationReward", {
    njsUsesPlainObject: true,
    statics: {
      init: {
        params: [null, null],
        returns: "CosmosLikeMsgWithdrawDelegationReward",
        njsInstanciateClass: [
          {
            delegatorAddress: 0,
            validatorAddress: 1,
          },
        ],
      },
    },
    methods: {
      getDelegatorAddress: {
        njsField: "delegatorAddress",
      },
      getValidatorAddress: {
        njsField: "validatorAddress",
      },
    },
  });
  return {
    OperationMethods: {
      asCosmosLikeOperation: {
        returns: "CosmosLikeOperation",
      },
    },
    AccountMethods: {
      asCosmosLikeAccount: {
        returns: "CosmosLikeAccount",
      },
    },
  };
};
