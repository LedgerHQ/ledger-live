import { act, renderHook, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { getStoreValue } from "~/renderer/store";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
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
const mockUseUpsellPath = jest.mocked(useUpsellPath);
const mockGetStoreValue = jest.mocked(getStoreValue);
const PROTECT_ID = "protect-prod";

function recoverFeatureWith(overrides: { bannerSubscriptionNotification?: boolean } = {}) {
  return {
    enabled: true,
    params: {
      protectId: PROTECT_ID,
      bannerSubscriptionNotification: overrides.bannerSubscriptionNotification ?? true,
    },
  };
}

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
    mockUseFeature.mockReturnValue(recoverFeatureWith());
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockGetStoreValue.mockReturnValue(undefined);
    setHub({});
  });

  it("returns shouldDisplay true when banner notification is on, subscription is in progress, and banner is not dismissed", async () => {
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(true);
    });
  });

  it("returns shouldDisplay false when bannerSubscriptionNotification feature param is false", async () => {
    mockUseFeature.mockReturnValue(recoverFeatureWith({ bannerSubscriptionNotification: false }));
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("returns shouldDisplay false when subscription is NO_SUBSCRIPTION (never started recover)", async () => {
    const { result } = renderRecoverWidgetViewModel(
      LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
    );

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("returns shouldDisplay false when subscription state is not hydrated", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("returns shouldDisplay true after rehydrating subscription state from storage", async () => {
    mockGetStoreValue.mockImplementation((key: string) => {
      if (key === "SUBSCRIPTION_STATE") {
        return LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;
      }
      return undefined;
    });

    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(true);
    });
    expect(mockGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", PROTECT_ID);
  });

  it("returns shouldDisplay true when post-onboarding hub is not in progress but recover criteria are met", async () => {
    setHub({ postOnboardingInProgress: false });
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(true);
    });
  });

  it("returns shouldDisplay false when backup is already done", async () => {
    const { result } = renderRecoverWidgetViewModel(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("returns shouldDisplay false when the user has dismissed the banner", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel(), {
      initialState: withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, false),
    });

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("returns shouldDisplay false when upsellPath is undefined", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    const { result } = renderRecoverWidgetViewModel();

    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(false);
    });
  });

  it("navigates to the upsell path and tracks when the CTA is used", async () => {
    const { result } = renderRecoverWidgetViewModel();
    await waitFor(() => {
      expect(result.current.shouldDisplay).toBe(true);
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
