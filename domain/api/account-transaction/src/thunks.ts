import { AccountDataNotServedError, getAccountDataRuntime } from "@domain/api-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { pendingOperationsAdded } from "@domain/entity-account-operation";
import type {
  BroadcastedTransaction,
  SendRequest,
  SignedTransaction,
} from "@domain/entity-account-transaction";
import { defer, type Observable } from "rxjs";
import { NoSendingSourceError, TransactionNotSignableError } from "./errors";
import {
  isSendingSource,
  sendsFrom,
  type AccountSendingSource,
  type BroadcastOptions,
  type PreparedSend,
  type MessageSignEvent,
  type SigningDevice,
  type TransactionSignEvent,
} from "./source";

type Dispatch = (action: { type: string }) => unknown;

const sendersOf = (extra: unknown, descriptor: AccountDescriptor): AccountSendingSource[] =>
  getAccountDataRuntime(extra)
    .router.sources()
    .filter(isSendingSource)
    .filter(source => sendsFrom(source, descriptor));

function pinned(extra: unknown, { target, sourceId }: PreparedSend): AccountSendingSource {
  const source = sendersOf(extra, target.descriptor).find(each => each.id === sourceId);
  if (!source) throw new NoSendingSourceError(target.accountUUID, sourceId);
  return source;
}

/** Prepares a send on the first ranked source that sends from the account and does not hand it over. */
export function prepareSend(descriptor: AccountDescriptor, request: SendRequest) {
  return async (_dispatch: Dispatch, _getState: unknown, extra: unknown): Promise<PreparedSend> => {
    const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
    for (const source of sendersOf(extra, descriptor)) {
      try {
        const prepared = await source.send.prepare(target, request);
        return { target, sourceId: source.id, prepared };
      } catch (error) {
        if (!(error instanceof AccountDataNotServedError)) throw error;
      }
    }
    throw new NoSendingSourceError(target.accountUUID);
  };
}

/** The signature of this very preparation, for a Device Intent job to run on the session it opened. */
export function signSend(prepared: PreparedSend) {
  return (
    _dispatch: Dispatch,
    _getState: unknown,
    extra: unknown,
  ): ((device: SigningDevice) => Observable<TransactionSignEvent>) => {
    return device =>
      defer(() => {
        if (prepared.prepared.errors.length > 0) {
          throw new TransactionNotSignableError(prepared.prepared.errors[0].name);
        }
        return pinned(extra, prepared).send.sign(prepared.target, prepared.prepared, device);
      });
  };
}

/** Broadcasts on the source that prepared it, then heads the account's operations with its pending rows. */
export function broadcastSend(
  prepared: PreparedSend,
  signed: SignedTransaction,
  options?: BroadcastOptions,
) {
  return async (
    dispatch: Dispatch,
    _getState: unknown,
    extra: unknown,
  ): Promise<BroadcastedTransaction> => {
    const source = pinned(extra, prepared);
    const broadcasted = await source.send.broadcast(
      prepared.target,
      prepared.prepared,
      signed,
      options,
    );
    if (broadcasted.operations.length > 0) {
      dispatch(
        pendingOperationsAdded({
          accountUUID: prepared.target.accountUUID,
          operations: broadcasted.operations,
        }),
      );
    }
    return broadcasted;
  };
}

/** The signature of `messageHex` by the account, on the first ranked source that signs messages for it. */
export function signMessageSend(descriptor: AccountDescriptor, messageHex: string) {
  return (
    _dispatch: Dispatch,
    _getState: unknown,
    extra: unknown,
  ): ((device: SigningDevice) => Observable<MessageSignEvent>) => {
    const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
    const source = sendersOf(extra, descriptor).find(each => each.send.signMessage);
    if (!source?.send.signMessage) throw new NoSendingSourceError(target.accountUUID);
    const sign = source.send.signMessage.bind(source.send);
    return device => defer(() => sign(target, messageHex, device));
  };
}
