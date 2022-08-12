import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712/EIP712.types";
import type { BigNumber } from "bignumber.js";
import type { TransactionMode, ModeModule } from "./modules";
import type { Range, RangeRaw } from "../../range";
import type { DerivationMode } from "../../derivation";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";

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
export type TypedMessageData = {
  currency: CryptoCurrency;
  path: string;
  verify?: boolean;
  derivationMode: DerivationMode;
  message: EIP712Message;
  hashes: {
    domainHash: string;
    messageHash: string;
  };
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
