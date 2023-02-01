import type { BigNumber } from "bignumber.js";
import { TransactionCommonRaw } from "./transaction";
import { NFTStandard } from "./nft";

/**
 *
 */
export type OperationType =
  | "IN"
  | "OUT"
  | "NONE"
  | "CREATE"
  | "REVEAL"
  // COSMOS
  | "DELEGATE"
  | "UNDELEGATE"
  | "REDELEGATE"
  | "REWARD"
  // TRON
  | "FEES"
  | "FREEZE"
  | "UNFREEZE"
  // POLKADOT
  | "VOTE"
  | "REWARD_PAYOUT"
  | "BOND"
  | "UNBOND"
  | "WITHDRAW_UNBONDED"
  | "SET_CONTROLLER"
  | "SLASH"
  | "NOMINATE"
  | "CHILL"
  // ETHEREUM
  | "APPROVE"
  // ALGORAND
  | "OPT_IN"
  | "OPT_OUT"
  // CELO
  | "LOCK"
  | "UNLOCK"
  | "WITHDRAW"
  | "REVOKE"
  | "ACTIVATE"
  | "REGISTER"
  // NFT
  | "NFT_IN"
  | "NFT_OUT"
  // NEAR
  | "STAKE"
  | "UNSTAKE"
  | "WITHDRAW_UNSTAKED";

/**
 *
 */
export type Operation = {
  // unique identifier (usually hash)
  id: string;
  // transaction hash
  hash: string;
  // the direction of the operation
  // IN when funds was received (means the related account is in the recipients)
  // OUT when funds was sent (means the related account is in the senders)
  // NONE means this is not an operation related to the account but exists because there is likely an internal transaction
  type: OperationType;
  // this is the atomic value of the operation. it is always positive (later will be a BigInt)
  // in "OUT" case, it includes the fees. in "IN" case, it excludes them.
  value: BigNumber;
  // fee of the transaction (in satoshi value)
  fee: BigNumber;
  // senders & recipients addresses
  senders: string[];
  recipients: string[];
  // if block* are null, the operation is not yet on the blockchain
  // the height of the block on the blockchain (number)
  blockHeight: number | null | undefined;
  // the hash of the block the operation is in
  blockHash: string | null | undefined;
  // if available, this is the sequence number of the transaction in blockchains (aka "nonce" in Ethereum)
  transactionSequenceNumber?: number;
  // the account id. available for convenient reason
  accountId: string;
  // --------------------------------------------- properties related to NFTs
  // the specification used for the transaction's event
  standard?: NFTStandard | string;
  // address of an account/contract that is approved to make the transfer
  operator?: string;
  // address of the contract/collection containing an NFT (tokenId)
  contract?: string;
  // Id of an NFT inside its collection/contract
  tokenId?: string;
  // --------------------------------------------- specific operation raw fields
  // transaction date
  date: Date;
  // Extra crypto specific fields
  extra: Record<string, any>;
  // Has the transaction actually failed? (some blockchain like ethereum will have failed tx appearing)
  hasFailed?: boolean;
  // in context of accounts that can have tokens, an operation can contains itself operations
  // these are not in raw at all because they are meant to be rebuilt from the references
  subOperations?: Operation[];
  // in context of accounts that have internal transactions that belong to a parent transaction
  // we have internal operations. Those are not included in the top level operations but can be presented to UI at that same level
  internalOperations?: Operation[];
  // Operations related to ERC721 | ERC1155 tokens
  nftOperations?: Operation[];
  transactionRaw?: TransactionCommonRaw;
};

/**
 *
 */
export type OperationRaw = {
  id: string;
  hash: string;
  type: OperationType;
  value: string;
  fee: string;
  senders: string[];
  recipients: string[];
  blockHeight: number | null | undefined;
  blockHash: string | null | undefined;
  transactionSequenceNumber?: number;
  accountId: string;
  hasFailed?: boolean;
  // --------------------------------------------- properties related to NFTs
  standard?: NFTStandard | string;
  operator?: string;
  contract?: string;
  tokenId?: string;
  // --------------------------------------------- specific operation raw fields
  date: string;
  extra: Record<string, any>;
  // would be a serializable version of the extra
  subOperations?: OperationRaw[];
  // in context of accounts that have internal transactions that belong to a parent transaction
  // we have internal operations. Those are not included in the top level operations but can be presented to UI at that same level
  internalOperations?: OperationRaw[];
  // Operations related to ERC721 | ERC1155 tokens
  nftOperations?: OperationRaw[];
  transactionRaw?: TransactionCommonRaw;
};

/**
 *
 */
export type DailyOperationsSection = {
  day: Date;
  data: Operation[];
};

/**
 *
 */
export type DailyOperations = {
  // operations grouped by day
  sections: DailyOperationsSection[];
  // Is the sections complete? means there is no more operations to pull
  completed: boolean;
};
