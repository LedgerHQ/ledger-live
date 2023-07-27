import eip55 from "eip55";
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
  LedgerExplorerOperation,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerER1155TransferEvent,
} from "../types";

/**
 * Adapter to convert a Ledger Explorer operation
 * into Ledger Live Operations
 */
export const ledgerOperationToOperations = (
  accountId: string,
  ledgerOp: LedgerExplorerOperation,
): Operation[] => {
  const { xpubOrAddress: address } = decodeAccountId(accountId);
  const checksummedAddress = eip55.encode(address);
  const from = eip55.encode(ledgerOp.from);
  const to = eip55.encode(ledgerOp.to);
  const value = new BigNumber(ledgerOp.value);
  const fee = new BigNumber(ledgerOp.gas_used).times(new BigNumber(ledgerOp.gas_price));
  const hasFailed = !ledgerOp.status;
  const date = new Date(ledgerOp.block.time);
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push(value.eq(0) ? "FEES" : "OUT");
  }
  if (!types.length) {
    types.push("NONE");
  }

  return types.map(
    type =>
      ({
        id: encodeOperationId(accountId, ledgerOp.hash, type),
        hash: ledgerOp.hash,
        type: type,
        value: type === "OUT" || type === "FEES" ? value.plus(fee) : hasFailed ? fee : value,
        fee,
        senders: [from],
        recipients: [to],
        blockHeight: ledgerOp.block.height,
        blockHash: ledgerOp.block.hash,
        transactionSequenceNumber: ledgerOp.nonce_value,
        accountId: accountId,
        date,
        subOperations: [],
        nftOperations: [],
        hasFailed,
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC20 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC20EventToOperations = (
  coinOperation: Operation,
  event: LedgerExplorerERC20TransferEvent,
  index = 0,
): Operation[] => {
  const { accountId, hash, fee, blockHeight, blockHash, transactionSequenceNumber, date } =
    coinOperation;
  const { currencyId, xpubOrAddress: address } = decodeAccountId(accountId);
  const tokenCurrency = findTokenByAddressInCurrency(event.contract, currencyId);
  if (!tokenCurrency) return [];

  const tokenAccountId = encodeTokenAccountId(accountId, tokenCurrency);
  const from = eip55.encode(event.from);
  const to = eip55.encode(event.to);
  const checksummedAddress = eip55.encode(address);
  const value = new BigNumber(event.count);
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
        id: encodeSubOperationId(tokenAccountId, hash, type, index),
        hash: hash,
        type: type,
        value,
        fee: fee,
        senders: [from],
        recipients: [to],
        contract: tokenCurrency.contractAddress,
        blockHeight: blockHeight,
        blockHash: blockHash,
        transactionSequenceNumber: transactionSequenceNumber,
        accountId: tokenAccountId,
        date,
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC721 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC721EventToOperations = (
  coinOperation: Operation,
  event: LedgerExplorerER721TransferEvent,
  index = 0,
): Operation[] => {
  const { hash, fee, blockHeight, blockHash, transactionSequenceNumber, date, accountId } =
    coinOperation;
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);
  const { token_id: tokenId } = event;

  const from = eip55.encode(event.sender);
  const to = eip55.encode(event.receiver);
  const checksummedAddress = eip55.encode(address);
  const value = new BigNumber(1); // value is representing the number of NFT transfered. ERC721 are always sending 1 NFT per transaction
  const contract = eip55.encode(event.contract);
  const nftId = encodeNftId(accountId, contract, tokenId, currencyId);
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
        id: encodeERC721OperationId(nftId, hash, type, index),
        hash,
        type: type,
        fee: fee,
        senders: [from],
        recipients: [to],
        blockHeight,
        blockHash,
        transactionSequenceNumber,
        accountId,
        standard: "ERC721",
        contract,
        tokenId,
        value,
        date,
        extra: {},
      } as Operation),
  );
};

/**
 * Adapter to convert an ERC1155 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC1155EventToOperations = (
  coinOperation: Operation,
  event: LedgerExplorerER1155TransferEvent,
  index = 0,
): Operation[] => {
  const { hash, fee, blockHeight, blockHash, transactionSequenceNumber, date, accountId } =
    coinOperation;
  const { xpubOrAddress: address, currencyId } = decodeAccountId(accountId);
  const from = eip55.encode(event.sender);
  const to = eip55.encode(event.receiver);
  const checksummedAddress = eip55.encode(address);
  const contract = eip55.encode(event.contract);
  const types: OperationType[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return event.transfers.flatMap((transfer, transferIndex) => {
    const { id: tokenId, value: quantity } = transfer;
    const nftId = encodeNftId(accountId, contract, tokenId, currencyId);

    return types.map(
      type =>
        ({
          id: encodeERC1155OperationId(nftId, hash, type, index, transferIndex),
          hash,
          type,
          fee,
          senders: [from],
          recipients: [to],
          blockHeight,
          blockHash,
          transactionSequenceNumber,
          accountId,
          standard: "ERC1155",
          contract,
          tokenId,
          value: new BigNumber(quantity),
          date,
          extra: {},
        } as Operation),
    );
  });
};
