import type { BigNumber } from "bignumber.js";
import type {
  Account as WalletAccount,
  SerializedAccount as WalletAccountRaw,
} from "./wallet-btc";

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
  address: string | null | undefined;
  value: BigNumber | null | undefined;
  previousTxHash: string | null | undefined;
  previousOutputIndex: number;
};
export type BitcoinInputRaw = [
  string | null | undefined,
  string | null | undefined,
  string | null | undefined,
  number
];
export type BitcoinOutput = {
  hash: string;
  outputIndex: number;
  blockHeight: number | null | undefined;
  address: string | null | undefined;
  path: string | null | undefined; // DEPRECATED - used only by legacy libcore implementation
  value: BigNumber;
  rbf: boolean;
  isChange: boolean;
};
export type BitcoinOutputRaw = [
  string,
  number,
  number | null | undefined,
  string | null | undefined,
  string | null | undefined,
  string,
  number, // rbf 0/1 for compression
  number
];
export type BitcoinResources = {
  utxos: BitcoinOutput[];
  walletAccount?: WalletAccount;
};
export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[];
  walletAccount?: WalletAccountRaw;
};

export const initialBitcoinResourcesValue = {
  utxos: [],
};

export const BitcoinLikeFeePolicy = Object.freeze({
  PER_BYTE: "PER_BYTE",
  PER_KBYTE: "PER_KBYTE",
});

export const BitcoinLikeSigHashType = Object.freeze({
  SIGHASH_ALL: 0x01,
  SIGHASH_NONE: 0x02,
  SIGHASH_SINGLE: 0x03,
  SIGHASH_FORKID: 0x40,
  SIGHASH_ANYONECANPAY: 0x80,
});

export type BitcoinLikeNetworkParameters = {
  // Name of the network.
  identifier: string;
  // Version of the Pay To Public Hash standard.
  P2PKHVersion: Buffer;
  // Version of the Pay To Script Hash standard.
  P2SHVersion: Buffer;
  // Version of the Extended Public Key standard.
  xpubVersion: Buffer;
  // Policy to use when expressing fee amount, values in BitcoinLikeFeePolicy
  feePolicy: string;
  // Minimal amount a UTXO should have before being considered BTC dust.
  dustAmount: BigNumber;
  // Constant prefix to prepend all signature messages.
  messagePrefix: string;
  // Are transactions encoded with timestamp?
  usesTimestampedTransaction: boolean;
  // Delay applied to all timestamps. Used to debounce transactions.
  timestampDelay: BigNumber;
  // Bitcoin signature flag indicating what part of a transaction a signature signs, values in BitcoinLikeSigHashType
  sigHash: number;
  // Addition BIPs enabled for this network.
  additionalBIPs: string[];
};

export type FeeItem = {
  key: string;
  speed: string;
  feePerByte: BigNumber;
};
export type FeeItems = {
  items: FeeItem[];
  defaultFeePerByte: BigNumber;
  relayFee?: number;
};
export type FeeItemRaw = {
  key: string;
  speed: string;
  feePerByte: string;
};
export type FeeItemsRaw = {
  items: FeeItemRaw[];
  defaultFeePerByte: string;
};
export type NetworkInfo = {
  family: "bitcoin";
  feeItems: FeeItems;
};
export type NetworkInfoRaw = {
  family: "bitcoin";
  feeItems: FeeItemsRaw;
};
export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
};
export type BitcoinPickingStrategy =
  typeof bitcoinPickingStrategy[keyof typeof bitcoinPickingStrategy];
export type UtxoStrategy = {
  strategy: BitcoinPickingStrategy;
  pickUnconfirmedRBF: boolean;
  excludeUTXOs: Array<{
    hash: string;
    outputIndex: number;
  }>;
};
export type Transaction = TransactionCommon & {
  family: "bitcoin";
  utxoStrategy: UtxoStrategy;
  rbf: boolean;
  feePerByte: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "bitcoin";
  utxoStrategy: UtxoStrategy;
  rbf: boolean;
  feePerByte: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
};

// vvvvv DEPRECATED - used only by legacy libcore implementation vvvvv

declare class CoreBitcoinLikeInput {
  getPreviousTransaction(): Promise<string>;
  getPreviousTxHash(): Promise<string | null | undefined>;
  getPreviousOutputIndex(): Promise<number>;
  getValue(): Promise<CoreAmount | null | undefined>;
  getSequence(): Promise<number>;
  getDerivationPath(): Promise<CoreDerivationPath[]>;
  getAddress(): Promise<string | null | undefined>;
}

declare class CoreBitcoinLikeOutput {
  getTransactionHash(): Promise<string>;
  getOutputIndex(): Promise<number>;
  getValue(): Promise<CoreAmount>;
  getBlockHeight(): Promise<number | null | undefined>;
  getDerivationPath(): Promise<CoreDerivationPath | null | undefined>;
  getAddress(): Promise<string | null | undefined>;
  isReplaceable(): Promise<boolean>;
}

declare class CoreBitcoinLikeTransaction {
  getHash(): Promise<string>;
  getFees(): Promise<CoreAmount | null | undefined>;
  getInputs(): Promise<CoreBitcoinLikeInput[]>;
  getOutputs(): Promise<CoreBitcoinLikeOutput[]>;
  serializeOutputs(): Promise<string>;
  getTimestamp(): Promise<number | null | undefined>;
}

declare class CoreBitcoinLikeOperation {
  getTransaction(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreBitcoinLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  excludeUtxo(transactionHash: string, outputIndex: number): Promise<void>;
  pickInputs(arg0: number, arg1: number): Promise<void>;
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
  BitcoinLikeAccount: CoreBitcoinLikeAccount;
  BitcoinLikeInput: CoreBitcoinLikeInput;
  BitcoinLikeNetworkParameters: CoreBitcoinLikeNetworkParameters;
  BitcoinLikeOperation: CoreBitcoinLikeOperation;
  BitcoinLikeOutput: CoreBitcoinLikeOutput;
  BitcoinLikeTransaction: CoreBitcoinLikeTransaction;
  BitcoinLikeTransactionBuilder: CoreBitcoinLikeTransactionBuilder;
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
  asBitcoinLikeAccount(): Promise<CoreBitcoinLikeAccount>;
};
export type CoreOperationSpecifics = {
  asBitcoinLikeOperation(): Promise<CoreBitcoinLikeOperation>;
};
export type CoreCurrencySpecifics = {
  getBitcoinLikeNetworkParameters(): Promise<CoreBitcoinLikeNetworkParameters>;
};

export const reflect = (
  declare: (arg0: string, arg1: Spec) => void
): {
  OperationMethods: {
    asBitcoinLikeOperation: {
      returns: "BitcoinLikeOperation";
    };
  };
  AccountMethods: {
    asBitcoinLikeAccount: {
      returns: "BitcoinLikeAccount";
    };
  };
} => {
  declare("BitcoinLikeInput", {
    methods: {
      getPreviousTransaction: {
        returns: "hex",
      },
      getPreviousTxHash: {},
      getValue: {
        returns: "Amount",
      },
      getPreviousOutputIndex: {},
      getSequence: {},
      getDerivationPath: {
        returns: ["DerivationPath"],
      },
      getAddress: {},
    },
  });
  declare("BitcoinLikeOutput", {
    methods: {
      getTransactionHash: {},
      getOutputIndex: {},
      getValue: {
        returns: "Amount",
      },
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
      build: {
        returns: "BitcoinLikeTransaction",
      },
    },
  });
  declare("BitcoinLikeAccount", {
    methods: {
      getUTXO: {
        returns: ["BitcoinLikeOutput"],
      },
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
