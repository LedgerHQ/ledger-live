import type { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  filter,
  firstValueFrom,
  lastValueFrom,
  ReplaySubject,
  toArray,
  type Observable,
  type Subscription,
} from "rxjs";
import type {
  LedgerSyncFailureJobState,
  LedgerSyncFailureReason,
  LedgerSyncJobState,
} from "../jobState";

type LedgerSyncJobStateType = LedgerSyncJobState["type"];
type LedgerSyncJobStateOf<T extends LedgerSyncJobStateType> = Extract<
  LedgerSyncJobState,
  { type: T }
>;

function notStubbed(): never {
  throw new Error("TrustchainSDK method not stubbed in this test");
}

// Every method throws unless the test stubs it with its own signature.
export function fakeTrustchainSdk(stubs: Partial<TrustchainSDK>): TrustchainSDK {
  return {
    initMemberCredentials: notStubbed,
    getOrCreateTrustchain: notStubbed,
    restoreTrustchain: notStubbed,
    getMembers: notStubbed,
    removeMember: notStubbed,
    addMember: notStubbed,
    destroyTrustchain: notStubbed,
    destroyApplication: notStubbed,
    encryptUserData: notStubbed,
    decryptUserData: notStubbed,
    invalidateJwt: notStubbed,
    withAuth: notStubbed,
    ...stubs,
  };
}

export function isState<T extends LedgerSyncJobStateType>(
  state: LedgerSyncJobState,
  type: T,
): state is LedgerSyncJobStateOf<T> {
  return state.type === type;
}

// Fails on the state itself, not later with a TypeError on a wrong variant.
export function expectState<T extends LedgerSyncJobStateType>(
  state: LedgerSyncJobState | undefined,
  type: T,
): LedgerSyncJobStateOf<T> {
  if (state === undefined || !isState(state, type)) {
    throw new Error(`Expected a "${type}" state, got ${JSON.stringify(state?.type)}`);
  }
  return state;
}

export function createDeferred<T>() {
  let resolve: (value: T) => void = notStubbed;
  let reject: (error: unknown) => void = notStubbed;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

export function failedState(
  reason: LedgerSyncFailureReason,
  error: Error,
): LedgerSyncFailureJobState {
  return { type: "failed", reason, error };
}

export function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

// Lets a test await the state or the end it expects instead of an arbitrary tick.
export function recordJob(job$: Observable<LedgerSyncJobState>): {
  states: LedgerSyncJobState[];
  subscription: Subscription;
  waitFor: <T extends LedgerSyncJobStateType>(type: T) => Promise<LedgerSyncJobStateOf<T>>;
  ended: () => Promise<LedgerSyncJobState[]>;
} {
  const states: LedgerSyncJobState[] = [];
  const replay = new ReplaySubject<LedgerSyncJobState>();
  const subscription = job$.subscribe({
    next: state => {
      states.push(state);
      replay.next(state);
    },
    error: error => replay.error(error),
    complete: () => replay.complete(),
  });

  return {
    states,
    subscription,
    waitFor: type =>
      firstValueFrom(
        replay.pipe(
          filter((state): state is LedgerSyncJobStateOf<typeof type> => isState(state, type)),
        ),
      ),
    ended: () => lastValueFrom(replay.pipe(toArray())),
  };
}
