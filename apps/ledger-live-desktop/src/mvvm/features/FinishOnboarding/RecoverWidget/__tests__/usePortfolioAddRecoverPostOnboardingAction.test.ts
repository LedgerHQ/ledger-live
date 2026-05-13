import { renderHook, waitFor } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { usePortfolioAddRecoverPostOnboardingAction } from "LLD/features/FinishOnboarding/RecoverWidget/usePortfolioAddRecoverPostOnboardingAction";
import { useAddRecoverPostOnboardingAction } from "LLD/features/FinishOnboarding/RecoverWidget/useAddRecoverPostOnboardingAction";
import { getStoreValue } from "~/renderer/store";
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
jest.mock(
  "LLD/features/FinishOnboarding/RecoverWidget/useAddRecoverPostOnboardingAction",
  () => ({
    useAddRecoverPostOnboardingAction: jest.fn(),
  }),
);

const PROTECT_ID = "protect-prod";
const recoverFeature = {
  enabled: true,
  params: {
    protectId: PROTECT_ID,
    compatibleDevices: [{ name: DeviceModelId.stax, available: true }],
  },
};

const mockUseFeature = jest.mocked(useFeature);
const mockIsRecoverDisplayed = jest.mocked(isRecoverDisplayed);
const mockUseUpsellPath = jest.mocked(useUpsellPath);
const mockUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);
const mockGetStoreValue = jest.mocked(getStoreValue);
const mockUseAddRecoverPostOnboardingAction = jest.mocked(useAddRecoverPostOnboardingAction);

function setHub(deviceModelId: DeviceModelId | null = DeviceModelId.stax) {
  mockUsePostOnboardingHubState.mockReturnValue({
    lastActionCompleted: null,
    actionsState: [],
    postOnboardingInProgress: true,
    deviceModelId,
  });
}

function renderOrchestrator(
  subscriptionState = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
) {
  return renderHook(() => usePortfolioAddRecoverPostOnboardingAction(), {
    initialState: {
      recoverState: {
        protectIdState: {
          [PROTECT_ID]: { subscriptionState, displayBanner: true },
        },
      },
    },
  });
}

describe("usePortfolioAddRecoverPostOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeature.mockReturnValue(recoverFeature);
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockIsRecoverDisplayed.mockReturnValue(true);
    mockGetStoreValue.mockReturnValue(undefined);
    setHub();
  });

  it("forwards subscriptionState when the offer is available and the upsell path resolves", async () => {
    renderOrchestrator();

    await waitFor(() => {
      expect(mockUseAddRecoverPostOnboardingAction).toHaveBeenLastCalledWith(
        LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      );
    });
  });

  it("forwards undefined when the offer is not displayed for this device", async () => {
    mockIsRecoverDisplayed.mockReturnValue(false);
    renderOrchestrator();

    await waitFor(() => {
      expect(mockUseAddRecoverPostOnboardingAction).toHaveBeenLastCalledWith(undefined);
    });
  });

  it("forwards undefined when there is no upsell path", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    renderOrchestrator();

    await waitFor(() => {
      expect(mockUseAddRecoverPostOnboardingAction).toHaveBeenLastCalledWith(undefined);
    });
  });
});
