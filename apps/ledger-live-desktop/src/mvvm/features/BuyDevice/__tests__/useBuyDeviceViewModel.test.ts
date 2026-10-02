import { renderHook, act } from "tests/testSetup";
import useBuyDeviceViewModel from "../useBuyDeviceViewModel";
import * as originFlow from "~/renderer/analytics/originFlow";
import { track } from "@shared/analytics";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { addAccountToResumeSelector } from "~/renderer/reducers/onboarding";

// An Add Account flow was started on the portfolio before the Buy Device dialog showed.
const addAccountStarted = {
  addAccountResume: {
    returnTo: "/",
    currency: getCryptoCurrencyById("bitcoin"),
    awaitingOnboarding: false,
  },
};

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("LLD/hooks/useLazyOnboardingActions", () => ({
  useLazyOnboardingActions: () => ({ handleConnect: jest.fn(), handleBuyDevice: jest.fn() }),
}));

const mockTrack = jest.mocked(track);
const mockGetOriginFlow = jest.mocked(originFlow.getOriginFlow);

describe("useBuyDeviceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOriginFlow.mockReturnValue("Manager Dashboard");
  });

  it("tracks modal_shown with trigger from getOriginFlow when modal opens", () => {
    mockGetOriginFlow.mockReturnValue("Send Modal");

    renderHook(() => useBuyDeviceViewModel(), {
      initialState: {
        dialogs: { BUY_DEVICE: true },
        settings: { lastOnboardedDevice: null },
      },
    });

    expect(mockTrack).toHaveBeenCalledWith("modal_shown", {
      modal: "BuyDeviceModal",
      trigger: "Send Modal",
    });
  });

  it("flags the Add Account flow to resume after onboarding when Connect comes from add account", () => {
    mockGetOriginFlow.mockReturnValue(HOOKS_TRACKING_LOCATIONS.addAccountModal);

    const { result, store } = renderHook(() => useBuyDeviceViewModel(), {
      initialState: {
        dialogs: { BUY_DEVICE: true },
        settings: { lastOnboardedDevice: null },
        onboarding: addAccountStarted,
      },
    });

    act(() => {
      result.current.handleConnect();
    });

    expect(addAccountToResumeSelector(store.getState())).not.toBeNull();
  });

  it("does not flag a resume when Connect comes from another flow", () => {
    mockGetOriginFlow.mockReturnValue(HOOKS_TRACKING_LOCATIONS.receiveModal);

    const { result, store } = renderHook(() => useBuyDeviceViewModel(), {
      initialState: {
        dialogs: { BUY_DEVICE: true },
        settings: { lastOnboardedDevice: null },
        onboarding: addAccountStarted,
      },
    });

    act(() => {
      result.current.handleConnect();
    });

    expect(addAccountToResumeSelector(store.getState())).toBeNull();
  });
});
