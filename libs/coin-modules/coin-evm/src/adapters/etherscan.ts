import type {
  BlockOperation,
  TransferBlockOperation,
} from "@ledgerhq/coin-module-framework/api/index";
import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { InvalidExplorerResponse } from "../errors";
import { NO_TOKEN } from "../network/explorer/types";
import { detectEvmStakingOperationType } from "../staking/detectOperationType";
import type {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
} from "../types";
import { buildSmartContractDetails, safeBigInt, safeEncodeEIP55 } from "../utils";
import { NON_VALUE_TRANSFER_CALL_TYPES } from "./nonValueTransferCallTypes";

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
 * Extracts a unix timestamp from an etherscan-like operation.
 * Some explorers (e.g., chainscan.0g.ai for zero_gravity) return "timestamp" (lowercase)
 * instead of the standard "timeStamp" (camelCase).
 * Throws InvalidExplorerResponse when neither field is present or the value is non-numeric,
 * so malformed responses surface as errors rather than silently producing epoch dates.
 */
export const safeDate = (op: { timeStamp?: string; timestamp?: string }): Date => {
  const raw = op.timeStamp ?? op.timestamp;
  if (raw !== undefined) {
    const ts = Number.parseInt(raw, 10);
    if (!Number.isNaN(ts)) return new Date(ts * 1000);
  }
  throw new InvalidExplorerResponse(`Missing or non-numeric timestamp in explorer response`, {
    op: JSON.stringify(op),
  });
};

/**
 * Adapter to convert an Etherscan operation into Ledger Live Operations.
 * It can return more than one operation in case of self-send
 */
export const etherscanOperationToOperations = (
  address: string,
  currencyId: string,
  etherscanOp: EtherscanOperation,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(etherscanOp.from);
  const to = safeEncodeEIP55(etherscanOp.to) || safeEncodeEIP55(etherscanOp.contractAddress);
  const value = safeBigInt(etherscanOp.value);
  const fees = safeBigInt(etherscanOp.gasUsed) * safeBigInt(etherscanOp.gasPrice);
  const failed = etherscanOp.isError === "1";
  const senders = from ? [from] : [];
  const recipients = to ? [to] : [];
  const types: string[] = [];

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

  const contractExtra = buildSmartContractDetails(
    etherscanOp.to,
    etherscanOp.input,
    etherscanOp.contractAddress,
  );

  const feesPayer = senders.length === 1 ? senders[0] : undefined;
  const date = safeDate(etherscanOp);

  // Value = transferred amount only (same whether tx failed or not); fee is separate. Ledger Wallet contract is applied by generic-coin-framework bridge.
  return types.map(type => ({
    id: `${address}-${etherscanOp.hash}-${type}`,
    type,
    senders,
    recipients,
    value,
    asset: { type: "native" },
    tx: {
      hash: etherscanOp.hash,
      block: {
        height: Number.parseInt(etherscanOp.blockNumber, 10) || 0,
        hash: etherscanOp.blockHash,
        time: date,
      },
      fees,
      date,
      failed,
      ...(feesPayer ? { feesPayer } : {}),
    },
    details: {
      sequence: etherscanOp.nonce,
      ...(contractExtra ?? {}),
    },
  }));
};

/**
 * Adapter to convert an ERC20 transaction
 * on etherscan APIs into LL Operations
 * It can return up to 2 operations
 * in case of self-send or airdrop
 */
export const etherscanERC20EventToOperations = (
  address: string,
  event: EtherscanERC20Event,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const contract = eip55.encode(event.contractAddress);
  const value = safeBigInt(event.value);
  const fees = safeBigInt(event.gasUsed) * safeBigInt(event.gasPrice);
  const date = safeDate(event);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(type => ({
    id: `${event.hash}-erc20-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value,
    asset: { type: "erc20", assetReference: contract, assetOwner: address },
    tx: {
      hash: event.hash,
      block: {
        height: Number.parseInt(event.blockNumber, 10) || 0,
        hash: event.blockHash,
        time: date,
      },
      fees,
      date,
      failed: false,
    },
    details: {
      sequence: event.nonce,
      ledgerOpType: type,
      assetAmount: event.value,
      assetSenders: from ? [from] : [],
      assetRecipients: to ? [to] : [],
    },
  }));
};

/**
 * Adapter to convert an ERC721 transaction
 * on etherscan APIs into LL Operations
 * It can return up to 2 operations
 * in case of self-send or airdrop
 */
export const etherscanERC721EventToOperations = (
  address: string,
  event: EtherscanERC721Event,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const contract = eip55.encode(event.contractAddress);
  const fees = safeBigInt(event.gasUsed) * safeBigInt(event.gasPrice);
  const date = safeDate(event);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return types.map(type => ({
    id: `${event.hash}-erc721-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value: 1n, // value is representing the number of NFT transfered. ERC721 are always sending 1 NFT per transaction
    asset: { type: "erc721", assetReference: contract, assetOwner: address },
    tx: {
      hash: event.hash,
      block: {
        height: Number.parseInt(event.blockNumber, 10) || 0,
        hash: event.blockHash,
        time: date,
      },
      fees,
      date,
      failed: false,
    },
    details: {
      sequence: event.nonce,
      tokenId: event.tokenID,
      ledgerOpType: type,
      assetAmount: "1",
      assetSenders: from ? [from] : [],
      assetRecipients: to ? [to] : [],
    },
  }));
};

/**
 * Adapter to convert an ERC1155 transaction
 * on etherscan APIs into LL Operations
 */
export const etherscanERC1155EventToOperations = (
  address: string,
  event: EtherscanERC1155Event,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(event.from);
  const to = safeEncodeEIP55(event.to);
  const contract = eip55.encode(event.contractAddress);
  const value = safeBigInt(event.tokenValue); // value is representing the number of NFT transfered.
  const fees = safeBigInt(event.gasUsed) * safeBigInt(event.gasPrice);
  const date = safeDate(event);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("NFT_IN");
  }
  if (from === checksummedAddress) {
    types.push("NFT_OUT");
  }

  return types.map(type => ({
    id: `${event.hash}-erc1155-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value,
    asset: { type: "erc1155", assetReference: contract, assetOwner: address },
    tx: {
      hash: event.hash,
      block: {
        height: Number.parseInt(event.blockNumber, 10) || 0,
        hash: event.blockHash,
        time: date,
      },
      fees,
      date,
      failed: false,
    },
    details: {
      sequence: event.nonce,
      tokenId: event.tokenID,
      ledgerOpType: type,
      assetAmount: event.tokenValue,
      assetSenders: from ? [from] : [],
      assetRecipients: to ? [to] : [],
    },
  }));
};

/**
 * `delegatecall`/`staticcall`/`callcode` cannot move native ETH, but both Blockscout and
 * Etherscan still report a non-zero `value` on those entries (it's the `msg.value` inherited
 * from the enclosing frame). Blockscout exposes the discriminator via `callType`, Etherscan
 * folds it into `type` — this helper hides that quirk from both call sites.
 */
function isNonValueTransferInternalTx(
  it: Pick<EtherscanInternalTransaction, "callType" | "type">,
): boolean {
  return NON_VALUE_TRANSFER_CALL_TYPES.has((it.callType || it.type || "").toLowerCase());
}

/**
 * Adapter to convert an internal transaction
 * on etherscan APIs into LL Operations
 */
export const etherscanInternalTransactionToOperations = (
  address: string,
  internalTx: EtherscanInternalTransaction,
  index = 0,
): Array<Operation<MemoNotSupported>> => {
  // Phantom IN/OUT guard; `isInternalTransactionValid` applies the same filter on the `getBlock` path.
  if (isNonValueTransferInternalTx(internalTx)) return [];

  const { hash, blockNumber, isError } = internalTx;
  const checksummedAddress = eip55.encode(address);
  const from = safeEncodeEIP55(internalTx.from);
  const to = safeEncodeEIP55(internalTx.to);
  const value = safeBigInt(internalTx.value);
  const hasFailed = isError === "1";
  const date = safeDate(internalTx);
  const types: string[] = [];

  if (to === checksummedAddress) {
    types.push("IN");
  }
  if (from === checksummedAddress) {
    types.push("OUT");
  }

  return types.map(type => ({
    id: `${hash}-internal-${index}-${type}`,
    type,
    senders: from ? [from] : [],
    recipients: to ? [to] : [],
    value,
    asset: { type: "native" },
    tx: {
      hash,
      block: {
        height: Number.parseInt(blockNumber, 10) || 0,
        hash: "", // not made directly available by etherscan, only blockNumber is provided
        time: date,
      },
      fees: 0n, // unecessary as it's already contained in the fees of the main op
      date,
      failed: hasFailed,
    },
    details: {
      internal: true,
    },
  }));
};

const NATIVE_ASSET = { type: "native" } as const;

/**
 * Validates an internal tx for the `getBlock` path. The same non-value-transferring filter
 * is also applied at the entrypoint of `etherscanInternalTransactionToOperations`
 * (the `listOperations` path) — see `isNonValueTransferInternalTx`.
 */
function isInternalTransactionValid(it: EtherscanInternalTransaction): boolean {
  if (it.isError !== "0") return false;
  if (BigInt(it.value) <= 0n) return false;
  if (!it.from || !it.to) return false;
  if (isNonValueTransferInternalTx(it)) return false;
  return true;
}

/**
 * Converts valid internal transactions to BlockOperations grouped by transaction hash.
 * Skips internal txs that:
 *   - failed (`isError === "1"`) or report a non-positive `value`;
 *   - are missing `from` or `to`;
 *   - have a `callType` (Blockscout) or `type` (Etherscan) in
 *     `NON_VALUE_TRANSFER_CALL_TYPES` — those opcodes (`delegatecall`,
 *     `staticcall`, `callcode`) inherit `msg.value` from their enclosing frame
 *     but cannot move native ETH.
 */
export function internalTxsToOperationsByHash(
  internalTxs: EtherscanInternalTransaction[],
): Map<string, BlockOperation[]> {
  const byHash = new Map<string, BlockOperation[]>();

  for (const it of internalTxs) {
    if (!isInternalTransactionValid(it)) continue;

    const { from, to, value, hash } = it;
    const encodedFrom = safeEncodeEIP55(from);
    const encodedTo = safeEncodeEIP55(to);
    const amount = BigInt(value);

    const ops: BlockOperation[] = [];
    const fromOp: TransferBlockOperation = {
      type: "transfer",
      address: encodedFrom,
      ...(encodedTo ? { peer: encodedTo } : {}),
      asset: NATIVE_ASSET,
      amount: -amount,
    };
    const toOp: TransferBlockOperation = {
      ...fromOp,
      address: encodedTo,
      ...(encodedFrom ? { peer: encodedFrom } : {}),
      amount: amount,
    };
    if (encodedFrom) {
      ops.push(fromOp);
    }
    if (encodedTo) {
      ops.push(toOp);
    }

    let arr = byHash.get(hash);
    if (arr === undefined) {
      arr = [];
      byHash.set(hash, arr);
    }
    arr.push(...ops);
  }

  return byHash;
}

export type PagingState = {
  // Pagination cursor boundary block (boundary between ).
  // Depending on the fetch order, this acts as either:
  // - the lower bound (fromBlock, inclusive) when paginating in ascending order, or
  // - the upper bound (toBlock, inclusive) when paginating in descending order.
  boundBlock: number;
  // Each flag indicates whether the corresponding endpoint is done (no more pages to fetch).
  coinIsDone: boolean;
  internalIsDone: boolean;
  tokenIsDone: boolean;
  nftIsDone: boolean;
};

/**
 * Serialize a paging token for the next page request.
 * Compact url-friendly format: "boundBlock-flags" where flags encode isDone state (1=done, 0=has more).
 * Returns NO_TOKEN if all endpoints are done.
 */
export function serializePagingToken(
  boundBlock: number | undefined,
  state: {
    coinIsDone: boolean;
    internalIsDone: boolean;
    tokenIsDone: boolean;
    nftIsDone: boolean;
  },
): string {
  const allDone = state.coinIsDone && state.internalIsDone && state.tokenIsDone && state.nftIsDone;
  if (allDone || boundBlock === undefined) return NO_TOKEN;
  const flags = [state.coinIsDone, state.internalIsDone, state.tokenIsDone, state.nftIsDone]
    .map(f => (f ? "1" : "0"))
    .join("");
  return `${boundBlock}-${flags}`;
}

/**
 * Deserialize a paging token to get the pagination state.
 * Returns undefined if token is empty or NO_TOKEN.
 * Throws if token format is invalid.
 */
export function deserializePagingToken(token: string | undefined): PagingState | undefined {
  if (token === undefined || token === NO_TOKEN) return undefined;

  const [blockStr, flags] = token.split("-");
  if (!flags) throw new Error("Invalid paging token: missing flags");
  const boundBlock = Number.parseInt(blockStr, 10);
  if (Number.isNaN(boundBlock)) throw new Error("Invalid paging token: invalid boundBlock");
  if (flags.length !== 4) throw new Error("Invalid paging token: invalid flags");

  return {
    boundBlock,
    coinIsDone: flags[0] === "1",
    internalIsDone: flags[1] === "1",
    tokenIsDone: flags[2] === "1",
    nftIsDone: flags[3] === "1",
  };
}
