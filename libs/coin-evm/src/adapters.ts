import eip55 from "eip55";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import { decodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { encodeOperationId, encodeSubOperationId } from "@ledgerhq/coin-framework/operation";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  EtherscanOperation,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanERC1155Event,
} from "./types";

/**
 * Adapter to convert a Ledger Live transaction to an Ethers transaction
 */
export const transactionToEthersTransaction = (tx: EvmTransaction): ethers.Transaction => {
  const ethersTx = {
    to: tx.recipient,
    value: ethers.BigNumber.from(tx.amount.toFixed()),
    data: tx.data ? `0x${tx.data.toString("hex")}` : undefined,
    gasLimit: ethers.BigNumber.from(tx.gasLimit.toFixed()),
    nonce: tx.nonce,
    chainId: tx.chainId,
    type: tx.type,
  } as Partial<ethers.Transaction>;

  // is EIP-1559 transaction (type 2)
  if (tx.type === 2) {
    ethersTx.maxFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxFeePerGas.toFixed(),
    );
    ethersTx.maxPriorityFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxPriorityFeePerGas.toFixed(),
    );
  } else {
    // is Legacy transaction (type 0)
    ethersTx.gasPrice = ethers.BigNumber.from((tx as EvmTransactionLegacy).gasPrice.toFixed());
  }

  return ethersTx as ethers.Transaction;
};

/**
 * Adapter to convert an Etherscan-like operation into a Ledger Live Operation
 * It can return more than one operation in case of self-send
 */
export const etherscanOperationToOperations = (
  accountId: string,
  tx: EtherscanOperation,
): Operation[] => {
  const { xpubOrAddress: address } = decodeAccountId(accountId);
  const checksummedAddress = eip55.encode(address);
  const from = eip55.encode(tx.from);
  const to = tx.to ? eip55.encode(tx.to) : "";
  const value = new BigNumber(tx.value);
  const fee = new BigNumber(tx.gasUsed).times(new BigNumber(tx.gasPrice));
  const hasFailed = tx.isError === "1";
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push(tx.methodId === "0x" ? "OUT" : "FEES");
  }
  if (!types.length) {
    types.push("NONE");
  }

  return types.map(
    type =>
      ({
        id: encodeOperationId(accountId, tx.hash, type),
        hash: tx.hash,
        type: type,
        value: type === "OUT" || type === "FEES" ? value.plus(fee) : hasFailed ? fee : value,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(tx.blockNumber, 10),
        blockHash: tx.blockHash,
        transactionSequenceNumber: parseInt(tx.nonce, 10),
        accountId: accountId,
        date: new Date(parseInt(tx.timeStamp, 10) * 1000),
        subOperations: [],
        nftOperations: [],
        hasFailed,
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC20 transaction received
 * on etherscan-like APIs into an Operation
 * It can return more than one operation
 * in case of self-send or airdrop
 */
export const etherscanERC20EventToOperations = (
  accountId: string,
  event: EtherscanERC20Event,
  index = 0,
): Operation[] => {
  const { currencyId, xpubOrAddress: address } = decodeAccountId(accountId);
  const tokenCurrency = findTokenByAddressInCurrency(event.contractAddress, currencyId);
  if (!tokenCurrency) return [];

  const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency);
  const from = eip55.encode(event.from);
  const to = event.to ? eip55.encode(event.to) : "";
  const value = new BigNumber(event.value);
  const fee = new BigNumber(event.gasUsed).times(new BigNumber(event.gasPrice));
  const types: OperationType[] = [];

  if (event.contractAddress && to === eip55.encode(address)) {
    types.push("IN");
  }
  if (event.contractAddress && from === eip55.encode(address)) {
    types.push("OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeSubOperationId(tokenAccountId, event.hash, type, index),
        hash: event.hash,
        type: type,
        value,
        fee,
        senders: [from],
        recipients: [to],
        contract: tokenCurrency.contractAddress,
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: parseInt(event.nonce, 10),
        accountId: tokenAccountId,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC721 transaction received
 * on etherscan-like APIs into an Operation
 * It can return more than one operation
 * in case of self-send or airdrop
 */
export const etherscanERC721EventToOperations = (
  accountId: string,
  event: EtherscanERC721Event,
  index = 0,
): Operation[] => {
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);

  const from = eip55.encode(event.from);
  const to = event.to ? eip55.encode(event.to) : "";
  const value = new BigNumber(1); // value is representing the number of NFT transfered. ERC721 are always sending 1 NFT per transaction
  const fee = new BigNumber(event.gasUsed).times(new BigNumber(event.gasPrice));
  const contract = eip55.encode(event.contractAddress);
  const nftId = encodeNftId(accountId, contract, event.tokenID, currencyId);
  const types: OperationType[] = [];

  if (event.contractAddress && to === eip55.encode(address)) {
    types.push("NFT_IN");
  }
  if (event.contractAddress && from === eip55.encode(address)) {
    types.push("NFT_OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeERC721OperationId(nftId, event.hash, type, index),
        hash: event.hash,
        type: type,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: parseInt(event.nonce, 10),
        accountId,
        standard: "ERC721",
        contract,
        tokenId: event.tokenID,
        value,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC1155 transaction received
 * on etherscan-like APIs into an Operation
 */
export const etherscanERC1155EventToOperations = (
  accountId: string,
  event: EtherscanERC1155Event,
  index = 0,
): Operation[] => {
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);

  const from = eip55.encode(event.from);
  const to = event.to ? eip55.encode(event.to) : "";
  const value = new BigNumber(event.tokenValue); // value is representing the number of NFT transfered.
  const fee = new BigNumber(event.gasUsed).times(new BigNumber(event.gasPrice));
  const contract = eip55.encode(event.contractAddress);
  const nftId = encodeNftId(accountId, contract, event.tokenID, currencyId);
  const types: OperationType[] = [];

  if (event.contractAddress && to === eip55.encode(address)) {
    types.push("NFT_IN");
  }
  if (event.contractAddress && from === eip55.encode(address)) {
    types.push("NFT_OUT");
  }

  return types.map(
    type =>
      ({
        id: encodeERC1155OperationId(nftId, event.hash, type, index),
        hash: event.hash,
        type: type,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: parseInt(event.blockNumber, 10),
        blockHash: event.blockHash,
        transactionSequenceNumber: parseInt(event.nonce, 10),
        accountId,
        standard: "ERC1155",
        contract,
        tokenId: event.tokenID,
        value,
        date: new Date(parseInt(event.timeStamp, 10) * 1000),
        extra: {},
      } as Operation),
  );
};
