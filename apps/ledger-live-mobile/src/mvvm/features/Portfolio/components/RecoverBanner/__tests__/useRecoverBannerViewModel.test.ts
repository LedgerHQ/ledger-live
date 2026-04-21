import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
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

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
        result.current.onCloseBanner();
      });

      await waitFor(() =>
        expect(mockSetStoreValue).toHaveBeenCalledWith(
          "DISPLAY_BANNER",
          "false",
          expect.any(String),
        ),
      );
      await waitFor(() => expect(result.current.shouldDisplay).toBeFalsy());
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
    it.each([
      LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
    ])("dispatches for valid state %s", async state => {
      mockGetStoreValue.mockResolvedValueOnce(state).mockResolvedValueOnce("true");

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

    it("does not dispatch when storage has no subscription state", async () => {
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
