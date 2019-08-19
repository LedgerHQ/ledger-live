// @flow

import type {
  CoreBigInt,
  CoreAmount,
  CoreDerivationPath,
  Spec
} from "../../libcore/types";

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

declare class CoreBitcoinLikeOperation {
  getTransaction(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreBitcoinLikeTransactionBuilder {
  wipeToAddress(address: string): Promise<void>;
  sendToAddress(amount: CoreAmount, recipient: string): Promise<void>;
  pickInputs(number, number): Promise<void>;
  setFeesPerByte(feesPerByte: CoreAmount): Promise<void>;
  build(): Promise<CoreBitcoinLikeTransaction>;
}

declare class CoreBitcoinLikeAccount {
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
  BitcoinLikeTransactionBuilder: Class<CoreBitcoinLikeTransactionBuilder>
};

export type {
  CoreBitcoinLikeAccount,
  CoreBitcoinLikeInput,
  CoreBitcoinLikeNetworkParameters,
  CoreBitcoinLikeOperation,
  CoreBitcoinLikeOutput,
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeTransactionBuilder
};

export type CoreAccountSpecifics = {
  asBitcoinLikeAccount(): Promise<CoreBitcoinLikeAccount>
};

export type CoreOperationSpecifics = {
  asBitcoinLikeOperation(): Promise<CoreBitcoinLikeOperation>
};

export type CoreCurrencySpecifics = {
  getBitcoinLikeNetworkParameters(): Promise<CoreBitcoinLikeNetworkParameters>
};

export const reflect = (declare: (string, Spec) => void) => {
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
      },
      getFees: {
        returns: ["BigInt"]
      }
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
};
