import { act, renderHook, waitFor } from "@tests/test-renderer";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { setRecoverState } from "~/reducers/recoverState";
import { getStoreValue, setStoreValue } from "~/store";
import useRecoverBannerState from "../useRecoverBannerState";
import { PROTECT_ID, withRecoverState } from "../../utils/recoverTestHelpers";

jest.mock("~/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);
const mockSetStoreValue = jest.mocked(setStoreValue);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStoreValue.mockResolvedValue(undefined);
  mockSetStoreValue.mockResolvedValue(undefined);
});

describe("useRecoverBannerState", () => {
  describe("reading state from Redux", () => {
    it("returns NO_SUBSCRIPTION and displayBanner true by default", () => {
      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID));

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
        displayBanner: true,
      });
    });

    it("reflects subscriptionState and displayBanner from Redux store", () => {
      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
        displayBanner: true,
      });
    });

    it("updates reactively when the Redux store changes", () => {
      const { result, store } = renderHook(() => useRecoverBannerState(PROTECT_ID));

      expect(result.current.data.displayBanner).toBe(true);

      act(() => {
        store.dispatch(
          setRecoverState({
            protectId: PROTECT_ID,
            subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
          }),
        );
      });

      expect(result.current.data).toEqual({
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
        displayBanner: true,
      });
    });
  });

  describe("storage persistence", () => {
    it("restores dismissed state from storage on mount", async () => {
      mockGetStoreValue.mockResolvedValue("false");

      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      await waitFor(() => expect(result.current.data.displayBanner).toBe(false));
      expect(mockGetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", PROTECT_ID);
    });

    it("does not modify displayBanner when storage has no stored value", async () => {
      mockGetStoreValue.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalled());
      expect(result.current.data.displayBanner).toBe(true);
    });

    it("writes dismissal to storage", () => {
      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      act(() => result.current.dismissBanner());

      expect(mockSetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", "false", PROTECT_ID);
    });
  });

  describe("dismissBanner", () => {
    it("dispatches setDisplayBanner false to Redux", () => {
      const { result, store } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      act(() => result.current.dismissBanner());

      expect(store.getState().recoverState.protectIdState[PROTECT_ID].displayBanner).toBe(false);
    });

    it("reflects dismissal immediately in data", () => {
      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      expect(result.current.data.displayBanner).toBe(true);

      act(() => result.current.dismissBanner());

      expect(result.current.data.displayBanner).toBe(false);
    });

    it("preserves subscriptionState when dismissing", () => {
      const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
          true,
        ),
      });

      act(() => result.current.dismissBanner());

      expect(result.current.data.subscriptionState).toBe(
        LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      );
    });
  });
});
