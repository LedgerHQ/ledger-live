/* eslint-disable prettier/prettier */
import { OperationType } from "@ledgerhq/types-live";
import {
  AccountTransaction,
  Cursor,
  Direction,
  Memo,
  Operation,
  Page,
  Pagination,
  TransactionEvent,
  TransactionEventType,
} from "./types";

type ListOperations<MemoType extends Memo> = (
  address: string,
  pagination: Pagination,
) => Promise<[Operation<MemoType>[], string]>;

type GetTransactions<MemoType extends Memo> = (
  address: string,
  direction?: Direction,
  minHeight?: number,
  maxHeight?: number,
  cursor?: Cursor,
) => Promise<Page<AccountTransaction<MemoType>>>;

/**
 * Adapt a {@link AlpacaApi#getTransactions} implementation to a {@link AlpacaApi#listOperations} one.
 *
 * This method is provided for backward compatibility, until all coins have been updated to provide a
 * {@link AlpacaApi#getTransactions} implementation and all clients updated to use it.
 *
 * @param getTransactions the {@link AlpacaApi#getTransactions} implementation to adapt
 */
export function toListOperations<MemoType extends Memo>(
  getTransactions: GetTransactions<MemoType>,
): ListOperations<MemoType> {
  return async (address: string, pagination: Pagination) => {
    return getTransactions(
      address,
      pagination.order,
      pagination.minHeight,
      undefined, // FIXME probably wrong, limit is ignored
      pagination.lastPagingToken || undefined,
    ).then(page => [
      page.items.flatMap(transaction =>
        transaction.events.map(event => toOperation(address, transaction, event)),
      ),
      page.next ?? "",
    ]);
  };
}

/**
 * Convert a {@link TransactionEvent} from an {@link AccountTransaction} to a legacy {@link Operation}.
 *
 * @param address the address to determine transfer direction (whose perspective to use)
 * @param transaction the transaction containing the event
 * @param event the event to convert
 * @returns the corresponding operation
 */
export function toOperation<MemoType extends Memo>(
  address: string,
  transaction: AccountTransaction<MemoType>,
  event: TransactionEvent,
): Operation<MemoType> {
  const type = toOperationType(event, address);

  // Extract senders (negative delta) and recipients (positive delta) from balance deltas
  const senders: string[] = [];
  const recipients: string[] = [];
  for (const delta of event.balanceDeltas) {
    if (delta.delta < 0n) {
      senders.push(delta.address);
    } else if (delta.delta > 0n) {
      recipients.push(delta.address);
    }
  }

  // Get the balance delta for the given address to determine value
  const addressDelta = event.balanceDeltas.find(
    d => d.address.toLowerCase() === address.toLowerCase(),
  );

  // Value is the absolute amount of the balance change for the address
  // If no delta found for address, value is 0 (e.g., for FEE events where address is the payer)
  const value = addressDelta
    ? addressDelta.delta < 0n
      ? -addressDelta.delta
      : addressDelta.delta
    : 0n;

  // Get asset from the address's delta, or use native as fallback
  const asset = addressDelta?.asset ?? { type: "native" };

  // Calculate fees from all FEE events in the transaction
  const fees = transaction.events
    .filter(e => e.type === "FEE")
    .flatMap(e => e.balanceDeltas)
    .filter(d => d.address.toLowerCase() === address.toLowerCase())
    .reduce((sum, d) => sum + (d.delta < 0n ? -d.delta : 0n), 0n);

  // Generate operation ID: combine transaction id with event type for uniqueness
  const eventIndex = transaction.events.indexOf(event);
  const operationId = `${transaction.id}-${event.type}-${eventIndex}`;

  const operation: Operation<MemoType> = {
    id: operationId,
    type,
    senders,
    recipients,
    value,
    asset,
    tx: {
      hash: transaction.id,
      block: transaction.block,
      fees,
      date: transaction.time ?? transaction.block.time ?? new Date(0),
      failed: transaction.failed,
    },
  };

  if (transaction.memo !== undefined) {
    operation.memo = transaction.memo;
  }

  if (event.details !== undefined) {
    operation.details = event.details;
  }

  return operation;
}

/**
 * Convert a Ledger Live operation type to a {@link TransactionEventType}.
 *
 * @param operationType operation type
 */
export function toTransactionEventType(operationType: OperationType): TransactionEventType {
  switch (operationType) {
    case "UNKNOWN":
    case "NONE":
      return "UNKNOWN";
    case "IN":
    case "OUT":
    case "NFT_IN":
    case "NFT_OUT":
      return "TRANSFER";
    case "FEES":
      return "FEE";
    case "DELEGATE":
      return "DELEGATE";
    case "UNDELEGATE":
      return "UNDELEGATE";
    case "REDELEGATE":
      return "REDELEGATE";
    case "BURN":
      return "BURN";
    case "REWARD":
    case "REWARD_PAYOUT":
      return "REWARD";
    case "VOTE":
      return "VOTE";
    case "CONTRACT_CALL":
      return "CONTRACT_CALL";
    case "CREATE":
      return "TEZOS_CREATE";
    case "REVEAL":
      return "TEZOS_REVEAL";
    case "FREEZE":
      return "TRON_FREEZE";
    case "UNFREEZE":
      return "TRON_UNFREEZE";
    case "WITHDRAW_EXPIRE_UNFREEZE":
      return "TRON_WITHDRAW_EXPIRE_UNFREEZE";
    case "UNDELEGATE_RESOURCE":
      return "TRON_UNDELEGATE_RESOURCE";
    case "LEGACY_UNFREEZE":
      return "TRON_LEGACY_UNFREEZE";
    case "BOND":
      return "POLKADOT_BOND";
    case "UNBOND":
      return "POLKADOT_UNBOND";
    case "WITHDRAW_UNBONDED":
      return "POLKADOT_WITHDRAW_UNBONDED";
    case "SET_CONTROLLER":
      return "POLKADOT_SET_CONTROLLER";
    case "SLASH":
      return "POLKADOT_SLASH";
    case "NOMINATE":
      return "POLKADOT_NOMINATE";
    case "CHILL":
      return "POLKADOT_CHILL";
    case "APPROVE":
      return "EVM_APPROVE";
    case "OPT_IN":
      return "ALGORAND_OPT_IN";
    case "OPT_OUT":
      return "ALGORAND_OPT_OUT";
    case "LOCK":
      return "CELO_LOCK";
    case "UNLOCK":
      return "CELO_UNLOCK";
    case "WITHDRAW":
      return "CELO_WITHDRAW";
    case "REVOKE":
      return "CELO_REVOKE";
    case "ACTIVATE":
      return "CELO_ACTIVATE";
    case "REGISTER":
      return "CELO_REGISTER";
    case "STAKE":
      return "NEAR_STAKE";
    case "UNSTAKE":
      return "NEAR_UNSTAKE";
    case "WITHDRAW_UNSTAKED":
      return "NEAR_WITHDRAW_UNSTAKED";
    case "ASSOCIATE_TOKEN":
      return "HEDERA_ASSOCIATE_TOKEN";
    case "UPDATE_ACCOUNT":
      return "HEDERA_UPDATE_ACCOUNT";
    case "PRE_APPROVAL":
      return "CANTON_PRE_APPROVE";
    case "TRANSFER_PROPOSAL":
      return "CANTON_OFFER";
    case "TRANSFER_REJECTED":
      return "CANTON_REJECT";
    case "TRANSFER_WITHDRAWN":
      return "CANTON_WITHDRAW";
    default:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      throw Error(`Missing conversion for operation type "${operationType}"`) as never;
  }
}

/**
 * Convert a {@link TransactionEvent} to a Ledger Live {@link OperationType}.
 *
 * This is the reverse of {@link toTransactionEventType}, but requires additional context
 * because some operation types (like IN/OUT or NFT_IN/NFT_OUT) depend on:
 * - The transfer direction (determined by the balance delta sign for the given address)
 * - The asset type (to distinguish NFT transfers from regular transfers)
 *
 * @param event the transaction event to convert
 * @param address the address to determine transfer direction (whose perspective to use)
 * @returns the corresponding operation type
 * @throws if the event type is not recognized or if no balance delta is found for the address in a TRANSFER event
 */
export function toOperationType(event: TransactionEvent, address: string): OperationType {
  switch (event.type) {
    case "UNKNOWN":
      return "UNKNOWN";

    case "TRANSFER":
    case "MINT":
    case "AIRDROP":
    case "CANTON_ACCEPT": {
      const delta = event.balanceDeltas.find(
        d => d.address.toLowerCase() === address.toLowerCase(),
      );
      if (!delta) return "UNKNOWN";
      const isNft = new Set(["erc721", "erc1155"]).has(delta.asset.type);
      if (delta.delta > 0n) {
        return isNft ? "NFT_IN" : "IN";
      } else {
        return isNft ? "NFT_OUT" : "OUT";
      }
    }

    case "FEE":
      return "FEES";
    case "DELEGATE":
      return "DELEGATE";
    case "UNDELEGATE":
      return "UNDELEGATE";
    case "REDELEGATE":
      return "REDELEGATE";
    case "BURN":
      return "BURN";
    case "REWARD":
      return "REWARD";
    case "VOTE":
      return "VOTE";
    case "CONTRACT_CALL":
      return "CONTRACT_CALL";
    case "TEZOS_CREATE":
      return "CREATE";
    case "TEZOS_REVEAL":
      return "REVEAL";
    case "TRON_FREEZE":
      return "FREEZE";
    case "TRON_UNFREEZE":
      return "UNFREEZE";
    case "TRON_WITHDRAW_EXPIRE_UNFREEZE":
      return "WITHDRAW_EXPIRE_UNFREEZE";
    case "TRON_UNDELEGATE_RESOURCE":
      return "UNDELEGATE_RESOURCE";
    case "TRON_LEGACY_UNFREEZE":
      return "LEGACY_UNFREEZE";
    case "POLKADOT_BOND":
      return "BOND";
    case "POLKADOT_UNBOND":
      return "UNBOND";
    case "POLKADOT_WITHDRAW_UNBONDED":
      return "WITHDRAW_UNBONDED";
    case "POLKADOT_SET_CONTROLLER":
      return "SET_CONTROLLER";
    case "POLKADOT_SLASH":
      return "SLASH";
    case "POLKADOT_NOMINATE":
      return "NOMINATE";
    case "POLKADOT_CHILL":
      return "CHILL";
    case "EVM_APPROVE":
      return "APPROVE";
    case "ALGORAND_OPT_IN":
      return "OPT_IN";
    case "ALGORAND_OPT_OUT":
      return "OPT_OUT";
    case "CELO_LOCK":
      return "LOCK";
    case "CELO_UNLOCK":
      return "UNLOCK";
    case "CELO_WITHDRAW":
      return "WITHDRAW";
    case "CELO_REVOKE":
      return "REVOKE";
    case "CELO_ACTIVATE":
      return "ACTIVATE";
    case "CELO_REGISTER":
      return "REGISTER";
    case "NEAR_STAKE":
      return "STAKE";
    case "NEAR_UNSTAKE":
      return "UNSTAKE";
    case "NEAR_WITHDRAW_UNSTAKED":
      return "WITHDRAW_UNSTAKED";
    case "HEDERA_ASSOCIATE_TOKEN":
      return "ASSOCIATE_TOKEN";
    case "HEDERA_UPDATE_ACCOUNT":
      return "UPDATE_ACCOUNT";
    case "CANTON_PRE_APPROVE":
      return "PRE_APPROVAL";
    case "CANTON_OFFER":
      return "TRANSFER_PROPOSAL";
    case "CANTON_REJECT":
      return "TRANSFER_REJECTED";
    case "CANTON_WITHDRAW":
      return "TRANSFER_WITHDRAWN";

    default:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      throw Error(`Missing conversion for transaction event type "${event.type}"`) as never;
  }
}
