import type {
  Page,
  MemoNotSupported,
  Operation,
  ListOperationsOptions,
} from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getExplorerApi } from "../network/explorer";

// the sort parameter has a double meaning:
// - legacy (for the bridge): it's used to sort the operations in the result list. Explorer always queried in "desc" order.
// - new: it's used to sort AND query the explorer with the correct order.

// the limit parameter is a newly introduced parameter for pagination. It's used to switch between "legacy" and "new" behavior.
// see tests for a full description of the behavior.
const SEMANTIC_OP_TYPES = new Set([
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "WITHDRAW_UNBONDED",
  "REWARD",
  "NFT_IN",
  "NFT_OUT",
]);

function typeFromAddressPerspective(
  senders: string[],
  recipients: string[],
  requestedAddress: string,
  rawType: string,
): string {
  if (SEMANTIC_OP_TYPES.has(rawType)) return rawType;
  const addressLower = requestedAddress.toLowerCase();
  const inSenders = senders.some(s => s.toLowerCase() === addressLower);
  const inRecipients = recipients.some(r => r.toLowerCase() === addressLower);
  if (inRecipients && !inSenders) return "IN";
  if (inSenders && !inRecipients) return "OUT";
  return rawType;
}

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
    options.minHeight,
    undefined,
    options.cursor,
    options.limit,
    explorerOrder,
  );

  const tokenOrNftHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations].map(op => op.tx.hash),
  );
  const tokenNftOrInternalHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations, ...lastInternalOperations].map(op => op.tx.hash),
  );

  const addressLower = address.toLowerCase();
  const isAddressInOp = (op: Operation<MemoNotSupported>): boolean =>
    op.senders.some(s => s.toLowerCase() === addressLower) ||
    op.recipients.some(r => r.toLowerCase() === addressLower);
  const tokenOpHashesWhereAddressInvolved = new Set(
    [...lastTokenOperations, ...lastNftOperations].filter(isAddressInOp).map(op => op.tx.hash),
  );

  const parents: Record<string, Operation<MemoNotSupported>> = {};
  const nativeOperations: Operation<MemoNotSupported>[] = [];

  for (const coinOperation of lastCoinOperations) {
    // Store parent reference for token/NFT/internal operations
    if (tokenNftOrInternalHashes.has(coinOperation.tx.hash)) {
      parents[coinOperation.tx.hash] = coinOperation;
    }

    // Emit native operation so the fee-payer and any native transfer are represented.
    // Skip FEES-only (value 0) when the same tx has a token/NFT op for this address to avoid duplicate.
    const isFeesOnlyWithTokenOpForAddress =
      coinOperation.value === 0n &&
      tokenOrNftHashes.has(coinOperation.tx.hash) &&
      tokenOpHashesWhereAddressInvolved.has(coinOperation.tx.hash);
    if (!isFeesOnlyWithTokenOpForAddress) {
      nativeOperations.push(coinOperation);
    }
  }

  // Gas is paid once per tx. Token/NFT sub-ops carry fees from their own explorer record (etherscan),
  // or inherit the parent tx (ledger explorer). Override to always use the parent's fees so the fee
  // is not double-counted and the fee payer is correct.
  const enrichTokenWithParent = (op: Operation<MemoNotSupported>): Operation<MemoNotSupported> => {
    const parent = parents[op.tx.hash];
    if (!parent) return op;
    const parentContractDetails: Record<string, unknown> = {};
    if (parent.details?.contractInteraction && !op.details?.contractInteraction) {
      parentContractDetails.contractInteraction = parent.details.contractInteraction;
    }
    if (parent.details?.contractAddress && !op.details?.contractAddress) {
      parentContractDetails.contractAddress = parent.details.contractAddress;
    }
    if (parent.details?.contractPayload && !op.details?.contractPayload) {
      parentContractDetails.contractPayload = parent.details.contractPayload;
    }
    return {
      ...op,
      tx: {
        ...op.tx,
        fees: parent.tx.fees,
        failed: parent.tx.failed,
        ...(parent.tx.feesPayer ? { feesPayer: parent.tx.feesPayer } : {}),
      },
      details: {
        ...(op.details ?? {}),
        parentSenders: parent.senders,
        parentRecipients: parent.recipients,
        ...parentContractDetails,
      },
    };
  };

  const tokenOperations = [...lastTokenOperations, ...lastNftOperations].map(enrichTokenWithParent);

  // Some Blockscout explorers (0G, Somnia) report the root call as an internal tx, duplicating
  // the native transfer already in txlist. Drop it using sender-match (outgoing) or
  // (recipient, peer, amount) triple (incoming), since traceAddress is not exposed by txlistinternal.
  const isRootTrace = (op: Operation<MemoNotSupported>): boolean => {
    const parent = parents[op.tx.hash];
    if (!parent) return false;

    const internalSenderMatch = op.senders.some(s => s.toLowerCase() === addressLower);
    const parentSenderMatch = parent.senders.some(s => s.toLowerCase() === addressLower);
    if (internalSenderMatch && parentSenderMatch) return true;

    const internalRecipientMatch = op.recipients.some(r => r.toLowerCase() === addressLower);
    const parentRecipientMatch = parent.recipients.some(r => r.toLowerCase() === addressLower);
    const peerMatch = op.senders.some(s =>
      parent.senders.some(ps => ps.toLowerCase() === s.toLowerCase()),
    );
    return internalRecipientMatch && parentRecipientMatch && op.value === parent.value && peerMatch;
  };

  // For internal ops, override block.hash and fees from parent (etherscan sets block.hash = ""),
  // but intentionally do NOT override tx.failed — each internal op has its own error state.
  const enrichInternalWithParent = (
    op: Operation<MemoNotSupported>,
  ): Operation<MemoNotSupported> => {
    const parent = parents[op.tx.hash];
    if (!parent) return op;
    return {
      ...op,
      tx: {
        ...op.tx,
        block: { ...op.tx.block, hash: parent.tx.block.hash },
        fees: parent.tx.fees,
        ...(parent.tx.feesPayer ? { feesPayer: parent.tx.feesPayer } : {}),
      },
    };
  };

  const internalOperations = lastInternalOperations
    .filter(op => !isRootTrace(op))
    .map(enrichInternalWithParent);

  const hasValidType = (operation: Operation<MemoNotSupported>): boolean =>
    [
      "NONE",
      "FEES",
      "IN",
      "OUT",
      "DELEGATE",
      "UNDELEGATE",
      "REDELEGATE",
      "WITHDRAW_UNBONDED",
      "REWARD",
      "NFT_IN",
      "NFT_OUT",
    ].includes(operation.type);

  const isAddressInvolved = (op: Operation<MemoNotSupported>): boolean => {
    // some explorers return addresses with uppercase letters (eg eip-55 encoded addresses)
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

    const asType = (op: Operation<MemoNotSupported>, type: string): Operation<MemoNotSupported> =>
      op.type === type
        ? op
        : {
            ...op,
            id: `${op.id}_${type}`,
            type,
            details: { ...(op.details ?? {}), ledgerOpType: type },
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

  // TODO: etherscan emits FEES for any contract call regardless of transferred value; remap
  // sender-only ops to OUT until adapters use consistent value-based classification.
  const nativeWithPerspective = nativeOperations.map(op => ({
    ...op,
    type: typeFromAddressPerspective(op.senders, op.recipients, address, op.type),
  }));
  const nativeExpanded = expandSelfSendToTwoOps(nativeWithPerspective, address);
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
