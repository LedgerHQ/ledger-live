import type { BigNumber } from "bignumber.js";
import type { Unit } from "../../types";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import type { TransactionMode, ModeModule } from "./modules";
import type { Range, RangeRaw } from "../../range";
import type { CryptoCurrency } from "../../types";
import type { DerivationMode } from "../../derivation";

export type EthereumGasLimitRequest = {
  from?: string;
  to?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  amplifier: string;
};
export type NetworkInfo = {
  family: "ethereum";
  gasPrice: Range;
};
export type NetworkInfoRaw = {
  family: "ethereum";
  gasPrice: RangeRaw;
};
export type { TransactionMode, ModeModule };
export type Transaction = TransactionCommon & {
  family: "ethereum";
  mode: TransactionMode;
  nonce?: number;
  data?: Buffer;
  gasPrice: BigNumber | null | undefined;
  userGasLimit: BigNumber | null | undefined;
  estimatedGasLimit: BigNumber | null | undefined;
  feeCustomUnit: Unit | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  allowZeroAmount?: boolean;
  collection?: string;
  collectionName?: string;
  tokenIds?: string[];
  quantities?: BigNumber[];
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "ethereum";
  mode: TransactionMode;
  nonce?: number;
  data?: string;
  gasPrice: string | null | undefined;
  userGasLimit: string | null | undefined;
  estimatedGasLimit: string | null | undefined;
  feeCustomUnit: Unit | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  allowZeroAmount?: boolean;
  tokenIds?: string[];
  collection?: string;
  collectionName?: string;
  quantities?: string[];
};
export type TypedMessage = {
  types: {
    EIP712Domain: [
      {
        type: string;
        name: string;
      }
    ];
    [key: string]: [
      {
        type: string;
        name: string;
      }
    ];
  };
  primaryType: string;
  domain: any;
  message: any;
  hashes: {
    domainHash: string;
    messageHash: string;
  };
};
export type TypedMessageData = {
  currency: CryptoCurrency;
  path: string;
  verify?: boolean;
  derivationMode: DerivationMode;
  message: TypedMessage;
  hashes: {
    stringHash: string;
  };
};
