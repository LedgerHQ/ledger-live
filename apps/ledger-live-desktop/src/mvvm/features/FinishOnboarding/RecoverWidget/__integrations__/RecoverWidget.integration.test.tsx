import React from "react";
import { Route, Routes } from "react-router";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { getStoreValue } from "~/renderer/store";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import RecoverWidget from "LLD/features/FinishOnboarding/RecoverWidget";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

/** Real `electron-store` is not usable in Jest. */
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);

/** Must match `useUpsellPath`: `ledgerlive://…` → same path with `/` prefix. */
const RECOVER_UPSELL_PATH = "/protect/upsell";
const RECOVER_UPSELL_LEDGER_LIVE_URI = "ledgerlive://protect/upsell";

const protectDesktopDefaultParams = FEATURE_FLAGS_DEFAULTS.protectServicesDesktop.params!;

type ProtectFeatureOverrides = {
  onboardingUpsellUri?: string;
  bannerSubscriptionNotification?: boolean;
};

const protectServicesFeature = ({
  onboardingUpsellUri = RECOVER_UPSELL_LEDGER_LIVE_URI,
  bannerSubscriptionNotification = true,
}: ProtectFeatureOverrides = {}) =>
  withFlagOverrides({
    protectServicesDesktop: {
      enabled: true,
      params: {
        ...protectDesktopDefaultParams,
        protectId: "protect-prod",
        bannerSubscriptionNotification,
        onboardingCompleted: {
          ...protectDesktopDefaultParams.onboardingCompleted,
          upsellURI: onboardingUpsellUri,
        },
      },
    },
  });

function postOnboardingActive(
  deviceModelId: DeviceModelId = DeviceModelId.stax,
): PostOnboardingState {
  return {
    ...postOnboardingInitialState,
    deviceModelId,
    walletEntryPointDismissed: false,
    entryPointFirstDisplayedDate: new Date("2024-06-01"),
    walletEntryPointEligibleForPortfolio: true,
    actionsToComplete: [PostOnboardingActionId.syncAccounts],
    actionsCompleted: { [PostOnboardingActionId.syncAccounts]: false },
    lastActionCompleted: null,
    postOnboardingInProgress: true,
  };
}

function renderWithProvider(
  postOnboarding: PostOnboardingState,
  featureFlagSlice: ReturnType<typeof withFlagOverrides>,
) {
  const store = createStore({
    state: {
      postOnboarding,
      ...featureFlagSlice,
    } as State,
    dbMiddleware,
  });
  return render(
    <Routes>
      <Route
        path="/"
        element={
          <PostOnboardingProviderWrapped>
            <RecoverWidget />
          </PostOnboardingProviderWrapped>
        }
      />
      <Route
        path={RECOVER_UPSELL_PATH}
        element={<div data-testid="recover-upsell-screen">Recover upsell</div>}
      />
    </Routes>,
    { store, initialRoute: "/" },
  );
}

describe("RecoverWidget integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE);
  });

  it("renders the recover CTA and navigates to the upsell when clicked", async () => {
    const { user } = renderWithProvider(postOnboardingActive(), protectServicesFeature());

    const button = await screen.findByRole("button", {
      name: /Finish securing your backup/i,
    });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(await screen.findByTestId("recover-upsell-screen")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Finish securing your backup/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the upsellURI configuration is not available (prevents broken click)", async () => {
    renderWithProvider(
      postOnboardingActive(),
      protectServicesFeature({ onboardingUpsellUri: "" }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("recover-finish-onboarding-widget")).not.toBeInTheDocument();
    });
  });

  it("renders nothing when recover was never started (NO_SUBSCRIPTION)", async () => {
    mockGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION);
    renderWithProvider(postOnboardingActive(), protectServicesFeature());
    await waitFor(() => {
      expect(screen.queryByTestId("recover-finish-onboarding-widget")).not.toBeInTheDocument();
    });
  });

  it("renders nothing when bannerSubscriptionNotification feature param is false", async () => {
    renderWithProvider(
      postOnboardingActive(),
      protectServicesFeature({ bannerSubscriptionNotification: false }),
    );
    await waitFor(() => {
      expect(screen.queryByTestId("recover-finish-onboarding-widget")).not.toBeInTheDocument();
    });
  });
});
