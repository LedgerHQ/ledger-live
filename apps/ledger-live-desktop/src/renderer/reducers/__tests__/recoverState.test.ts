import {
  INITIAL_STATE,
  recoverStateReducer,
  selectRecoverStateByProtectId,
  setDisplayBanner,
  setRecoverState,
} from "../recoverState";
import type { State } from "~/renderer/reducers";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

const PROTECT_ID = "protect-test";
const OTHER_PROTECT_ID = "protect-other";

describe("recoverState reducer", () => {
  it("should return a default entry for an unknown protectId", () => {
    const state = {
      recoverState: INITIAL_STATE,
    } as State;

    expect(selectRecoverStateByProtectId(PROTECT_ID)(state)).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
      displayBanner: true,
    });
  });

  it("should set subscription state and default displayBanner to true", () => {
    const state = recoverStateReducer(
      INITIAL_STATE,
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      }),
    );

    expect(state.protectIdState[PROTECT_ID]).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      displayBanner: true,
    });
  });

  it("should preserve displayBanner when setting subscription state", () => {
    const dismissedState = recoverStateReducer(
      INITIAL_STATE,
      setDisplayBanner({ protectId: PROTECT_ID, displayBanner: false }),
    );

    const state = recoverStateReducer(
      dismissedState,
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY,
      }),
    );

    expect(state.protectIdState[PROTECT_ID]).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY,
      displayBanner: false,
    });
  });

  it("should preserve subscription state when setting displayBanner", () => {
    const inProgressState = recoverStateReducer(
      INITIAL_STATE,
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      }),
    );

    const state = recoverStateReducer(
      inProgressState,
      setDisplayBanner({ protectId: PROTECT_ID, displayBanner: false }),
    );

    expect(state.protectIdState[PROTECT_ID]).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      displayBanner: false,
    });
  });

  it("should keep protectId entries isolated", () => {
    const firstState = recoverStateReducer(
      INITIAL_STATE,
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      }),
    );

    const state = recoverStateReducer(
      firstState,
      setRecoverState({
        protectId: OTHER_PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
    );

    expect(state.protectIdState[PROTECT_ID]?.subscriptionState).toBe(
      LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
    );
    expect(state.protectIdState[OTHER_PROTECT_ID]?.subscriptionState).toBe(
      LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
    );
  });
});
