// @flow

import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type {
  CoreBigInt,
  CoreAmount,
  CoreDerivationPath,
  Spec,
} from "../../libcore/types";

export type BitcoinInput = {
  address: ?string,
  value: ?BigNumber,
  previousTxHash: ?string,
  previousOutputIndex: number,
};

export type BitcoinInputRaw = [?string, ?string, ?string, number];

export type BitcoinOutput = {
  hash: string,
  outputIndex: number,
  blockHeight: ?number,
  address: ?string,
  path: ?string,
  value: BigNumber,
  rbf: boolean,
};

export type BitcoinOutputRaw = [
  string,
  number,
  ?number,
  ?string,
  ?string,
  string,
  number // rbf 0/1 for compression
];

export type BitcoinResources = {
  utxos: BitcoinOutput[],
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[],
};

declare class CoreBitcoinLikeInput {
  getPreviousTransaction(): Promise<string>;
  getPreviousTxHash(): Promise<?string>;
  getPreviousOutputIndex(): Promise<number>;
  getValue(): Promise<?CoreAmount>;
  getSequence(): Promise<number>;
  getDerivationPath(): Promise<CoreDerivationPath[]>;
  getAddress(): Promise<?string>;
}

declare class CoreBitcoinLikeOutput {
  getTransactionHash(): Promise<string>;
  getOutputIndex(): Promise<number>;
  getValue(): Promise<CoreAmount>;
  getBlockHeight(): Promise<?number>;
  getDerivationPath(): Promise<?CoreDerivationPath>;
  getAddress(): Promise<?string>;
  isReplaceable(): Promise<boolean>;
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

declare class CoreBitcoinLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  excludeUtxo(transactionHash: string, outputIndex: number): Promise<void>;
  pickInputs(number, number): Promise<void>;
  setFeesPerByte(feesPerByte: CoreAmount): Promise<void>;
  build(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreBitcoinLikeAccount {
  getUTXO(from: number, to: number): Promise<CoreBitcoinLikeOutput[]>;
  getUTXOCount(): Promise<number>;
  buildTransaction(
    isPartial: boolean
  ): Promise<CoreBitcoinLikeTransactionBuilder>;
  broadcastRawTransaction(signed: string): Promise<string>;
  getFees(): Promise<CoreBigInt[]>;
}

declare class CoreBitcoinLikeNetworkParameters {
  getSigHash(): Promise<string>;
  getUsesTimestampedTransaction(): Promise<boolean>;
}

export type CoreStatics = {
  BitcoinLikeAccount: Class<CoreBitcoinLikeAccount>,
  BitcoinLikeInput: Class<CoreBitcoinLikeInput>,
  BitcoinLikeNetworkParameters: Class<CoreBitcoinLikeNetworkParameters>,
  BitcoinLikeOperation: Class<CoreBitcoinLikeOperation>,
  BitcoinLikeOutput: Class<CoreBitcoinLikeOutput>,
  BitcoinLikeTransaction: Class<CoreBitcoinLikeTransaction>,
  BitcoinLikeTransactionBuilder: Class<CoreBitcoinLikeTransactionBuilder>,
};

export type {
  CoreBitcoinLikeAccount,
  CoreBitcoinLikeInput,
  CoreBitcoinLikeNetworkParameters,
  CoreBitcoinLikeOperation,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeTransactionBuilder,
};

export type CoreAccountSpecifics = {
  asBitcoinLikeAccount(): Promise<CoreBitcoinLikeAccount>,
};

export type CoreOperationSpecifics = {
  asBitcoinLikeOperation(): Promise<CoreBitcoinLikeOperation>,
};

export type CoreCurrencySpecifics = {
  getBitcoinLikeNetworkParameters(): Promise<CoreBitcoinLikeNetworkParameters>,
};

export type FeeItem = {
  key: string,
  speed: string,
  feePerByte: BigNumber,
};

export type FeeItems = {
  items: FeeItem[],
  defaultFeePerByte: BigNumber,
};

export type FeeItemRaw = {
  key: string,
  speed: string,
  feePerByte: string,
};

export type FeeItemsRaw = {
  items: FeeItemRaw[],
  defaultFeePerByte: string,
};

export type NetworkInfo = {|
  family: "bitcoin",
  feeItems: FeeItems,
|};

export type NetworkInfoRaw = {|
  family: "bitcoin",
  feeItems: FeeItemsRaw,
|};

export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
};

export type BitcoinPickingStrategy = $Values<typeof bitcoinPickingStrategy>;

export type UtxoStrategy = {
  strategy: BitcoinPickingStrategy,
  pickUnconfirmedRBF: boolean,
  excludeUTXOs: Array<{
    hash: string,
    outputIndex: number,
  }>,
};

export type Transaction = {|
  ...TransactionCommon,
  family: "bitcoin",
  utxoStrategy: UtxoStrategy,
  rbf: boolean,
  feePerByte: ?BigNumber,
  networkInfo: ?NetworkInfo,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "bitcoin",
  utxoStrategy: UtxoStrategy,
  rbf: boolean,
  feePerByte: ?string,
  networkInfo: ?NetworkInfoRaw,
|};

export const reflect = (declare: (string, Spec) => void) => {
  declare("BitcoinLikeInput", {
    methods: {
      getPreviousTransaction: {
        returns: "hex",
      },
      getPreviousTxHash: {},
      getValue: { returns: "Amount" },
      getPreviousOutputIndex: {},
      getSequence: {},
      getDerivationPath: { returns: ["DerivationPath"] },
      getAddress: {},
    },
  });

  declare("BitcoinLikeOutput", {
    methods: {
      getTransactionHash: {},
      getOutputIndex: {},
      getValue: { returns: "Amount" },
      getBlockHeight: {},
      getDerivationPath: {
        returns: "DerivationPath",
      },
      getAddress: {},
      isReplaceable: {},
    },
  });

  declare("BitcoinLikeTransaction", {
    methods: {
      getHash: {},
      getFees: {
        returns: "Amount",
      },
      getInputs: {
        returns: ["BitcoinLikeInput"],
      },
      getOutputs: {
        returns: ["BitcoinLikeOutput"],
      },
      serializeOutputs: {
        returns: "hex",
      },
      getTimestamp: {},
    },
  });

  declare("BitcoinLikeOperation", {
    methods: {
      getTransaction: {
        returns: "BitcoinLikeTransaction",
      },
    },
  });

  declare("BitcoinLikeTransactionBuilder", {
    methods: {
      wipeToAddress: {},
      sendToAddress: {
        params: ["Amount"],
      },
      excludeUtxo: {},
      pickInputs: {},
      setFeesPerByte: {
        params: ["Amount"],
      },
      build: { returns: "BitcoinLikeTransaction" },
    },
  });

  declare("BitcoinLikeAccount", {
    methods: {
      getUTXO: { returns: ["BitcoinLikeOutput"] },
      getUTXOCount: {},
      buildTransaction: {
        returns: "BitcoinLikeTransactionBuilder",
      },
      broadcastRawTransaction: {
        params: ["hex"],
      },
      getFees: {
        returns: ["BigInt"],
      },
    },
  });

  declare("BitcoinLikeNetworkParameters", {
    njsUsesPlainObject: true,
    methods: {
      getSigHash: {
        returns: "hex",
        njsField: "SigHash",
      },
      getUsesTimestampedTransaction: {
        njsField: "UsesTimestampedTransaction",
      },
    },
  });

  return {
    OperationMethods: {
      asBitcoinLikeOperation: {
        returns: "BitcoinLikeOperation",
      },
    },
    AccountMethods: {
      asBitcoinLikeAccount: {
        returns: "BitcoinLikeAccount",
      },
    },
  };
};
