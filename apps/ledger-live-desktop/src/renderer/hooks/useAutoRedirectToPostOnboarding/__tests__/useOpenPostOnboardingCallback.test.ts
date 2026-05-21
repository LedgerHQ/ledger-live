import { act, renderHook, waitFor } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { getStoreValue } from "~/renderer/store";
import { useOpenPostOnboardingCallback } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useOpenPostOnboardingCallback";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index");
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useUpsellPath: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback", () => ({
  useStartPostOnboardingCallback: jest.fn(),
}));

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
const mockGetStoreValue = jest.mocked(getStoreValue);
const mockUseStartPostOnboardingCallback = jest.mocked(useStartPostOnboardingCallback);

const mockHandleStartPostOnboarding = jest.fn();
const fallbackRedirection = jest.fn();

async function invokeCallbackAndGetArgs(deviceModelId = DeviceModelId.stax) {
  const { result } = renderHook(() => useOpenPostOnboardingCallback());
  act(() => {
    result.current({ deviceModelId, fallbackRedirection });
  });
  await waitFor(() => {
    expect(mockHandleStartPostOnboarding).toHaveBeenCalledTimes(1);
  });
  return mockHandleStartPostOnboarding.mock.calls[0][0];
}

describe("useOpenPostOnboardingCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeature.mockReturnValue(recoverFeature);
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockIsRecoverDisplayed.mockReturnValue(true);
    mockGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE);
    mockUseStartPostOnboardingCallback.mockReturnValue(mockHandleStartPostOnboarding);
  });

  it("sets canShowRecover true when offer, upsell path, and in-progress storage state all hold", async () => {
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(true);
    expect(args.deviceModelId).toBe(DeviceModelId.stax);
    expect(args.fallbackIfNoAction).toBe(fallbackRedirection);
  });

  it("sets canShowRecover true when subscription state is BACKUP_DONE", async () => {
    mockGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(true);
  });

  it("sets canShowRecover false when isRecoverDisplayed returns false (feature flag / device gating)", async () => {
    mockIsRecoverDisplayed.mockReturnValue(false);
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(false);
  });

  it("sets canShowRecover false when upsell path is not available", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(false);
  });

  it("sets canShowRecover false when subscription state is NO_SUBSCRIPTION", async () => {
    mockGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION);
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(false);
  });

  it("sets canShowRecover false when subscription state is missing", async () => {
    mockGetStoreValue.mockReturnValue(undefined);
    const args = await invokeCallbackAndGetArgs();
    expect(args.canShowRecover).toBe(false);
  });
});
