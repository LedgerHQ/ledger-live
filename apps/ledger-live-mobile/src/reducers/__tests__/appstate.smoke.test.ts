import {
  addBackgroundEvent,
  blockPasswordLock,
  clearBackgroundEvents,
  dequeueBackgroundEvent,
  openDebugMenu,
  reboot,
  setHasConnectedDevice,
  setModalLock,
  updateMainNavigatorVisibility,
} from "~/actions/appstate";
import { makeSetEarnInfoModalAction } from "~/actions/earn";
import { AppStateActionTypes } from "~/actions/types";
import type { Action } from "redux-actions";
import type { AppStatePayload, DangerouslyOverrideStatePayload } from "~/actions/types";
import reducer, {
  INITIAL_STATE,
  backgroundEventsSelector,
  hasConnectedDeviceSelector,
  isMainNavigatorVisibleSelector,
} from "../appstate";
import type { State } from "../types";

describe("appstate reducer smoke", () => {
  it("should set debugMenuVisible when openDebugMenu is dispatched", () => {
    expect(reducer(INITIAL_STATE, openDebugMenu()).debugMenuVisible).toBe(true);
  });

  it("should increment rebootId when reboot is dispatched", () => {
    expect(reducer(INITIAL_STATE, reboot()).rebootId).toBe(1);
  });

  it("should set isPasswordLockBlocked when blockPasswordLock is dispatched", () => {
    expect(reducer(INITIAL_STATE, blockPasswordLock(true)).isPasswordLockBlocked).toBe(true);
  });

  it("should set modalLock when setModalLock is dispatched", () => {
    expect(reducer(INITIAL_STATE, setModalLock(true)).modalLock).toBe(true);
  });

  it("should set hasConnectedDevice when setHasConnectedDevice is dispatched", () => {
    const next = reducer(INITIAL_STATE, setHasConnectedDevice(true));
    expect(next.hasConnectedDevice).toBe(true);
    const state = { appstate: next } as unknown as State;
    expect(hasConnectedDeviceSelector(state)).toBe(true);
  });

  it("should queue then dequeue background events", () => {
    const event = { type: "log" as const, message: "test" };
    let next = reducer(INITIAL_STATE, addBackgroundEvent({ event }));
    expect(next.backgroundEvents).toHaveLength(1);
    next = reducer(next, dequeueBackgroundEvent());
    expect(next.backgroundEvents).toHaveLength(0);
  });

  it("should clear background events", () => {
    const event = { type: "log" as const, message: "test" };
    let next = reducer(INITIAL_STATE, addBackgroundEvent({ event }));
    next = reducer(next, clearBackgroundEvents());
    expect(next.backgroundEvents).toEqual([]);
  });

  it("should expose backgroundEventsSelector", () => {
    const event = { type: "log" as const, message: "x" };
    const next = reducer(INITIAL_STATE, addBackgroundEvent({ event }));
    const state = { appstate: next } as unknown as State;
    expect(backgroundEventsSelector(state)).toHaveLength(1);
  });

  it("should set isMainNavigatorVisible when updateMainNavigatorVisibility is dispatched", () => {
    const next = reducer(INITIAL_STATE, updateMainNavigatorVisibility(false));
    expect(next.isMainNavigatorVisible).toBe(false);
    const state = { appstate: next } as unknown as State;
    expect(isMainNavigatorVisibleSelector(state)).toBe(false);
  });

  it("should merge appstate slice from dangerously override payload", () => {
    const action = {
      type: AppStateActionTypes.DANGEROUSLY_OVERRIDE_STATE,
      payload: { appstate: { modalLock: true } } as DangerouslyOverrideStatePayload,
    } as Action<DangerouslyOverrideStatePayload>;

    const next = reducer(INITIAL_STATE, action as unknown as Action<AppStatePayload>);
    expect(next.modalLock).toBe(true);
  });

  it("should set isPasswordLockBlocked when earn info modal action is dispatched", () => {
    const next = reducer(
      INITIAL_STATE,
      makeSetEarnInfoModalAction(undefined) as unknown as Action<AppStatePayload>,
    );
    expect(next.isPasswordLockBlocked).toBe(true);
  });
});
