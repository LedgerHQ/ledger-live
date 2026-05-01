import { act, renderHook } from "@tests/test-renderer";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { setRecoverState } from "~/reducers/recoverState";
import useRecoverBannerStorage from "../useRecoverBannerStorage";

const PROTECT_ID = "protect-prod";

describe("useRecoverBannerStorage", () => {
  describe("reading state from Redux", () => {
    it("returns NO_SUBSCRIPTION and displayBanner false by default", () => {
      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
        displayBanner: false,
      });
    });

    it("reflects subscriptionState and displayBanner from Redux store", () => {
      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
                displayBanner: true,
              },
            },
          },
        }),
      });

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
        displayBanner: true,
      });
    });

    it("updates reactively when the Redux store changes", () => {
      const { result, store } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      expect(result.current.data.displayBanner).toBe(false);

      act(() => {
        store.dispatch(
          setRecoverState({
            protectId: PROTECT_ID,
            subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
            displayBanner: true,
          }),
        );
      });

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
        displayBanner: true,
      });
    });
  });

  describe("dismissBanner", () => {
    it("dispatches setDisplayBanner false to Redux", () => {
      const { result, store } = renderHook(() => useRecoverBannerStorage(PROTECT_ID), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
                displayBanner: true,
              },
            },
          },
        }),
      });

      act(() => result.current.dismissBanner());

      expect(store.getState().recoverState.protectIdState[PROTECT_ID].displayBanner).toBe(false);
    });

    it("reflects dismissal immediately in data", () => {
      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
                displayBanner: true,
              },
            },
          },
        }),
      });

      expect(result.current.data.displayBanner).toBe(true);

      act(() => result.current.dismissBanner());

      expect(result.current.data.displayBanner).toBe(false);
    });

    it("preserves subscriptionState when dismissing", () => {
      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
                displayBanner: true,
              },
            },
          },
        }),
      });

      act(() => result.current.dismissBanner());

      expect(result.current.data.subscriptionState).toBe(
        LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      );
    });
  });
});
