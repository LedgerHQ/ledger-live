import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
import eip55 from "eip55";
import type {
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerInternalTransaction,
  LedgerExplorerOperation,
} from "../types";
import { detectEvmStakingOperationType } from "../staking/detectOperationType";
import { safeBigInt, safeEncodeEIP55 } from "../utils";

/**
 * Adapter to convert a Ledger Explorer operation
 * into Ledger Live Operations
 */
export const ledgerOperationToOperations = (
  address: string,
  currencyId: string,
  ledgerOp: LedgerExplorerOperation,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(ledgerOp.from);
  const to = safeEncodeEIP55(ledgerOp.to);
  const input = ledgerOp.input ?? undefined;
  const methodId = input ? input.slice(0, 10) : undefined; // 0x + 4-byte selector
  const failed = !ledgerOp.status;
  const date = new Date(ledgerOp.block.time);
  const senders = from ? [from] : [];
  const recipients = to ? [to] : [];
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    // Recognize staking calls (delegate/undelegate/withdraw/reward) so they are not
    // collapsed into a generic FEES/OUT operation, mirroring the etherscan adapter.
    const stakingType = detectEvmStakingOperationType(currencyId, to, methodId);
    types.push(stakingType ?? (safeBigInt(ledgerOp.value) === 0n ? "FEES" : "OUT"));
  }
  if (!types.length) {
    types.push("NONE");
  }

  const feesPayer = senders.length === 1 ? senders[0] : undefined;

  // Value = transferred amount only (same whether tx failed or not); fee is separate. Ledger Wallet contract is applied by generic-coin-framework bridge.
  return types.map(type => ({
    id: `${address}-${ledgerOp.hash}-${type}`,
    type,
    senders,
    recipients,
    value: safeBigInt(ledgerOp.value),
    asset: { type: "native" },
    tx: {
      hash: ledgerOp.hash,
      block: {
        height: ledgerOp.block.height,
        hash: ledgerOp.block.hash,
        time: date,
      },
      fees: safeBigInt(ledgerOp.gas_used) * safeBigInt(ledgerOp.gas_price),
      date,
      failed,
      ...(feesPayer ? { feesPayer } : {}),
    },
    details: {
      sequence: ledgerOp.nonce_value,
    },
  }));
};

/**
 * Adapter to convert an ERC20 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC20EventToOperations = (
  address: string,
  coinOperation: Operation<MemoNotSupported>,
  event: LedgerExplorerERC20TransferEvent,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const contract = eip55.encode(event.contract);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(type => ({
    id: `${coinOperation.tx.hash}-erc20-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value: safeBigInt(event.count),
    asset: { type: "erc20", assetReference: contract, assetOwner: address },
    tx: coinOperation.tx,
    details: {
      ledgerOpType: type,
      assetAmount: event.count,
      assetSenders: from ? [from] : [],
      assetRecipients: to ? [to] : [],
    },
  }));
};

/**
 * Adapter to convert an ERC721 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC721EventToOperations = (
  address: string,
  coinOperation: Operation<MemoNotSupported>,
  event: LedgerExplorerER721TransferEvent,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.sender);
  const to = safeEncodeEIP55(event.receiver);
  const contract = eip55.encode(event.contract);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return types.map(type => ({
    id: `${coinOperation.tx.hash}-erc721-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value: 1n, // value is representing the number of NFT transfered. ERC721 are always sending 1 NFT per transaction
    asset: { type: "erc721", assetReference: contract, assetOwner: address },
    tx: coinOperation.tx,
    details: {
      ledgerOpType: type,
      tokenId: event.token_id,
      assetAmount: "1",
      assetSenders: from ? [from] : [],
      assetRecipients: to ? [to] : [],
    },
  }));
};

/**
 * Adapter to convert an ERC1155 transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerERC1155EventToOperations = (
  address: string,
  coinOperation: Operation<MemoNotSupported>,
  event: LedgerExplorerER1155TransferEvent,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.sender);
  const to = safeEncodeEIP55(event.receiver);
  const contract = eip55.encode(event.contract);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return event.transfers.flatMap((transfer, transferIndex) => {
    const { id: tokenId, value: quantity } = transfer;

    return types.map(type => ({
      id: `${coinOperation.tx.hash}-erc1155-${index}-${transferIndex}-${type}`,
      type,
      senders: from ? [from] : [],
      recipients: to ? [to] : [],
      value: safeBigInt(quantity),
      asset: { type: "erc1155", assetReference: contract, assetOwner: address },
      tx: coinOperation.tx,
      details: {
        ledgerOpType: type,
        tokenId,
        assetAmount: quantity,
        assetSenders: from ? [from] : [],
        assetRecipients: to ? [to] : [],
      },
    }));
  });
};

/**
 * Adapter to convert an internal transaction
 * on Ledger explorers into LL Operations
 */
export const ledgerInternalTransactionToOperations = (
  address: string,
  coinOperation: Operation<MemoNotSupported>,
  action: LedgerExplorerInternalTransaction,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  if (coinOperation.tx.failed) return [];

  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(action.from);
  const to = safeEncodeEIP55(action.to);
  const hasFailed = !!action.error; // AFAIK this is not working, all actions contain error = null even when it reverted
  const value = safeBigInt(action.value);
  const types: string[] = [];

  // Ledger explorers are indexing the first `CALL` opcode of a smart contract transaction as an
  // internal transaction which is wrong. Only children `CALL` opcode should be indexed,
  // therefore we need to filter those "actions" to prevent duplicating ops.
  // coinOperation.value is the transferred amount only (same for OUT/FEES/IN); compare directly.
  if (
    from === coinOperation.senders[0] &&
    to === coinOperation.recipients[0] &&
    value === coinOperation.value
  ) {
    return [];
  }

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(type => ({
    id: `${coinOperation.tx.hash}-internal-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value,
    asset: { type: "native" },
    tx: {
      ...coinOperation.tx,
      fees: 0n, // already contained in the fees of the main op
      failed: hasFailed,
    },
    details: {
      internal: true,
      hasFailed,
    },
  }));
};
