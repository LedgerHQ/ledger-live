import type {
  KeyRingMemberKeyRecord,
  KeyRingState,
  KeyRingTreeRecord,
} from "@domain/entity-key-ring";
import type { KeyRingMemberKeyUpdate, KeyRingSession, KeyRingTreeUpdate } from "../types";

/** The session of `state`: one per slice state, so a selector returns the same session until the slice changes. */
export function sessionOf(state: KeyRingState): KeyRingSession {
  const existing = sessionsByState.get(state);
  if (existing) return existing;
  const session: KeyRingSession = Object.freeze({ kind: "KeyRingSession" });
  sessionStates.set(session, state);
  sessionsByState.set(state, session);
  return session;
}

/** The slice state behind `session`. Throws on a session `sessionOf` did not create. */
export function stateOf(session: KeyRingSession): KeyRingState {
  const state = sessionStates.get(session);
  if (!state) throw new Error("Unknown key ring session");
  return state;
}

/** Wraps a key tree record in an opaque update. */
export function treeUpdateOf(record: KeyRingTreeRecord): KeyRingTreeUpdate {
  const update: KeyRingTreeUpdate = Object.freeze({ kind: "KeyRingTreeUpdate" });
  treeRecords.set(update, record);
  return update;
}

/** The key tree record behind `update`. Throws on an update `treeUpdateOf` did not create. */
export function treeRecordOf(update: KeyRingTreeUpdate): KeyRingTreeRecord {
  const record = treeRecords.get(update);
  if (!record) throw new Error("Unknown key ring tree update");
  return record;
}

/** Wraps a member key record in an opaque update. */
export function memberKeyUpdateOf(record: KeyRingMemberKeyRecord): KeyRingMemberKeyUpdate {
  const update: KeyRingMemberKeyUpdate = Object.freeze({ kind: "KeyRingMemberKeyUpdate" });
  memberKeyRecords.set(update, record);
  return update;
}

/** The member key record behind `update`. Throws on an update `memberKeyUpdateOf` did not create. */
export function memberKeyRecordOf(update: KeyRingMemberKeyUpdate): KeyRingMemberKeyRecord {
  const record = memberKeyRecords.get(update);
  if (!record) throw new Error("Unknown key ring member key update");
  return record;
}

// Opaque values are plain tokens; what they stand for lives here, out of reach of callers.
const sessionStates = new WeakMap<KeyRingSession, KeyRingState>();
const sessionsByState = new WeakMap<KeyRingState, KeyRingSession>();
const treeRecords = new WeakMap<KeyRingTreeUpdate, KeyRingTreeRecord>();
const memberKeyRecords = new WeakMap<KeyRingMemberKeyUpdate, KeyRingMemberKeyRecord>();
