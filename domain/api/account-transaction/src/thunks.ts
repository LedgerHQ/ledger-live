import { AccountDataNotServedError, getAccountDataRuntime } from "@domain/api-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { pendingOperationsAdded } from "@domain/entity-account-operation";
import type {
  BroadcastedTransaction,
  FeeEstimate,
  FeeStrategy,
  SendRequest,
} from "@domain/entity-account-transaction";
import { defer, map, type Observable } from "rxjs";
import {
  NoSendingSourceError,
  SignatureMismatchError,
  TransactionNotSignableError,
} from "./errors";
import {
  isSendingSource,
  type AccountSendingSource,
  type PreparedSend,
  type SendSignEvent,
  type SignedSend,
  type SigningDevice,
} from "./source";

type Dispatch = (action: { type: string }) => unknown;

const sendersOf = (extra: unknown, descriptor: AccountDescriptor): AccountSendingSource[] =>
  getAccountDataRuntime(extra)
    .router.sourcesFor(descriptor)
    .filter(isSendingSource)
    .filter(source => source.send.supports(descriptor));

function pinned(
  extra: unknown,
  { target, sourceId }: Pick<PreparedSend, "target" | "sourceId">,
): AccountSendingSource {
  const source = sendersOf(extra, target.descriptor).find(each => each.id === sourceId);
  if (!source) throw new NoSendingSourceError(target.accountUUID, sourceId);
  return source;
}

const preparationId = () =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), byte =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

const targetOf = (descriptor: AccountDescriptor) => ({
  accountUUID: computeAccountUUID(descriptor),
  descriptor,
});

/** Runs `run` on the ranked sources that send from the account until one does not hand it over. */
function onFirstSender<T>(
  extra: unknown,
  descriptor: AccountDescriptor,
  run: (source: AccountSendingSource) => Promise<T>,
): Promise<T> {
  const [source, ...rest] = sendersOf(extra, descriptor);
  return tryInTurn(
    source,
    rest,
    run,
    () => new NoSendingSourceError(computeAccountUUID(descriptor)),
  );
}

// One source at a time, in rank order: the next one is only asked when this one hands the account over.
function tryInTurn<T>(
  source: AccountSendingSource | undefined,
  rest: readonly AccountSendingSource[],
  run: (source: AccountSendingSource) => Promise<T>,
  none: () => Error,
): Promise<T> {
  if (!source) return Promise.reject(none());
  return run(source).catch((error: unknown) => {
    if (!(error instanceof AccountDataNotServedError)) throw error;
    const [next, ...others] = rest;
    return tryInTurn(next, others, run, none);
  });
}

/** Prepares a send on the first ranked source that sends from the account and does not hand it over. */
export function prepareSend(descriptor: AccountDescriptor, request: SendRequest) {
  return (_dispatch: Dispatch, _getState: unknown, extra: unknown): Promise<PreparedSend> => {
    const target = targetOf(descriptor);
    return onFirstSender(extra, descriptor, async source => ({
      id: preparationId(),
      target,
      sourceId: source.id,
      prepared: await source.send.prepare(target, request),
    }));
  };
}

/** The fees of each strategy, for a fee picker; empty when the source cannot estimate them apart. */
export function estimateSendFees(
  descriptor: AccountDescriptor,
  request: SendRequest,
  strategies: readonly FeeStrategy[],
) {
  return (_dispatch: Dispatch, _getState: unknown, extra: unknown): Promise<FeeEstimate[]> => {
    const target = targetOf(descriptor);
    return onFirstSender(extra, descriptor, source =>
      source.send.estimateFees
        ? source.send.estimateFees(target, request, strategies)
        : Promise.resolve([]),
    );
  };
}

/** The signature of this very preparation, for a Device Intent job to run on the session it opened. */
export function signSend(prepared: PreparedSend) {
  return (
    _dispatch: Dispatch,
    _getState: unknown,
    extra: unknown,
  ): ((device: SigningDevice) => Observable<SendSignEvent>) => {
    return device =>
      defer(() => {
        if (prepared.prepared.errors.length > 0) {
          throw new TransactionNotSignableError(prepared.prepared.errors[0].name);
        }
        return pinned(extra, prepared).send.sign(prepared.target, prepared.prepared, device);
      }).pipe(
        map((event): SendSignEvent => {
          if (event.type !== "signed") return event;
          const signed: SignedSend = {
            preparationId: prepared.id,
            accountUUID: prepared.target.accountUUID,
            sourceId: prepared.sourceId,
            signed: event.signed,
          };
          return { type: "signed", signed };
        }),
      );
  };
}

/** Broadcasts on the source that prepared it, then heads the account's operations with its pending rows. */
export function broadcastSend(prepared: PreparedSend, signed: SignedSend) {
  return async (
    dispatch: Dispatch,
    _getState: unknown,
    extra: unknown,
  ): Promise<BroadcastedTransaction> => {
    if (
      signed.preparationId !== prepared.id ||
      signed.accountUUID !== prepared.target.accountUUID ||
      signed.sourceId !== prepared.sourceId
    ) {
      throw new SignatureMismatchError("This signature is not of this preparation");
    }
    const source = pinned(extra, prepared);
    const broadcasted = await source.send.broadcast(
      prepared.target,
      prepared.prepared,
      signed.signed,
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

/** Frees what the source holds for a preparation the flow abandons or replaces. */
export function releaseSend(prepared: PreparedSend) {
  return (_dispatch: Dispatch, _getState: unknown, extra: unknown): void => {
    const source = sendersOf(extra, prepared.target.descriptor).find(
      each => each.id === prepared.sourceId,
    );
    source?.send.release?.(prepared.target, prepared.prepared);
  };
}
