// TODO Remove dependency to `"@ledgerhq/types-live"` once
// the legacy bridge is deleted
import { decodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { encodeOperationId, encodeSubOperationId } from "@ledgerhq/coin-framework/operation";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { detectEvmStakingOperationType } from "../staking/detectOperationType";
import {
  EtherscanOperation,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanERC1155Event,
  EtherscanInternalTransaction,
} from "../types";
import { safeEncodeEIP55 } from "../utils";

/**
 * Helper to safely convert a value to BigNumber, defaulting to 0 if invalid.
 * Some explorers (e.g., Blockscout on Optimism) may return empty strings or
 * undefined for gasPrice/gasUsed on L2 transactions with special gas handling.
 */
export const safeBigNumber = (value: string | undefined): BigNumber => {
  if (!value) {
    return new BigNumber(0);
  }
  const bn = new BigNumber(value);
  return bn.isNaN() ? new BigNumber(0) : bn;
};

/**
 * Adapter to convert an Etherscan operation into Ledger Live Operations.
 * It can return more than one operation in case of self-send
 */
export const etherscanOperationToOperations = (
  accountId: string,
  etherscanOp: EtherscanOperation,
): Operation[] => {
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(etherscanOp.from);
  const to = safeEncodeEIP55(etherscanOp.to);
  const value = safeBigNumber(etherscanOp.value);
  const fee = safeBigNumber(etherscanOp.gasUsed).times(safeBigNumber(etherscanOp.gasPrice));
  const hasFailed = etherscanOp.isError === "1";
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    const isContractInteraction = new RegExp(/0[xX][0-9a-fA-F]{8}/).test(etherscanOp.methodId); // 0x + 4 bytes selector
    const stakingType = detectEvmStakingOperationType(currencyId, to, etherscanOp.methodId);
    types.push(stakingType ?? (isContractInteraction ? "FEES" : "OUT"));
  }
  if (!types.length) {
    types.push("NONE");
  }

  const valueIncludesFees = ["OUT", "FEES", "DELEGATE", "UNDELEGATE", "REDELEGATE"];

  return types.map(type => {
    let operationValue: BigNumber = value;

    if (valueIncludesFees.includes(type) && hasFailed) {
      operationValue = fee;
    } else if (valueIncludesFees.includes(type)) {
      operationValue = value.plus(fee);
    }

    return {
      id: encodeOperationId(accountId, etherscanOp.hash, type),
      hash: etherscanOp.hash,
      type,
      value: operationValue,
      fee,
      senders: [from],
      recipients: [to],
      blockHeight: parseInt(etherscanOp.blockNumber, 10),
      blockHash: etherscanOp.blockHash,
      transactionSequenceNumber: new BigNumber(etherscanOp.nonce),
      accountId: accountId,
      date: new Date(parseInt(etherscanOp.timeStamp, 10) * 1000),
      subOperations: [],
      nftOperations: [],
      internalOperations: [],
      hasFailed,
      extra: {},
    } as Operation;
  });
};

/**
 * Adapter to convert an ERC20 transaction
 * on etherscan APIs into LL Operations
 * It can return up to 2 operations
 * in case of self-send or airdrop
 */
export const etherscanERC20EventToOperations = (
  accountId: string,
  event: EtherscanERC20Event,
  index = 0,
): Operation[] => {
  const { xpubOrAddress: address } = decodeAccountId(accountId);

  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const value = safeBigNumber(event.value);
  const fee = safeBigNumber(event.gasUsed).times(safeBigNumber(event.gasPrice));
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(
    type =>
      ({
        // NOTE Bridge implementations replace property `id`
        id: encodeSubOperationId(accountId, event.hash, type, index),
        hash: event.hash,
        type,
        value,
        fee,
        senders: [from],
        recipients: [to],
        contract: eip55.encode(event.contractAddress),
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: new BigNumber(event.nonce),
        // NOTE Bridge implementations replace property `accountId`
        // TODO Remove property once the legacy bridge is deleted
        accountId,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      }) as Operation,
  );
};

/**
 * Adapter to convert an ERC721 transaction
 * on etherscan APIs into LL Operations
 * It can return up to 2 operations
 * in case of self-send or airdrop
 */
export const etherscanERC721EventToOperations = (
  accountId: string,
  event: EtherscanERC721Event,
  index = 0,
): Operation[] => {
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);

  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const value = new BigNumber(1); // value is representing the number of NFT transfered. ERC721 are always sending 1 NFT per transaction
  const fee = safeBigNumber(event.gasUsed).times(safeBigNumber(event.gasPrice));
  const contract = eip55.encode(event.contractAddress);
  const nftId = encodeNftId(accountId, contract, event.tokenID, currencyId);
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeERC721OperationId(nftId, event.hash, type, index),
        hash: event.hash,
        type,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: new BigNumber(event.nonce),
        accountId,
        standard: "ERC721",
        contract,
        tokenId: event.tokenID,
        value,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      }) as Operation,
  );
};

/**
 * Adapter to convert an ERC1155 transaction
 * on etherscan APIs into LL Operations
 */
export const etherscanERC1155EventToOperations = (
  accountId: string,
  event: EtherscanERC1155Event,
  index = 0,
): Operation[] => {
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);

  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const value = safeBigNumber(event.tokenValue); // value is representing the number of NFT transfered.
  const fee = safeBigNumber(event.gasUsed).times(safeBigNumber(event.gasPrice));
  const contract = eip55.encode(event.contractAddress);
  const nftId = encodeNftId(accountId, contract, event.tokenID, currencyId);
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeERC1155OperationId(nftId, event.hash, type, index),
        hash: event.hash,
        type,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: new BigNumber(event.nonce),
        accountId,
        standard: "ERC1155",
        contract,
        tokenId: event.tokenID,
        value,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      }) as Operation,
  );
};

/**
 * Adapter to convert an internal transaction
 * on etherscan APIs into LL Operations
 */
export const etherscanInternalTransactionToOperations = (
  accountId: string,
  internalTx: EtherscanInternalTransaction,
  index = 0,
): Operation[] => {
  const { hash, blockNumber, timeStamp, isError } = internalTx;
  const { xpubOrAddress: address } = decodeAccountId(accountId);

  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(internalTx.from);
  const to = safeEncodeEIP55(internalTx.to);
  const value = safeBigNumber(internalTx.value);
  const types: OperationType[] = [];
  const hasFailed = isError === "1";

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeSubOperationId(accountId, hash, type, index),
        hash: hash,
        type,
        fee: new BigNumber(0), // unecessary as it's already contained in the fees of the main op
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(blockNumber, 10),
        blockHash: undefined, // not made directly available by etherscan, only blockNumber is provided
        accountId,
        value,
        date: new Date(parseInt(timeStamp, 10) * 1000),
        hasFailed,
        extra: {},
      }) as Operation,
  );
};
