import BigNumber from "bignumber.js";
import {
  ProtoNFT,
  ProtoNFTRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type EvmTransactionMode = "send" | "erc721" | "erc1155";

export type EvmTransactionBase = TransactionCommon & {
  family: "evm";
  mode: EvmTransactionMode;
  // transaction number, relative to the account. used to sequence transactions
  nonce: number;
  // maximum of gas (as unit of computation) used by the transaction
  gasLimit: BigNumber;
  // custom gas limit manually set by the user overriding the gasLimit
  customGasLimit?: BigNumber;
  // id of the blockchain to use (used at the signature level for EIP-155)
  chainId: number;
  // buffer of the calldata that will be used by the smart contract
  data?: Buffer | null;
  // type of the transaction (will determine if transaction is a legacy transaction or an EIP-1559 one)
  type?: number;
  // additional fees can be expected on some Layer 2 chains.
  // It's an additional cost to take into account while estimating the cost of the tx.
  additionalFees?: BigNumber;
  // available gas options for the transaction, used to display sensible default fees choices to the user
  gasOptions?: GasOptions;
  // additional informations related to an NFT in order to craft the real evm transaction at `signOperation` level
  nft?: EvmTransactionNftParam;
};

// Send mode transactions are used for coin transactions & token transactions (erc20)
type EvmSendTransaction = EvmTransactionBase & {
  mode: "send";
  nft?: never;
};

// NFT transactions are used for ERC721 & ERC1155 transactions
export type EvmNftTransaction = EvmTransactionBase & {
  mode: "erc721" | "erc1155";
  nft: EvmTransactionNftParam;
};

// Once the kind of transaction defined, we still need to "type" it
// regarding EVM standards (@see https://eips.ethereum.org/EIPS/eip-2718)
type EvmTransactionUntyped = EvmSendTransaction | EvmNftTransaction;

// Legacy transaction types are type 0 & 1
// (type 1 is not creating breaking changes, but we're not supporting the feature implied by this new type as of today)
// (@see https://eips.ethereum.org/EIPS/eip-2930)
export type EvmTransactionLegacy = EvmTransactionUntyped & {
  type?: 0 | 1;
  gasPrice: BigNumber;
  maxPriorityFeePerGas?: never;
  maxFeePerGas?: never;
};

// Transactions type 2 are transaction supporting the new fee system
// applied with the EIP-1559, introducing new keys for fees and
// removing gasPrice.
// (@see https://eips.ethereum.org/EIPS/eip-1559)
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
  customGasLimit?: string;
  chainId: number;
  data?: string | null;
  type?: number;
  additionalFees?: string;
  nft?: EvmTransactionNftParamRaw;
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
  type?: 0 | 1;
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

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type FeeHistory = {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: string[][];
};

export type FeeData = {
  maxFeePerGas: null | BigNumber;
  maxPriorityFeePerGas: null | BigNumber;
  gasPrice: null | BigNumber;
  // only used by UI send flow in advanced mode for EIP-1559
  nextBaseFee: null | BigNumber;
};

export type GasOptions = {
  [key in "slow" | "medium" | "fast"]: FeeData;
};

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
