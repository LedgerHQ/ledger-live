import {
  AssetInfo,
  Page,
  MemoNotSupported,
  Operation,
  ListOperationsOptions,
} from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation, OperationType } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

/** Smart-contract fields copied from explorer `extra` into framework `details`. */
function contractDetailsFromLiveExtra(
  extra: LiveOperation["extra"],
): Record<string, unknown> | undefined {
  if (!extra || typeof extra !== "object") return undefined;
  const e = extra as Record<string, unknown>;
  if (e.contractInteraction === undefined) return undefined;
  return {
    contractInteraction: e.contractInteraction,
    ...(e.contractAddress !== undefined ? { contractAddress: e.contractAddress } : {}),
    contractPayload: e.contractPayload,
  };
}

type AssetConfig =
  | { type: "native"; internal?: boolean; parent?: LiveOperation }
  | { type: "token"; owner: string; parent?: LiveOperation };

function extractStandard(op: LiveOperation): string {
  if (!op.standard) return "erc20";
  if (["ERC721", "ERC1155"].includes(op.standard)) return op.standard.toLowerCase();

  return "token"; // NOTE: old default
}

/** Operation types that carry semantic meaning and must not be overridden with generic IN/OUT. */
const SEMANTIC_OP_TYPES: Set<OperationType> = new Set([
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "NFT_IN",
  "NFT_OUT",
]);

/**
 * Type from the perspective of the requested address (IN when they receive, OUT when they send).
 * Only overrides for generic types (e.g. NONE, FEES); preserves semantic types (DELEGATE, NFT_*, etc.)
 * so that staking and NFT operations are not shown as plain IN/OUT in history.
 */
function typeFromAddressPerspective(
  senders: string[],
  recipients: string[],
  requestedAddress: string,
  rawType: OperationType,
): OperationType {
  if (SEMANTIC_OP_TYPES.has(rawType)) return rawType;
  const addressLower = requestedAddress.toLowerCase();
  const inSenders = senders.some(s => s.toLowerCase() === addressLower);
  const inRecipients = recipients.some(r => r.toLowerCase() === addressLower);
  if (inRecipients && !inSenders) return "IN";
  if (inSenders && !inRecipients) return "OUT";
  return rawType;
}

function computeValue(op: LiveOperation): bigint {
  // amount = amount effectively transferred, fees are reported separately in tx.fees.
  return BigInt(op.value.toFixed(0));
}

/**
 * Gas is paid once per tx. Explorers sometimes put a different `fee` on token transfer operations than on the parent
 * coin tx (probably related to L2), so it is not a second on-chain charge — we use the parent fee.
 *
 */
function computeTxFee(asset: AssetConfig, op: LiveOperation): LiveOperation["fee"] {
  if (asset.type === "token" && asset.parent) {
    return asset.parent.fee;
  }
  return op.fee;
}

function computeFailed(asset: AssetConfig, op: LiveOperation): boolean {
  if (asset.type === "token" && asset.parent) {
    return asset.parent.hasFailed ?? false;
  }

  return op.hasFailed ?? false;
}

function computeFeesPayer(asset: AssetConfig, op: LiveOperation): string | undefined {
  // Important: do not use the op sender as fee payer by default, it may be wrong or ambiguous for token operations.
  // We prefer leaving fee payer unset if unknown.
  const isTokenOrInternal = asset.type === "token" || (asset.type === "native" && asset.internal);
  const referenceOperation = isTokenOrInternal ? asset.parent : op;
  return referenceOperation?.senders?.length === 1 ? referenceOperation?.senders[0] : undefined;
}

function toOperation(
  currency: string,
  address: string,
  asset: AssetConfig,
  op: LiveOperation,
): Operation<MemoNotSupported> {
  if (op.value.isNaN() || op.fee.isNaN()) {
    log("evm/listOperations", "Found NaN value on operation", {
      currency,
      address,
      operation: op.hash,
      assetType: asset.type,
      assetIsInternal: asset.type === "native" && !!asset.internal,
      ...(op.contract ? { assetReference: op.contract } : {}),
    });
  }

  const assetInfo: AssetInfo = { type: asset.type };

  if (asset.type === "token") {
    assetInfo.assetReference = op.contract ?? "";
    assetInfo.assetOwner = asset.owner;
    assetInfo.type = extractStandard(op);
  }

  const type = typeFromAddressPerspective(op.senders, op.recipients, address, op.type);
  const value = computeValue(op);
  const failed = computeFailed(asset, op);
  const feesPayer = computeFeesPayer(asset, op);

  const internalOpDetail =
    asset.type === "native" && asset.internal ? { internal: asset.internal } : {};
  const tokenOpDetail =
    asset.type === "token"
      ? {
          ledgerOpType: type,
          assetAmount: op.value.toFixed(0),
          assetSenders: op.senders,
          assetRecipients: op.recipients,
          parentSenders: asset.parent?.senders ?? [],
          parentRecipients: asset.parent?.recipients ?? [],
        }
      : {};

  const txFee = computeTxFee(asset, op);

  const contractDetail =
    contractDetailsFromLiveExtra(op.extra) ??
    (asset.type === "token" && asset.parent
      ? contractDetailsFromLiveExtra(asset.parent.extra)
      : undefined);

  return {
    id: op.id,
    type,
    senders: op.senders,
    recipients: op.recipients,
    value,
    asset: assetInfo,
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: op.blockHash ?? "",
        time: op.date,
      },
      fees: BigInt(txFee.toFixed(0)),
      date: op.date,
      failed,
      ...(feesPayer ? { feesPayer } : {}),
    },
    details: {
      sequence: op.transactionSequenceNumber,
      ...internalOpDetail,
      ...tokenOpDetail,
      ...(contractDetail ?? {}),
    },
  };
}

// the sort parameter has a double meaning:
// - legacy (for the bridge): it's used to sort the operations in the result list. Explorer always queried in "desc" order.
// - new: it's used to sort AND query the explorer with the correct order.

// the limit parameter is a newly introduced parameter for pagination. It's used to switch between "legacy" and "new" behavior.
// see tests for a full description of the behavior.
export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const explorerApi = getExplorerApi(currency);
  const explorerOrder = options.limit === undefined ? "desc" : (options.order ?? "desc");
  const {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
    lastInternalOperations,
    nextPagingToken,
  } = await explorerApi.getOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    options.minHeight,
    undefined,
    options.cursor,
    options.limit,
    explorerOrder,
  );

  const tokenOrNftHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations].map(op => op.hash),
  );
  const tokenNftOrInternalHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations, ...lastInternalOperations].map(op => op.hash),
  );

  const addressLower = address.toLowerCase();
  const isAddressInOp = (op: LiveOperation): boolean =>
    op.senders.some(s => s.toLowerCase() === addressLower) ||
    op.recipients.some(r => r.toLowerCase() === addressLower);
  const tokenOpHashesWhereAddressInvolved = new Set(
    [...lastTokenOperations, ...lastNftOperations].filter(isAddressInOp).map(op => op.hash),
  );

  const parents: Record<string, LiveOperation> = {};
  const nativeOperations: Operation<MemoNotSupported>[] = [];

  for (const coinOperation of lastCoinOperations) {
    // Store parent reference for token/NFT/internal operations
    if (tokenNftOrInternalHashes.has(coinOperation.hash)) {
      parents[coinOperation.hash] = coinOperation;
    }

    // Emit native operation so the fee-payer and any native transfer are represented.
    // Skip FEES-only (value 0) when the same tx has a token/NFT op for this address to avoid duplicate.
    const isFeesOnlyWithTokenOpForAddress =
      coinOperation.value.isZero() &&
      tokenOrNftHashes.has(coinOperation.hash) &&
      tokenOpHashesWhereAddressInvolved.has(coinOperation.hash);
    if (!isFeesOnlyWithTokenOpForAddress) {
      nativeOperations.push(toOperation(currency.id, address, { type: "native" }, coinOperation));
    }
  }

  const tokenOperations = [...lastTokenOperations, ...lastNftOperations].map<
    Operation<MemoNotSupported>
  >(op =>
    toOperation(
      currency.id,
      address,
      { type: "token", owner: address, parent: parents[op.hash] },
      op,
    ),
  );
  /**
   * Blockscout may index the top-level call as an internal tx with the same primary sender as the coin op,
   * which double-counts native transfers. Skip those when the sender matches the parent coin op (see spec tests).
   */
  const filteredInternalOperations = lastInternalOperations.filter(internalOp => {
    const coin = parents[internalOp.hash];
    if (!coin) return true;
    const coinSender = coin.senders[0]?.toLowerCase();
    const internalSender = internalOp.senders[0]?.toLowerCase();
    return !(coinSender && internalSender && coinSender === internalSender);
  });

  const internalOperations = filteredInternalOperations.map<Operation<MemoNotSupported>>(op => {
    // Explorers don't provide block hash and fees for internal operations.
    // When a matching parent transaction exists, we take these values from it.
    // Otherwise, we use the internal operation's defaults.
    const parent = parents[op.hash];
    return toOperation(
      currency.id,
      address,
      { type: "native", internal: true, parent },
      // Explorers don't provide block hash and fees for internal operations.
      // When a parent exists, we take these values from the parent; otherwise keep the internal op values.
      parent ? { ...op, fee: parent.fee, blockHash: parent.blockHash } : op,
    );
  });

  const hasValidType = (operation: Operation): boolean =>
    [
      "NONE",
      "FEES",
      "IN",
      "OUT",
      "DELEGATE",
      "UNDELEGATE",
      "REDELEGATE",
      "NFT_IN",
      "NFT_OUT",
    ].includes(operation.type);

  const isAddressInvolved = (op: Operation<MemoNotSupported>): boolean => {
    // some explorers return addresses with uppercase letters (eg eip-55 encoded addresses)
    const addressLower = address.toLowerCase();
    const isIncluded = (list: string[]): boolean =>
      list.some(item => item.toLowerCase() === addressLower);
    return isIncluded(op.senders) || isIncluded(op.recipients);
  };

  /** Always output 2 ops (OUT, IN) for self-sends. Expand single op to two when needed. */
  function expandSelfSendToTwoOps(
    ops: Operation<MemoNotSupported>[],
    address: string,
  ): Operation<MemoNotSupported>[] {
    const groupKey = (op: Operation<MemoNotSupported>): string => {
      if (op.asset.type === "native") return `${op.tx.hash}\t${op.asset.type}`;
      const ref = ("assetReference" in op.asset ? op.asset.assetReference : undefined) ?? "";
      return `${op.tx.hash}\t${op.asset.type}\t${ref}`;
    };

    const addr = address.toLowerCase();

    const byKey = new Map<string, Operation<MemoNotSupported>[]>();
    for (const op of ops) {
      const k = groupKey(op);
      const list = byKey.get(k) ?? [];
      list.push(op);
      byKey.set(k, list);
    }

    const isSelfSend = (op: Operation<MemoNotSupported>): boolean =>
      op.senders?.length === 1 &&
      op.recipients?.length === 1 &&
      op.senders[0]?.toLowerCase() === addr &&
      op.recipients[0]?.toLowerCase() === addr;

    const asType = (
      op: Operation<MemoNotSupported>,
      type: OperationType,
    ): Operation<MemoNotSupported> =>
      op.type === type
        ? op
        : {
            ...op,
            id: `${op.id}_${type}`,
            type,
            details: { ...op.details, ledgerOpType: type },
          };

    const result: Operation<MemoNotSupported>[] = [];
    for (const [, group] of byKey) {
      if (group.every(isSelfSend) && group.length === 1) {
        const op = group[0];
        result.push(asType(op, "OUT"), asType(op, "IN"));
      } else {
        for (const op of group) result.push(op);
      }
    }
    return result;
  }

  const nativeExpanded = expandSelfSendToTwoOps(nativeOperations, address);
  const tokenExpanded = expandSelfSendToTwoOps(tokenOperations, address);

  const operations = nativeExpanded
    .concat(tokenExpanded)
    .concat(internalOperations)
    .filter(hasValidType)
    .filter(isAddressInvolved);

  operations.sort((a, b) =>
    options.order === "asc"
      ? a.tx.date.getTime() - b.tx.date.getTime()
      : b.tx.date.getTime() - a.tx.date.getTime(),
  );

  return { items: operations, next: nextPagingToken };
}
