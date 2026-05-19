import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { Linking } from "react-native";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useRecoverBannerViewModel from "../useRecoverBannerViewModel";
import { withBannerEnabled, withRecoverState } from "../../../utils/recoverTestHelpers";

const mockUseCustomURI = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useCustomURI: () => mockUseCustomURI(),
}));

jest.mock("../useAddRecoverPostOnboardingAction", () => ({
  useAddRecoverPostOnboardingAction: jest.fn(),
}));

const mockRecoverUri = "ledgerlive://recover/test";

describe("useRecoverBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomURI.mockReturnValue(mockRecoverUri);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  describe("shouldDisplay", () => {
    it("returns truthy when all conditions are met", async () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withBannerEnabled(
            withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, true)(state),
          ),
      });

      await waitFor(() => expect(result.current.shouldDisplay).toBeTruthy());
    });

    it("returns falsy when banner feature flag is disabled", () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: withRecoverState(
          LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          true,
        ),
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when bannerSubscriptionNotification is explicitly false", () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withFlagOverrides({
            protectServicesMobile: {
              enabled: true,
              params: { bannerSubscriptionNotification: false },
            },
          })(withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, true)(state)),
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when displayBanner is false in Redux", () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withBannerEnabled(
            withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, false)(state),
          ),
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when subscription state is NO_SUBSCRIPTION", () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withBannerEnabled(
            withRecoverState(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, true)(state),
          ),
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });

    it("returns falsy when subscription state is BACKUP_DONE", () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withBannerEnabled(
            withRecoverState(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE, true)(state),
          ),
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });
  });

  describe("onCloseBanner", () => {
    it("clears shouldDisplay when called", async () => {
      const { result } = renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state =>
          withBannerEnabled(
            withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, true)(state),
          ),
      });

      await waitFor(() => expect(result.current.shouldDisplay).toBeTruthy());

      act(() => {
        result.current.onCloseBanner();
      });

      expect(result.current.shouldDisplay).toBeFalsy();
    });
  });

  describe("onRedirectRecover", () => {
    it("opens the recover URI via Linking", async () => {
      const { result } = renderHook(() => useRecoverBannerViewModel());

      result.current.onRedirectRecover();

      await waitFor(() => expect(Linking.canOpenURL).toHaveBeenCalledWith(mockRecoverUri));
      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith(mockRecoverUri));
    });

    it("does nothing when recoverResumeActivatePath is undefined", async () => {
      mockUseCustomURI.mockReturnValue(undefined);

      const { result } = renderHook(() => useRecoverBannerViewModel());

      result.current.onRedirectRecover();

      expect(Linking.canOpenURL).not.toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });
});
