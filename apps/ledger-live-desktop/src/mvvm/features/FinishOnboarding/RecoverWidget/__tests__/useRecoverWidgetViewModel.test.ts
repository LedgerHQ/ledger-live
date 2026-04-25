/** Real `electron-store` is not usable in Jest; keep persistence at the boundary. */
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
jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

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

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);
const mockUseFeature = jest.mocked(useFeature);
const mockGetStoreValue = jest.mocked(getStoreValue);
const mockIsRecoverDisplayed = jest.mocked(isRecoverDisplayed);
const mockUseUpsellPath = jest.mocked(useUpsellPath);
const recoverFeature = {
  enabled: true,
  params: {
    protectId: "protect-prod",
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

describe("useRecoverWidgetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseFeature.mockReturnValue(recoverFeature);
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockIsRecoverDisplayed.mockReturnValue(true);
    setHub({});

    mockGetStoreValue.mockImplementation(
      async () => LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
    );
  });

  it("returns isVisible true after subscription loads when the recover offer is available", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });
  });

  it("returns isVisible false when post-onboarding is not in progress", async () => {
    setHub({ postOnboardingInProgress: false });
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(mockGetStoreValue).toHaveBeenCalled();
    });
    expect(result.current.isVisible).toBe(false);
  });

  it("returns isVisible false when recover is not offered for this device", async () => {
    mockIsRecoverDisplayed.mockReturnValue(false);
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(mockGetStoreValue).toHaveBeenCalled();
    });
    expect(result.current.isVisible).toBe(false);
  });

  it("returns isVisible false when backup is already done", async () => {
    mockGetStoreValue.mockImplementation(
      async () => LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
    );
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
  });

  it("returns isVisible false when there is no upsell path", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    const { result } = renderHook(() => useRecoverWidgetViewModel());

    await waitFor(() => {
      expect(mockGetStoreValue).toHaveBeenCalled();
    });
    expect(result.current.isVisible).toBe(false);
  });

  it("navigates to the upsell path and tracks when the CTA is used", async () => {
    const { result } = renderHook(() => useRecoverWidgetViewModel());
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
