import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import type { State } from "~/reducers/types";
import reducer, {
  INITIAL_STATE,
  clearOsUpdates,
  hasBackupSelector,
  hasOsUpdatesSelector,
  osUpdatesSelector,
  setHasBackup,
  setOsUpdates,
} from "./osUpdateSlice";

const osUpdate = { finalFirmware: { version: "1.2.3" } } as OsUpdate;
const toState = (osUpdateState: typeof INITIAL_STATE) => ({ osUpdate: osUpdateState }) as State;

describe("osUpdateSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@init" })).toEqual({ osUpdates: [], hasBackup: false });
  });

  it("stores the resolved updates, replacing previous ones", () => {
    const first = reducer(INITIAL_STATE, setOsUpdates([osUpdate]));
    const second = reducer(first, setOsUpdates([]));

    expect(first.osUpdates).toEqual([osUpdate]);
    expect(second.osUpdates).toEqual([]);
  });

  it("clears the updates", () => {
    const state = reducer({ ...INITIAL_STATE, osUpdates: [osUpdate] }, clearOsUpdates());

    expect(state.osUpdates).toEqual([]);
  });

  it("exposes selectors", () => {
    expect(osUpdatesSelector(toState({ ...INITIAL_STATE, osUpdates: [osUpdate] }))).toEqual([
      osUpdate,
    ]);
    expect(hasOsUpdatesSelector(toState({ ...INITIAL_STATE, osUpdates: [osUpdate] }))).toBe(true);
    expect(hasOsUpdatesSelector(toState(INITIAL_STATE))).toBe(false);
  });

  it("stores whether a backup is waiting to be restored", () => {
    const state = reducer(INITIAL_STATE, setHasBackup(true));

    expect(state.hasBackup).toBe(true);
    expect(hasBackupSelector(toState(state))).toBe(true);
    expect(hasBackupSelector(toState(reducer(state, setHasBackup(false))))).toBe(false);
  });
});
