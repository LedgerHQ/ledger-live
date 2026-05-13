import { act, renderHook, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { getStoreValue } from "~/renderer/store";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useRecoverWidgetViewModel } from "LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("@ledgerhq/live-common/featureFlags/index");
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useUpsellPath: jest.fn(),
}));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);
const mockUseFeature = jest.mocked(useFeature);
const mockIsRecoverDisplayed = jest.mocked(isRecoverDisplayed);
const mockUseUpsellPath = jest.mocked(useUpsellPath);
const mockGetStoreValue = jest.mocked(getStoreValue);
const PROTECT_ID = "protect-prod";
const recoverFeature = {
  enabled: true,
  params: {
    protectId: PROTECT_ID,
    compatibleDevices: [{ name: DeviceModelId.stax, available: true }],
  },
};

function setHub(overrides: {
  postOnboardingInProgress?: boolean;
  deviceModelId?: DeviceModelId | null;
}) {
  mockUsePostOnboardingHubState.mockReturnValue({
    lastActionCompleted: null,
    actionsState: [],
    postOnboardingInProgress: overrides.postOnboardingInProgress ?? true,
    deviceModelId: overrides.deviceModelId ?? DeviceModelId.stax,
  });
}

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

function renderRecoverWidgetViewModel(
  subscriptionState = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
) {
  return renderHook(() => useRecoverWidgetViewModel(), {
    initialState: withRecoverState(subscriptionState),
  });
}

describe("useRecoverWidgetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseFeature.mockReturnValue(recoverFeature);
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockIsRecoverDisplayed.mockReturnValue(true);
    mockGetStoreValue.mockReturnValue(undefined);
    setHub({});
  });

  it("returns isVisible true when recover flow is in progress and the offer is available", async () => {
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
    expect(result.current.shouldDisplayRecoverInPortfolioBannerRow).toBe(true);
  });

  it("returns isVisible false when subscription is NO_SUBSCRIPTION (never started recover)", async () => {
    const { result } = renderRecoverWidgetViewModel(
      LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
    );

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
    expect(result.current.shouldDisplayRecoverInPortfolioBannerRow).toBe(false);
  });

  it("returns isVisible false when subscription state is not hydrated", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
  });

  it("returns isVisible true after rehydrating subscription state from storage", async () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") {
        return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      }
      return undefined;
    });

    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
    expect(mockGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", PROTECT_ID);
  });

  it("returns isVisible true when post-onboarding hub is not in progress but recover criteria are met", async () => {
    setHub({ postOnboardingInProgress: false });
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
  });

  it("returns isVisible false when recover is not offered for this device", async () => {
    mockIsRecoverDisplayed.mockReturnValue(false);
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
  });

  it("returns isVisible false when backup is already done", async () => {
    const { result } = renderRecoverWidgetViewModel(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
  });

  it("returns isVisible false when there is no upsell path", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
    expect(result.current.shouldDisplayRecoverInPortfolioBannerRow).toBe(false);
  });

  it("returns shouldDisplayRecoverInPortfolioBannerRow false when displayBanner is dismissed but subscription is in progress", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel(), {
      initialState: withRecoverState(
        LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
        false,
      ),
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
    expect(result.current.shouldDisplayRecoverInPortfolioBannerRow).toBe(false);
  });

  it("navigates to the upsell path and tracks when the CTA is used", async () => {
    const { result } = renderRecoverWidgetViewModel();
    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });

    act(() => {
      result.current.onOpenRecover();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/protect/upsell");
    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      deviceModelId: DeviceModelId.stax,
      button: "Post onboarding recover widget",
      flow: "post-onboarding",
    });
  });
});
