import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

const REFRESHER_ENABLING_DELAY = 3000;

interface SessionRefresherState {
  enabled: boolean;
  sessionId: string | null;
  blockerId: string | null;
  pending: number;
  enableFn: (() => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
}

const initialState: SessionRefresherState = {
  enabled: true,
  sessionId: null,
  blockerId: null,
  pending: 0,
  enableFn: null,
  timer: null,
};

type Action =
  | { type: "RESET" }
  | { type: "DISABLE"; sdk: DeviceManagementKit; sessionId: string }
  | { type: "MAYBE_ENABLE" }
  | { type: "FORCE_ENABLE" }
  | { type: "TIMER_EXPIRED" };

function sessionRefresherReducer(
  state: SessionRefresherState,
  action: Action,
): SessionRefresherState {
  switch (action.type) {
    case "RESET":
      if (state.timer) {
        clearTimeout(state.timer);
      }
      return { ...initialState };

    case "DISABLE": {
      // if we're disabled but with a different session, force-enable first
      if (
        !state.enabled &&
        state.sessionId &&
        state.sessionId !== action.sessionId &&
        state.enableFn
      ) {
        state.enableFn();
        state = { ...initialState };
      }
      // cancel any pending timer
      if (state.timer) {
        clearTimeout(state.timer);
      }
      // if currently enabled, disable and store a new blocker
      if (state.enabled) {
        const blockerId = "blockerId" + Math.random().toString(36).substring(2);
        const enableFn = action.sdk.disableDeviceSessionRefresher({
          sessionId: action.sessionId,
          blockerId,
        });
        return {
          enabled: false,
          sessionId: action.sessionId,
          blockerId,
          pending: state.pending + 1,
          enableFn,
          timer: null,
        };
      }
      // already disabled: simply update session and increment pending count
      return {
        ...state,
        sessionId: action.sessionId,
        pending: state.pending + 1,
        timer: null,
      };
    }

    case "MAYBE_ENABLE": {
      // decrement pending count, never below zero
      const newPending = Math.max(state.pending - 1, 0);
      if (state.timer) {
        clearTimeout(state.timer);
      }
      // if no pending exchanges remain and we're disabled, schedule the enable
      if (newPending === 0 && !state.enabled && state.enableFn) {
        const timer = setTimeout(() => {
          // dispatch the timer expired action
          SessionRefresherManager.dispatch({ type: "TIMER_EXPIRED" });
        }, REFRESHER_ENABLING_DELAY);
        return { ...state, pending: newPending, timer };
      }
      return { ...state, pending: newPending };
    }

    case "TIMER_EXPIRED": {
      // timer expired: if still no pending exchanges, re‑enable
      if (state.pending === 0 && !state.enabled && state.enableFn) {
        state.enableFn();
        return { ...initialState };
      }
      return state;
    }

    case "FORCE_ENABLE": {
      if (!state.enabled && state.enableFn) {
        state.enableFn();
      }
      if (state.timer) {
        clearTimeout(state.timer);
      }
      return { ...initialState };
    }

    default:
      return state;
  }
}

/**
 * singleton manager for controlling the device session refresher
 */
export const SessionRefresherManager = (() => {
  let state: SessionRefresherState = { ...initialState };

  function dispatch(action: Action) {
    state = sessionRefresherReducer(state, action);
  }

  return {
    /**
     * called when an exchange is about to start
     * if a different session is passed while disabled, force-enables the previous session
     */
    disableIfNeeded: (sdk: DeviceManagementKit, sessionId: string) => {
      dispatch({ type: "DISABLE", sdk, sessionId });
    },

    /**
     * called when an exchange finishes
     * decrements the pending counter and, if it reaches zero, schedules an enable
     */
    maybeEnable: () => {
      dispatch({ type: "MAYBE_ENABLE" });
    },

    /**
     * immediately force-enables the refresher and resets the state
     */
    forceEnable: () => {
      dispatch({ type: "FORCE_ENABLE" });
    },

    /**
     * resets the manager to its initial state
     */
    reset: () => {
      dispatch({ type: "RESET" });
    },

    // for testing or debugging purposes
    getState: () => ({ ...state }),

    // expose dispatch for the timer callback
    dispatch,
  };
})();
