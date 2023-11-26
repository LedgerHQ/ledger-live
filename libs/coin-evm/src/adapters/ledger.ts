import { log } from "@ledgerhq/logs";
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
 * Some addresses returned by Ledger explorers are not 40 characters hex addresses
 * For example the explorers may return "0x0" as an address (for example for
 * some events or contract interactions, like a contract creation transaction)
 *
 * This is not a valid EIP55 address and thus will fail when trying to encode it
 * with a "Bad address" error.
 * cf:
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L5-L6
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L63-L65
 *
 * Since we can't control what the explorer returns, and we don't want the app to crash
 * in these cases, we simply ignore the address and return an empty string.
 *
 * For now this has only been observed on the from or to fields of an operation
 * so we only use this function for these fields.
 */
const safeEncodeEIP55 = (addr: string): string => {
  if (!addr || addr === "0x" || addr === "0x0") {
    return "";
  }

  try {
    return eip55.encode(addr);
  } catch (e) {
    log("EVM Family - adapters/ledger", "Failed to eip55 encode address", {
      address: addr,
      error: e,
    });
    return "";
  }
};

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
  const from = safeEncodeEIP55(ledgerOp.from);
  const to = safeEncodeEIP55(ledgerOp.to);
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
      }) as Operation,
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
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
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
      }) as Operation,
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

  const from = safeEncodeEIP55(event.sender);
  const to = safeEncodeEIP55(event.receiver);
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
      }) as Operation,
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
  const from = safeEncodeEIP55(event.sender);
  const to = safeEncodeEIP55(event.receiver);
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
        }) as Operation,
    );
  });
};
