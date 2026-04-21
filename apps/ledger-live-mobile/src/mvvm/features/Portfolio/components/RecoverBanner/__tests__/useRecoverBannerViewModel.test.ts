import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import type { GestureResponderEvent } from "react-native";
import { Linking } from "react-native";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { getStoreValue, setStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useRecoverBannerViewModel from "../useRecoverBannerViewModel";

jest.mock("~/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

const mockT = jest.fn((key: string) => key);
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockUseCustomURI = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useCustomURI: () => mockUseCustomURI(),
}));

const mockDispatch = jest.fn();
jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

const mockActionsState = jest.fn();
jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: () => mockActionsState(),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  addPostOnboardingAction: jest.fn(args => ({ type: "ADD_POST_ONBOARDING_ACTION", ...args })),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);
const mockSetStoreValue = jest.mocked(setStoreValue);
const mockAddPostOnboardingAction = jest.mocked(addPostOnboardingAction);

const mockRecoverUri = "ledgerlive://recover/test";

const withBannerEnabled = withFlagOverrides({
  protectServicesMobile: {
    enabled: true,
    params: { bannerSubscriptionNotification: true },
  },
});

const makeMockEvent = () =>
  ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }) as unknown as GestureResponderEvent;

describe("useRecoverBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomURI.mockReturnValue(mockRecoverUri);
    mockActionsState.mockReturnValue({ actionsState: [] });
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  describe("shouldDisplay", () => {
    it("returns truthy when all conditions are met", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(result.current.shouldDisplay).toBeTruthy());
    });

    it("returns falsy when banner feature flag is disabled", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel());

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when bannerSubscriptionNotification is explicitly false", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withFlagOverrides({
          protectServicesMobile: {
            enabled: true,
            params: { bannerSubscriptionNotification: false },
          },
        }),
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when display banner state is false in storage", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("false");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when subscription state is NO_SUBSCRIPTION", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when subscription state is BACKUP_DONE", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.shouldDisplay).toBeFalsy();
    });
  });

  describe("stepNumber and isWarning", () => {
    it.each([
      [LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, 1, false],
      [LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, 2, false],
      [LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY, 3, true],
      [LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION, 4, true],
      [LedgerRecoverSubscriptionStateEnum.BACKUP_DONE, 5, true],
    ])(
      "state %s → stepNumber %i, isWarning %s",
      async (subscriptionState, expectedStep, expectedIsWarning) => {
        mockGetStoreValue.mockResolvedValueOnce(subscriptionState).mockResolvedValueOnce("true");

        const { result } = renderHook(() => useRecoverBannerViewModel(), {
          overrideInitialState: withBannerEnabled,
        });

        await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
        expect(result.current.stepNumber).toBe(expectedStep);
        expect(result.current.isWarning).toBe(expectedIsWarning);
      },
    );

    it("exposes maxStepNumber equal to the number of subscription states", async () => {
      mockGetStoreValue.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecoverBannerViewModel());

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(result.current.maxStepNumber).toBe(
        Object.keys(LedgerRecoverSubscriptionStateEnum).length,
      );
    });
  });

  describe("onCloseBanner", () => {
    it("persists DISPLAY_BANNER as false and clears shouldDisplay", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(result.current.shouldDisplay).toBeTruthy());

      act(() => {
        result.current.onCloseBanner(makeMockEvent());
      });

      expect(mockSetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", "false", expect.any(String));
      expect(result.current.shouldDisplay).toBeFalsy();
    });
  });

  describe("onRedirectRecover", () => {
    it("opens the recover URI via Linking", async () => {
      mockGetStoreValue.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecoverBannerViewModel());

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));

      result.current.onRedirectRecover();

      await waitFor(() => expect(Linking.canOpenURL).toHaveBeenCalledWith(mockRecoverUri));
      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith(mockRecoverUri));
    });

    it("does nothing when recoverResumeActivatePath is undefined", async () => {
      mockUseCustomURI.mockReturnValue(undefined);
      mockGetStoreValue.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecoverBannerViewModel());

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));

      result.current.onRedirectRecover();

      expect(Linking.canOpenURL).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe("addPostOnboardingAction dispatch", () => {
    it("dispatches when subscription state is in-progress and no recover action exists", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
      expect(mockAddPostOnboardingAction).toHaveBeenCalledWith({
        actionId: PostOnboardingActionId.recover,
      });
    });

    it("dispatches when subscription state is BACKUP_DONE and no recover action exists", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)
        .mockResolvedValueOnce("true");

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
      expect(mockAddPostOnboardingAction).toHaveBeenCalledWith({
        actionId: PostOnboardingActionId.recover,
      });
    });

    it("does not dispatch when actionStateRecover already exists", async () => {
      mockActionsState.mockReturnValue({
        actionsState: [{ id: PostOnboardingActionId.recover }],
      });
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("does not dispatch when storageState is undefined", async () => {
      mockGetStoreValue.mockResolvedValueOnce(undefined).mockResolvedValueOnce("true");

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("does not dispatch when subscription state is NO_SUBSCRIPTION", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)
        .mockResolvedValueOnce("true");

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withBannerEnabled,
      });

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("storage integration", () => {
    it("queries storage with correct keys and protectId from feature flag params", async () => {
      const customProtectId = "protect-custom";
      mockGetStoreValue.mockResolvedValue(undefined);

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withFlagOverrides({
          protectServicesMobile: {
            enabled: true,
            params: { bannerSubscriptionNotification: true, protectId: customProtectId },
          },
        }),
      });

      await waitFor(() => {
        expect(mockGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", customProtectId);
        expect(mockGetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", customProtectId);
      });
    });
  });
});
