/** Real `electron-store` is not usable in Jest. */
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useUpsellPath: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useFeature: jest.fn(),
}));

import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { getStoreValue } from "~/renderer/store";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import RecoverWidget from "LLD/features/FinishOnboarding/RecoverWidget";

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseFeature = jest.mocked(useFeature);
const mockUseUpsellPath = jest.mocked(useUpsellPath);
const mockGetStoreValue = jest.mocked(getStoreValue);

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

function renderWithProvider(postOnboarding: PostOnboardingState) {
  const store = createStore({
    state: { postOnboarding } as State,
    dbMiddleware,
  });
  return render(
    <PostOnboardingProviderWrapped>
      <RecoverWidget />
    </PostOnboardingProviderWrapped>,
    { store },
  );
}

describe("RecoverWidget integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseUpsellPath.mockReturnValue("/protect/upsell");
    mockGetStoreValue.mockImplementation(async () => "NO_SUBSCRIPTION");
    mockUseFeature.mockImplementation((id: string) =>
      id === "protectServicesDesktop"
        ? {
            enabled: true,
            params: {
              protectId: "protect-prod",
              compatibleDevices: [{ name: DeviceModelId.stax, available: true }],
            },
          }
        : null,
    ) as unknown as typeof useFeature;
  });

  it("renders the recover CTA and navigates to the upsell when clicked", async () => {
    const { user } = renderWithProvider(postOnboardingActive());

    const button = await screen.findByRole("button", {
      name: /Finish securing your backup/i,
    });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/protect/upsell");
  });

  it("renders nothing for the recover widget when the upsell is unavailable", async () => {
    mockUseUpsellPath.mockReturnValue(undefined);
    const { container } = renderWithProvider(postOnboardingActive());
    await waitFor(() => {
      expect(mockGetStoreValue).toHaveBeenCalled();
    });
    expect(container.querySelector('[data-testid="recover-finish-onboarding-widget"]')).toBeNull();
  });
});
