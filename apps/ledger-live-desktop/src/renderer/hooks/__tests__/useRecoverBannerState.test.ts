import { act, renderHook, waitFor } from "tests/testSetup";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { setRecoverState } from "~/renderer/reducers/recoverState";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { useRecoverBannerState } from "../useRecoverBannerState";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);
const mockSetStoreValue = jest.mocked(setStoreValue);
const PROTECT_ID = "protect-test";

function withRecoverState(
  subscriptionState: LedgerRecoverSubscriptionStateEnum,
  displayBanner = true,
) {
  return {
    recoverState: {
      protectIdState: {
        [PROTECT_ID]: { subscriptionState, displayBanner },
      },
    },
  };
}

describe("useRecoverBannerState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoreValue.mockReturnValue(undefined);
  });

  it("should return default state when Redux and storage are empty", () => {
    const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID));

    expect(result.current.data).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
      displayBanner: true,
    });
  });

  it("should rehydrate subscriptionState from storage on mount", async () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") {
        return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      }
      return undefined;
    });

    const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID));

    await waitFor(() =>
      expect(result.current.data.subscriptionState).toBe(
        LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      ),
    );
    expect(mockGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", PROTECT_ID);
  });

  it("should rehydrate dismissed displayBanner state from storage on mount", async () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "DISPLAY_BANNER") return "false";
      return undefined;
    });

    const { result } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
      initialState: withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE),
    });

    await waitFor(() => expect(result.current.data.displayBanner).toBe(false));
    expect(mockGetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", PROTECT_ID);
  });

  it("should update Redux and persist when dismissBanner is called", () => {
    const { result, store } = renderHook(() => useRecoverBannerState(PROTECT_ID), {
      initialState: withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE),
    });

    act(() => {
      result.current.dismissBanner();
    });

    expect(store.getState().recoverState.protectIdState[PROTECT_ID]?.displayBanner).toBe(false);
    expect(result.current.data.displayBanner).toBe(false);
    expect(mockSetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", "false", PROTECT_ID);
  });

  it("should reflect Redux subscription state changes reactively", () => {
    const { result, store } = renderHook(() => useRecoverBannerState(PROTECT_ID));

    act(() => {
      store.dispatch(
        setRecoverState({
          protectId: PROTECT_ID,
          subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
        }),
      );
    });

    expect(result.current.data).toEqual({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      displayBanner: true,
    });
  });
});
