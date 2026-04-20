import { Subject } from "rxjs";

interface AleoPrivateSyncProgressEvent {
  accountId: string;
  progress: number | null;
}

/**
 * Hot RxJS Subject emitting Aleo private-sync progress events.
 *
 * Updated directly by createPrivateSyncObservable — completely bypassing the
 * accounts Redux reducer. UI consumers subscribe and filter by accountId.
 *
 * Using a Subject (not BehaviorSubject) is intentional: consumers that mount
 * after a sync starts will see the next emitted tick (at most 150 ms delay)
 * rather than stale state from a previous sync.
 */
export const aleoPrivateSyncProgress$ = new Subject<AleoPrivateSyncProgressEvent>();

/**
 * Synchronous cache of the current in-flight progress per account.
 * Updated atomically alongside every subject emission so that React's lazy
 * useState initializer can read the current value during the first render —
 * before any useEffect fires — avoiding a visible flash from idle → in-progress.
 */
const _inFlightProgress = new Map<string, number>();

/**
 * Returns the current in-flight sync progress (0–100) for an account,
 * or null if no sync is running. Safe to call during render.
 */
export function getAleoSyncProgress(accountId: string): number | null {
  return _inFlightProgress.get(accountId) ?? null;
}

/** Initialise the progress map for a fresh sync start. */
export function emitAleoSyncInit(accountId: string): void {
  if (_inFlightProgress.has(accountId)) return;
  _inFlightProgress.set(accountId, 0);
}

/** Notify listeners that progress advanced for a given account. */
export function emitAleoSyncProgress(accountId: string, progress: number): void {
  _inFlightProgress.set(accountId, progress);
  aleoPrivateSyncProgress$.next({ accountId, progress });
}

/** Notify listeners that the sync for a given account has ended. */
export function emitAleoSyncDone(accountId: string): void {
  _inFlightProgress.delete(accountId);
  aleoPrivateSyncProgress$.next({ accountId, progress: null });
}
