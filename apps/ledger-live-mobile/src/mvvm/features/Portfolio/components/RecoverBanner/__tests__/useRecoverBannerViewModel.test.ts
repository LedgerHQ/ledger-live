import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { Linking } from "react-native";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { State } from "~/reducers/types";
import useRecoverBannerViewModel from "../useRecoverBannerViewModel";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseCustomURI = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useCustomURI: () => mockUseCustomURI(),
}));

const mockActionsState = jest.fn();
jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: () => mockActionsState(),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  addPostOnboardingAction: jest.fn(args => ({ type: "ADD_POST_ONBOARDING_ACTION", ...args })),
}));

const mockAddPostOnboardingAction = jest.mocked(addPostOnboardingAction);

const mockRecoverUri = "ledgerlive://recover/test";

const PROTECT_ID = "protect-simu";

const withBannerEnabled = withFlagOverrides({
  protectServicesMobile: {
    enabled: true,
    params: { bannerSubscriptionNotification: true, protectId: PROTECT_ID },
  },
});

function withRecoverState(
  subscriptionState: LedgerRecoverSubscriptionStateEnum,
  displayBanner: boolean,
  protectId = PROTECT_ID,
) {
  return (state: State): State => ({
    ...state,
    recoverState: {
      protectIdState: {
        [protectId]: { subscriptionState, displayBanner },
      },
    },
  });
}

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

  describe("addPostOnboardingAction dispatch", () => {
    it.each([
      LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
      LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
    ])("dispatches for valid state %s", async subscriptionState => {
      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: { subscriptionState: subscriptionState, displayBanner: true },
            },
          },
        }),
      });

      await waitFor(() =>
        expect(mockAddPostOnboardingAction).toHaveBeenCalledWith({
          actionId: PostOnboardingActionId.recover,
        }),
      );
    });

    it("does not dispatch when actionStateRecover already exists", () => {
      mockActionsState.mockReturnValue({
        actionsState: [{ id: PostOnboardingActionId.recover }],
      });

      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
                displayBanner: true,
              },
            },
          },
        }),
      });

      expect(mockAddPostOnboardingAction).not.toHaveBeenCalled();
    });

    it("does not dispatch when subscriptionState is NO_SUBSCRIPTION", () => {
      renderHook(() => useRecoverBannerViewModel(), {
        overrideInitialState: state => ({
          ...state,
          recoverState: {
            protectIdState: {
              [PROTECT_ID]: {
                subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
                displayBanner: true,
              },
            },
          },
        }),
      });

      expect(mockAddPostOnboardingAction).not.toHaveBeenCalled();
    });
  });
});
