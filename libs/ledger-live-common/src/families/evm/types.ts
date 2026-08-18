import {
  ProtoNFT,
  ProtoNFTRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { GasOptions, GasOptionsRaw } from "@ledgerhq/coin-evm/types/index";

export type EvmTransactionMode = "send" | "erc721" | "erc1155";

export type EvmTransactionNftParam = {
  tokenId: ProtoNFT["tokenId"];
  contract: ProtoNFT["contract"];
  quantity: ProtoNFT["amount"];
  collectionName: string;
};

type EvmTransactionNftParamRaw = {
  tokenId: ProtoNFTRaw["tokenId"];
  contract: ProtoNFTRaw["contract"];
  quantity: ProtoNFTRaw["amount"];
  collectionName: string;
};

export type EvmTransactionBase = TransactionCommon & {
  family: "evm";
  mode: EvmTransactionMode;
  nonce: number;
  gasLimit: BigNumber;
  customGasLimit?: BigNumber | undefined;
  chainId: number;
  data?: Buffer | null | undefined;
  type?: number;
  additionalFees?: BigNumber | undefined;
  gasOptions?: GasOptions;
  nft?: EvmTransactionNftParam;
  sponsored?: boolean;
};

type EvmSendTransaction = EvmTransactionBase & {
  mode: "send";
  nft?: never;
};

export type EvmNftTransaction = EvmTransactionBase & {
  mode: "erc721" | "erc1155";
  nft: EvmTransactionNftParam;
};

type EvmTransactionUntyped = EvmSendTransaction | EvmNftTransaction;

export type EvmTransactionLegacy = EvmTransactionUntyped & {
  type?: 0 | 1;
  gasPrice: BigNumber;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559 = EvmTransactionUntyped & {
  type: 2;
  gasPrice?: never;
  maxPriorityFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
};

export type Transaction = EvmTransactionLegacy | EvmTransactionEIP1559;

type EvmTransactionBaseRaw = TransactionCommonRaw & {
  family: "evm";
  mode: EvmTransactionMode;
  nonce: number;
  gasLimit: string;
  customGasLimit?: string | undefined;
  assetReference?: string | null | undefined;
  assetOwner?: string | null | undefined;
  chainId: number;
  data?: string | null | undefined;
  type?: number | undefined;
  additionalFees?: string | undefined;
  gasOptions?: GasOptionsRaw;
  nft?: EvmTransactionNftParamRaw;
  sponsored?: boolean;
};

type EvmSendTransactionRaw = EvmTransactionBaseRaw & {
  mode: "send";
  nft?: never;
};

export type EvmNftTransactionRaw = EvmTransactionBaseRaw & {
  mode: "erc721" | "erc1155";
  nft: EvmTransactionNftParamRaw;
};

type EvmTransactionUntypedRaw = EvmSendTransactionRaw | EvmNftTransactionRaw;

export type EvmTransactionLegacyRaw = EvmTransactionUntypedRaw & {
  type?: 0 | 1 | undefined;
  gasPrice: string;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

export type EvmTransactionEIP1559Raw = EvmTransactionUntypedRaw & {
  type: 2;
  gasPrice?: never;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

export type TransactionRaw = EvmTransactionLegacyRaw | EvmTransactionEIP1559Raw;

export type TransactionStatus = TransactionStatusCommon & {
  totalFees: BigNumber;
};

export type TransactionStatusRaw = TransactionStatusCommonRaw & {
  totalFees: string;
};
